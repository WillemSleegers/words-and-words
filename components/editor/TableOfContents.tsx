'use client'

import type { Editor } from '@tiptap/react'
import { useTableOfContents } from '@/hooks/use-table-of-contents'
import { cn } from '@/lib/utils'

interface TableOfContentsProps {
  editor: Editor | null
  className?: string
}

export function TableOfContents({ editor, className }: TableOfContentsProps) {
  const { headings, activePos } = useTableOfContents(editor)

  function jumpToHeading(pos: number) {
    if (editor) {
      editor.chain().focus().setTextSelection(pos + 1).run()
    }
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
                onClick={() => jumpToHeading(heading.pos)}
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
