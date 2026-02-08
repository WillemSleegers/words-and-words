'use client'

import { useEffect, useRef, useState } from 'react'
import { type Editor, useEditorState } from '@tiptap/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, ChevronRight } from 'lucide-react'
import type { Comment } from '@/lib/documents/types'
import { SidebarHeader } from './SidebarHeader'
import { CommentThreadDetail } from './CommentThreadDetail'

interface SidebarCommentsListProps {
  editor: Editor | null
  comments: Comment[]
  onCommentsChange: (comments: Comment[]) => void
  onBack: () => void
  onClose: () => void
  addMode?: boolean
  onAddModeChange?: (addMode: boolean) => void
  focusKey?: number
  activeCommentId?: string | null
  onActiveCommentIdChange?: (id: string | null) => void
}

function generateCommentId(): string {
  return `comment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export function SidebarCommentsList({
  editor,
  comments,
  onCommentsChange,
  onBack,
  onClose,
  addMode,
  onAddModeChange,
  focusKey,
  activeCommentId,
  onActiveCommentIdChange,
}: SidebarCommentsListProps) {
  const [newCommentText, setNewCommentText] = useState('')
  const [showResolved, setShowResolved] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null)
  const commentInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const expandedViaKeyboard = useRef(false)

  // Reactively track editor selection
  const selectionInfo = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return { hasSelection: false }
      const { from, to } = e.state.selection
      return { hasSelection: from !== to }
    },
  })
  const hasSelection = selectionInfo?.hasSelection ?? false

  // Reactively track which comment IDs have marks in the document
  const commentIdsInDocStr = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return null
      const ids: string[] = []
      e.state.doc.descendants((node) => {
        if (node.isText) {
          for (const mark of node.marks) {
            if (mark.type.name === 'comment' && mark.attrs.commentId) {
              const id = mark.attrs.commentId as string
              if (!ids.includes(id)) ids.push(id)
            }
          }
        }
      })
      return ids.sort().join(',')
    },
  })
  const commentIdsInDoc = new Set(
    commentIdsInDocStr ? commentIdsInDocStr.split(',') : []
  )

  // Compute word range at cursor for auto-select
  const wordRange = (() => {
    if (!editor) return null
    const { from, to } = editor.state.selection
    if (from !== to) return null
    const $pos = editor.state.doc.resolve(from)
    const parent = $pos.parent
    if (!parent.isTextblock) return null
    const text = parent.textContent
    const offset = $pos.parentOffset
    let start = offset
    let end = offset
    while (start > 0 && /\w/.test(text[start - 1])) start--
    while (end < text.length && /\w/.test(text[end])) end++
    if (start === end) return null
    const base = from - offset
    return { from: base + start, to: base + end }
  })()

  const canComment = hasSelection || wordRange !== null

  // Show preview highlight on mount, clear on unmount (only in add mode)
  useEffect(() => {
    if (!editor || !addMode) return
    const { from, to } = editor.state.selection
    if (from !== to) {
      editor.commands.setCommentPreview(from, to)
    } else {
      const $pos = editor.state.doc.resolve(from)
      const parent = $pos.parent
      if (parent.isTextblock) {
        const text = parent.textContent
        const offset = $pos.parentOffset
        let start = offset
        let end = offset
        while (start > 0 && /\w/.test(text[start - 1])) start--
        while (end < text.length && /\w/.test(text[end])) end++
        if (start !== end) {
          const base = from - offset
          editor.commands.setCommentPreview(base + start, base + end)
        }
      }
    }
    return () => {
      if (editor && !editor.isDestroyed) {
        editor.commands.clearCommentPreview()
      }
    }
  }, [focusKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Focus the comment input when entering add mode or re-triggered
  useEffect(() => {
    if (addMode) {
      commentInputRef.current?.focus()
    }
  }, [addMode, focusKey])

  // Thread grouping
  const rootComments = comments.filter(c => c.parentId === null)
  const threads = rootComments.map(root => ({
    root,
    replies: comments.filter(c => c.parentId === root.id).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ),
  }))
  const hasEditorLoaded = editor !== null && !editor.isDestroyed
  const orphanedThreads = hasEditorLoaded ? threads.filter(t => !commentIdsInDoc.has(t.root.id)) : []
  const nonOrphanedThreads = hasEditorLoaded ? threads.filter(t => commentIdsInDoc.has(t.root.id)) : threads
  const openThreads = nonOrphanedThreads.filter(t => !t.root.resolved)
  const resolvedThreads = nonOrphanedThreads.filter(t => t.root.resolved)

  const navigableThreadIds = [
    ...openThreads.map(t => t.root.id),
    ...orphanedThreads.map(t => t.root.id),
    ...(showResolved ? resolvedThreads.map(t => t.root.id) : []),
  ]

  // Focus management when a thread is expanded or collapsed
  useEffect(() => {
    if (addMode) return
    if (expandedThreadId) {
      if (expandedViaKeyboard.current) {
        expandedViaKeyboard.current = false
        requestAnimationFrame(() => {
          const firstItem = listRef.current?.querySelector('[data-thread-item]') as HTMLElement | null
          if (firstItem) firstItem.focus()
          else listRef.current?.focus()
        })
      }
    } else if (listRef.current) {
      listRef.current.focus()
    }
  }, [expandedThreadId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset selection when thread list changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [navigableThreadIds.length])

  // Sync selectedIndex from activeCommentId (set when clicking a comment in the editor)
  useEffect(() => {
    if (!activeCommentId) return
    setExpandedThreadId(null)
    const idx = navigableThreadIds.indexOf(activeCommentId)
    if (idx >= 0) {
      setSelectedIndex(idx)
      requestAnimationFrame(() => {
        listRef.current?.focus()
        listRef.current?.querySelector(`[data-selected="true"]`)?.scrollIntoView({ block: 'nearest' })
      })
    }
  }, [activeCommentId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Highlight the active comment's text in the editor
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const activeId = navigableThreadIds[selectedIndex] ?? null
    editor.commands.setActiveComment(activeId)
    return () => {
      if (editor && !editor.isDestroyed) {
        editor.commands.setActiveComment(null)
      }
    }
  }, [selectedIndex, editor]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleThread(threadId: string) {
    setExpandedThreadId(expandedThreadId === threadId ? null : threadId)
    const idx = navigableThreadIds.indexOf(threadId)
    if (idx >= 0) setSelectedIndex(idx)
  }

  function collapseThread() {
    setExpandedThreadId(null)
    listRef.current?.focus()
  }

  function handleListKeyDown(e: React.KeyboardEvent) {
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT') return

    if (expandedThreadId) {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.nativeEvent.stopImmediatePropagation()
        collapseThread()
        return
      }

      // Navigate between interactive elements inside the expanded thread
      const items = Array.from(
        listRef.current?.querySelectorAll('[data-thread-item]') ?? []
      ) as HTMLElement[]
      if (items.length === 0) return

      const currentIdx = items.findIndex(el => el === document.activeElement)

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault()
        const next = currentIdx < 0 ? 0 : Math.min(currentIdx + 1, items.length - 1)
        items[next].focus()
        items[next].scrollIntoView({ block: 'nearest' })
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault()
        const prev = currentIdx < 0 ? 0 : Math.max(currentIdx - 1, 0)
        items[prev].focus()
        items[prev].scrollIntoView({ block: 'nearest' })
      } else if (e.key === 'Enter') {
        const active = document.activeElement as HTMLElement
        if (active?.hasAttribute('data-thread-item') && active.tagName !== 'BUTTON') {
          e.preventDefault()
          active.click()
        }
      }
      return
    }

    if (navigableThreadIds.length === 0) return

    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault()
      const next = Math.min(selectedIndex + 1, navigableThreadIds.length - 1)
      setSelectedIndex(next)
      onActiveCommentIdChange?.(navigableThreadIds[next] ?? null)
      requestAnimationFrame(() => {
        listRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'nearest' })
      })
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault()
      const next = Math.max(selectedIndex - 1, 0)
      setSelectedIndex(next)
      onActiveCommentIdChange?.(navigableThreadIds[next] ?? null)
      requestAnimationFrame(() => {
        listRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'nearest' })
      })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      expandedViaKeyboard.current = true
      const threadId = navigableThreadIds[selectedIndex]
      if (threadId) toggleThread(threadId)
    }
  }

  function handleAddComment() {
    if (!editor || !newCommentText.trim()) return

    let { from, to } = editor.state.selection

    if (from === to) {
      if (!wordRange) return
      from = wordRange.from
      to = wordRange.to
      editor.commands.setTextSelection({ from, to })
    }

    editor.commands.clearCommentPreview()

    const commentId = generateCommentId()
    const newComment: Comment = {
      id: commentId,
      text: newCommentText.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      resolved: false,
      parentId: null,
    }

    editor.chain().focus().setComment(commentId).setTextSelection(to).run()
    onCommentsChange([...comments, newComment])
    setNewCommentText('')
    onAddModeChange?.(false)
  }

  function handleDelete(threadId: string) {
    const newComments = comments.filter(
      c => c.id !== threadId && c.parentId !== threadId
    )
    onCommentsChange(newComments)
    if (editor) {
      editor.commands.removeComment(threadId)
    }
    setExpandedThreadId(null)
  }

  function handleCleanupOrphaned() {
    const orphanedIds = new Set(orphanedThreads.map(t => t.root.id))
    const newComments = comments.filter(
      c => !orphanedIds.has(c.id) && !orphanedIds.has(c.parentId ?? '')
    )
    onCommentsChange(newComments)
    setExpandedThreadId(null)
  }

  function navigateToComment(commentId: string) {
    if (!editor) return

    let foundPos: number | null = null
    editor.state.doc.descendants((node, pos) => {
      if (foundPos !== null) return false
      if (node.isText) {
        const commentMark = node.marks.find(
          m => m.type.name === 'comment' && m.attrs.commentId === commentId
        )
        if (commentMark) {
          foundPos = pos
          return false
        }
      }
    })

    if (foundPos !== null) {
      editor.chain().focus().setTextSelection(foundPos).run()
      const coords = editor.view.coordsAtPos(foundPos)
      const element = document.elementFromPoint(coords.left, coords.top)
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  function renderThread(root: Comment, replies: Comment[], isResolved: boolean, isOrphaned: boolean = false) {
    const isSelected = navigableThreadIds[selectedIndex] === root.id
    const isExpanded = expandedThreadId === root.id

    return (
      <div
        key={root.id}
        data-selected={isSelected}
        onClick={() => toggleThread(root.id)}
        className={`mx-2 mt-1.5 first:mt-0 rounded-lg border cursor-pointer transition-colors ${
          isSelected ? 'border-primary' : 'border-border hover:border-muted-foreground/30'
        } ${(isResolved || isOrphaned) && !isExpanded ? 'opacity-60' : ''}`}
      >
        <div className="px-3 py-2">
          <div className={`text-sm ${isSelected ? '' : 'truncate'}`}>
            {isResolved && !isOrphaned && <Check className="h-3 w-3 inline shrink-0 align-middle mr-1" />}
            {root.text}
          </div>
          {!isExpanded && replies.length > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </div>
          )}
        </div>

        {isExpanded && (
          <CommentThreadDetail
            root={root}
            replies={replies}
            isOrphaned={isOrphaned}
            comments={comments}
            onCommentsChange={onCommentsChange}
            onNavigateToComment={navigateToComment}
            onDelete={handleDelete}
          />
        )}
      </div>
    )
  }

  return (
    <div className="absolute right-0 top-0 bottom-0 w-72 border-l bg-background flex flex-col shadow-lg z-20">
      <SidebarHeader title="Comments" onBack={onBack} onClose={onClose} />

      <div ref={listRef} className="flex-1 overflow-y-auto outline-none" tabIndex={-1} onKeyDown={handleListKeyDown}>
        {addMode && (
          <div className="p-3 border-b bg-muted/30">
            <div className="flex gap-2">
              <Input
                ref={commentInputRef}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    e.stopPropagation()
                    handleAddComment()
                  }
                }}
                placeholder={canComment ? "Add a comment..." : "Select text to comment on..."}
                className="h-8 flex-1"
              />
              <Button
                size="sm"
                onClick={handleAddComment}
                disabled={!canComment || !newCommentText.trim()}
              >
                Add
              </Button>
            </div>
          </div>
        )}

        {threads.length === 0 && !addMode && (
          <div className="text-center text-muted-foreground text-sm py-8 px-4">
            No comments yet. Select text and add a comment.
          </div>
        )}

        {openThreads.length > 0 && (
          <div className="py-2">
            {openThreads.map(({ root, replies }) => renderThread(root, replies, false))}
          </div>
        )}

        {orphanedThreads.length > 0 && (
          <div className="py-2">
            <div className="flex items-center justify-between px-4 py-1">
              <span className="text-xs font-medium text-muted-foreground">
                Orphaned
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCleanupOrphaned}
                className="h-6 text-xs text-muted-foreground hover:text-foreground"
              >
                Clean up all
              </Button>
            </div>
            {orphanedThreads.map(({ root, replies }) => renderThread(root, replies, false, true))}
          </div>
        )}

        {resolvedThreads.length > 0 && (
          <div className="py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResolved(!showResolved)}
              className="w-full justify-between h-auto px-4 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <span>Resolved ({resolvedThreads.length})</span>
              <ChevronRight className={`h-4 w-4 transition-transform ${showResolved ? 'rotate-90' : ''}`} />
            </Button>
            {showResolved && resolvedThreads.map(({ root, replies }) => renderThread(root, replies, true))}
          </div>
        )}
      </div>
    </div>
  )
}
