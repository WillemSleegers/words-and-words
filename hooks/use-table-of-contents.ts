'use client'

import type { Editor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'

export interface TocHeading {
  level: number
  text: string
  pos: number
  isTitle?: boolean
}

export function useTableOfContents(editor: Editor | null) {
  return useEditorState({
    editor,
    selector: ({ editor: e }): { headings: TocHeading[]; activePos: number | null } => {
      if (!e) {
        return { headings: [], activePos: null }
      }

      const { doc, selection } = e.state
      const cursorPos = selection.from
      const headings: TocHeading[] = []

      doc.descendants((node, pos) => {
        if (node.type.name === 'title') {
          headings.push({
            level: 0,
            text: node.textContent || 'Untitled',
            pos,
            isTitle: true,
          })
        } else if (node.type.name === 'heading') {
          headings.push({
            level: node.attrs.level as number,
            text: node.textContent || '',
            pos,
          })
        }
      })

      // Find the active heading (nearest heading before cursor)
      let activePos: number | null = null
      for (let i = headings.length - 1; i >= 0; i--) {
        if (headings[i].pos <= cursorPos) {
          activePos = headings[i].pos
          break
        }
      }

      return { headings, activePos }
    },
  })
}
