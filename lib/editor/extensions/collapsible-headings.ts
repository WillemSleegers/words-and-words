import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet, EditorView } from '@tiptap/pm/view'
import { createRoot, Root } from 'react-dom/client'
import { createElement } from 'react'
import { CollapseToggleButton } from '@/components/editor/CollapseToggleButton'

export interface CollapsibleHeadingsStorage {
  collapsedHeadings: Set<string>
  editorView: EditorView | null
}

// Generate a unique key for a heading based on its level and text
export function getHeadingKey(level: number, text: string, index: number): string {
  return `${level}-${index}-${text.slice(0, 50)}`
}

const collapsibleHeadingsPluginKey = new PluginKey('collapsibleHeadings')

// Store roots and update functions by heading key
const widgetData = new Map<string, {
  element: HTMLElement
  root: Root
  update: (isCollapsed: boolean) => void
}>()

function createChevronWidget(
  key: string,
  initialIsCollapsed: boolean,
  storage: CollapsibleHeadingsStorage
): HTMLElement {
  // If we already have a widget for this heading, return it
  // (ProseMirror caches by key, so this shouldn't happen, but just in case)
  const existing = widgetData.get(key)
  if (existing) {
    return existing.element
  }

  const wrapper = document.createElement('span')
  wrapper.className = 'heading-collapse-wrapper'
  wrapper.setAttribute('contenteditable', 'false')

  let currentIsCollapsed = initialIsCollapsed

  const handleToggle = () => {
    if (storage.collapsedHeadings.has(key)) {
      storage.collapsedHeadings.delete(key)
    } else {
      storage.collapsedHeadings.add(key)
    }

    if (storage.editorView) {
      storage.editorView.dispatch(
        storage.editorView.state.tr.setMeta('collapsibleHeadingsUpdate', true)
      )
    }
  }

  const render = (isCollapsed: boolean) => {
    currentIsCollapsed = isCollapsed
    root.render(
      createElement(CollapseToggleButton, {
        key: `${key}-${isCollapsed}`,
        isCollapsed,
        onToggle: handleToggle,
      })
    )
  }

  const root = createRoot(wrapper)

  widgetData.set(key, {
    element: wrapper,
    root,
    update: render,
  })

  render(initialIsCollapsed)

  return wrapper
}

function updateAllWidgets(storage: CollapsibleHeadingsStorage) {
  widgetData.forEach((data, key) => {
    const isCollapsed = storage.collapsedHeadings.has(key)
    data.update(isCollapsed)
  })
}

export const CollapsibleHeadings = Extension.create<object, CollapsibleHeadingsStorage>({
  name: 'collapsibleHeadings',

  addStorage() {
    return {
      collapsedHeadings: new Set<string>(),
      editorView: null,
    }
  },

  addProseMirrorPlugins() {
    const storage = this.storage

    return [
      new Plugin({
        key: collapsibleHeadingsPluginKey,

        view: (view) => {
          storage.editorView = view
          return {
            update: () => {
              // Update all widgets with current collapsed state
              updateAllWidgets(storage)
            },
            destroy: () => {
              storage.editorView = null
            },
          }
        },

        props: {
          decorations: (state) => {
            const { doc } = state
            const decorations: Decoration[] = []

            // First pass: collect all headings with their positions and keys
            const headings: Array<{
              pos: number
              endPos: number
              level: number
              text: string
              key: string
            }> = []

            let headingIndex = 0
            doc.descendants((node, pos) => {
              if (node.type.name === 'heading') {
                const level = node.attrs.level as number
                const text = node.textContent
                const key = getHeadingKey(level, text, headingIndex)
                headings.push({
                  pos,
                  endPos: pos + node.nodeSize,
                  level,
                  text,
                  key,
                })
                headingIndex++
              }
            })

            // Second pass: add decorations
            headings.forEach((heading, idx) => {
              const isCollapsed = storage.collapsedHeadings.has(heading.key)

              // Add chevron widget at the start of the heading (only if heading has text)
              if (heading.text.length > 0) {
                decorations.push(
                  Decoration.widget(
                    heading.pos + 1,
                    () => createChevronWidget(heading.key, isCollapsed, storage),
                    {
                      side: -1,
                      key: `chevron-${heading.key}`,
                      stopEvent: () => true,
                    }
                  )
                )
              }

              // If collapsed, hide all nodes until the next heading of same or higher level
              if (isCollapsed) {
                const nextSameLevelHeading = headings.find(
                  (h, i) => i > idx && h.level <= heading.level
                )
                const hideUntil = nextSameLevelHeading?.pos ?? doc.content.size

                // Find all nodes between this heading and the next one to hide
                doc.nodesBetween(heading.endPos, hideUntil, (node, nodePos) => {
                  if (nodePos >= heading.endPos && nodePos < hideUntil) {
                    decorations.push(
                      Decoration.node(nodePos, nodePos + node.nodeSize, {
                        class: 'collapsed-content',
                      })
                    )
                    return false // Don't descend into this node
                  }
                })
              }
            })

            return DecorationSet.create(doc, decorations)
          },
        },
      }),
    ]
  },
})
