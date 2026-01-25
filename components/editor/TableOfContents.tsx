'use client'

import type { Editor } from '@tiptap/react'
import { useTableOfContents, type TocHeading } from '@/hooks/use-table-of-contents'
import { getHeadingKey, type CollapsibleHeadingsStorage } from '@/lib/editor/extensions/collapsible-headings'
import { cn } from '@/lib/utils'

interface TableOfContentsProps {
  editor: Editor | null
  className?: string
}

export function TableOfContents({ editor, className }: TableOfContentsProps) {
  const tocState = useTableOfContents(editor)
  const headings = tocState?.headings ?? []
  const activePos = tocState?.activePos ?? null

  function jumpToHeading(heading: TocHeading) {
    if (!editor) return

    const storage = editor.storage as { collapsibleHeadings?: CollapsibleHeadingsStorage }
    if (storage.collapsibleHeadings && !heading.isTitle) {
      let needsUpdate = false

      // Get only the non-title headings for calculating collapsed sections
      const nonTitleHeadings = headings.filter((h) => !h.isTitle && h.headingIndex !== undefined)
      const targetIndex = nonTitleHeadings.findIndex((h) => h.pos === heading.pos)

      // Check all preceding headings to see if any are collapsed and hiding this heading
      for (let i = 0; i < targetIndex; i++) {
        const precedingHeading = nonTitleHeadings[i]
        if (precedingHeading.headingIndex === undefined) continue

        const key = getHeadingKey(precedingHeading.level, precedingHeading.text, precedingHeading.headingIndex)
        if (!storage.collapsibleHeadings.collapsedHeadings.has(key)) continue

        // Find where this collapsed section ends (next heading of same or lower level)
        const endIndex = nonTitleHeadings.findIndex(
          (h, idx) => idx > i && h.level <= precedingHeading.level
        )
        const sectionEndsAt = endIndex === -1 ? nonTitleHeadings.length : endIndex

        // If target is within this collapsed section, expand it
        if (targetIndex < sectionEndsAt) {
          storage.collapsibleHeadings.collapsedHeadings.delete(key)
          needsUpdate = true
        }
      }

      // Also expand the target heading itself if it's collapsed
      if (heading.headingIndex !== undefined) {
        const targetKey = getHeadingKey(heading.level, heading.text, heading.headingIndex)
        if (storage.collapsibleHeadings.collapsedHeadings.has(targetKey)) {
          storage.collapsibleHeadings.collapsedHeadings.delete(targetKey)
          needsUpdate = true
        }
      }

      if (needsUpdate) {
        editor.view.dispatch(editor.state.tr.setMeta('collapsibleHeadingsUpdate', true))
      }
    }

    editor.chain().focus().setTextSelection(heading.pos + 1).run()
  }

  if (headings.length === 0) {
    return (
      <nav className={cn('toc-sidebar', className)}>
        <div className="text-sm text-muted-foreground px-3 py-2">
          No headings yet
        </div>
      </nav>
    )
  }

  return (
    <nav className={cn('toc-sidebar', className)}>
      <ul className="space-y-1">
        {headings.map((heading, index) => {
          const isActive = heading.pos === activePos
          const indent = heading.isTitle ? 0 : (heading.level - 1) * 12

          return (
            <li key={`${heading.pos}-${index}`}>
              <button
                type="button"
                onClick={() => jumpToHeading(heading)}
                className={cn(
                  'toc-item w-full text-left px-3 py-1.5 text-sm rounded-md truncate',
                  'hover:bg-muted transition-colors',
                  isActive && 'toc-item-active bg-muted font-medium',
                  heading.isTitle && 'font-semibold'
                )}
                style={{ paddingLeft: `${12 + indent}px` }}
                title={heading.text}
              >
                {heading.text || (heading.isTitle ? 'Untitled' : 'Empty heading')}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
