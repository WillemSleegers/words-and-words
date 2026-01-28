import type { Editor } from '@tiptap/react'
import type { CollapsibleHeadingsStorage } from './extensions/collapsible-headings'

export const fonts = [
  { id: 'system', label: 'System Default', fontFamily: 'system-ui, -apple-system, sans-serif', description: 'Uses your system font' },
  { id: 'inter', label: 'Inter', fontFamily: 'Inter, system-ui, sans-serif', description: 'Clean sans-serif' },
  { id: 'serif', label: 'Serif', fontFamily: 'Georgia, Times New Roman, serif', description: 'Classic serif' },
  { id: 'georgia', label: 'Georgia', fontFamily: 'Georgia, serif', description: 'Elegant serif' },
  { id: 'merriweather', label: 'Merriweather', fontFamily: 'Merriweather, Georgia, serif', description: 'Readable serif' },
  { id: 'mono', label: 'Monospace', fontFamily: 'ui-monospace, Cascadia Code, Source Code Pro, monospace', description: 'Fixed-width font' },
] as const

export function getCurrentSectionInfo(editor: Editor | null) {
  if (!editor) return null

  const { doc, selection } = editor.state
  const cursorPos = selection.from

  const headings: Array<{
    pos: number
    endPos: number
    level: number
    text: string
    index: number
  }> = []

  let headingIndex = 0
  doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      headings.push({
        pos,
        endPos: pos + node.nodeSize,
        level: node.attrs.level as number,
        text: node.textContent,
        index: headingIndex,
      })
      headingIndex++
    }
  })

  let currentHeading = null
  for (let i = headings.length - 1; i >= 0; i--) {
    if (headings[i].pos <= cursorPos) {
      currentHeading = headings[i]
      break
    }
  }

  if (!currentHeading) return null

  const key = `${currentHeading.level}-${currentHeading.index}-${currentHeading.text.slice(0, 50)}`
  const editorStorage = editor.storage as unknown as { collapsibleHeadings: CollapsibleHeadingsStorage }
  const storage = editorStorage.collapsibleHeadings
  const isCollapsed = storage?.collapsedHeadings?.has(key) ?? false

  return { heading: currentHeading, key, isCollapsed }
}

export function toggleCurrentSectionCollapse(editor: Editor | null) {
  const sectionInfo = getCurrentSectionInfo(editor)
  if (!sectionInfo || !editor) return

  const { heading, key } = sectionInfo
  const editorStorage = editor.storage as unknown as { collapsibleHeadings: CollapsibleHeadingsStorage }
  const storage = editorStorage.collapsibleHeadings

  if (storage) {
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

  editor.chain().focus().setTextSelection(heading.endPos - 1).run()
}
