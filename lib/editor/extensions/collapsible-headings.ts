import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet, EditorView } from '@tiptap/pm/view'

export interface CollapsibleHeadingsStorage {
  collapsedHeadings: Set<string>
  editorView: EditorView | null
}

// Generate a unique key for a heading based on its level and text
export function getHeadingKey(level: number, text: string, index: number): string {
  return `${level}-${index}-${text.slice(0, 50)}`
}

const collapsibleHeadingsPluginKey = new PluginKey('collapsibleHeadings')

function createChevronWidget(
  key: string,
  isCollapsed: boolean,
  storage: CollapsibleHeadingsStorage
): HTMLElement {
  const wrapper = document.createElement('span')
  wrapper.className = 'heading-collapse-wrapper'
  wrapper.setAttribute('contenteditable', 'false')

  const button = document.createElement('button')
  button.type = 'button'
  button.className = `heading-collapse-toggle ${isCollapsed ? 'collapsed' : ''}`
  button.innerHTML = isCollapsed
    ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>'
    : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>'

  button.onmousedown = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (storage.collapsedHeadings.has(key)) {
      storage.collapsedHeadings.delete(key)
    } else {
      storage.collapsedHeadings.add(key)
    }

    // Force a re-render by dispatching a transaction
    if (storage.editorView) {
      storage.editorView.dispatch(
        storage.editorView.state.tr.setMeta('collapsibleHeadingsUpdate', true)
      )
    }
  }

  wrapper.appendChild(button)
  return wrapper
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
