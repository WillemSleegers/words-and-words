'use client'

import { useEffect, useRef, useState } from 'react'
import { type Editor, useEditorState } from '@tiptap/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, ChevronRight, MessageSquare, Trash2 } from 'lucide-react'
import type { Comment } from '@/lib/documents/types'
import { SidebarHeader } from './SidebarHeader'

interface SidebarCommentsListProps {
  editor: Editor | null
  comments: Comment[]
  onCommentsChange: (comments: Comment[]) => void
  onBack: () => void
  onClose: () => void
  addMode?: boolean
  onAddModeChange?: (addMode: boolean) => void
  initialExpandedId?: string | null
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
  initialExpandedId,
}: SidebarCommentsListProps) {
  const [newCommentText, setNewCommentText] = useState('')
  const [showResolved, setShowResolved] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(initialExpandedId ?? null)
  const [replyText, setReplyText] = useState('')
  const commentInputRef = useRef<HTMLInputElement>(null)
  const replyInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Reactively track editor selection
  const selectionInfo = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return { hasSelection: false }
      const { from, to } = e.state.selection
      if (from !== to) {
        return { hasSelection: true }
      }
      return { hasSelection: false }
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

  // canComment if there's a selection OR a word at cursor
  const canComment = hasSelection || wordRange !== null
  // Show preview highlight on mount, clear on unmount (only in add mode)
  useEffect(() => {
    if (!editor || !addMode) return
    const { from, to } = editor.state.selection
    if (from !== to) {
      editor.commands.setCommentPreview(from, to)
    } else {
      // Compute word range at cursor inside the effect
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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- only on mount/unmount

  // Focus the comment input once when entering add mode
  useEffect(() => {
    if (addMode) {
      commentInputRef.current?.focus()
    }
  }, [addMode])

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

  // Flat list of navigable thread IDs: open threads + resolved (if expanded)
  const navigableThreadIds = [
    ...openThreads.map(t => t.root.id),
    ...orphanedThreads.map(t => t.root.id),
    ...(showResolved ? resolvedThreads.map(t => t.root.id) : []),
  ]

  // Focus the list container when a thread is collapsed (not when addMode changes,
  // to avoid stealing focus from the editor after adding a comment)
  useEffect(() => {
    if (!expandedThreadId && !addMode && listRef.current) {
      listRef.current.focus()
    }
  }, [expandedThreadId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Focus reply input when a thread is expanded
  useEffect(() => {
    if (expandedThreadId) {
      replyInputRef.current?.focus()
    }
  }, [expandedThreadId])

  // Reset selection when thread list changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [navigableThreadIds.length])

  // Set active comment highlight when expanded
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    if (expandedThreadId) {
      editor.commands.setActiveComment(expandedThreadId)
    } else {
      editor.commands.setActiveComment(null)
    }
    return () => {
      if (editor && !editor.isDestroyed) {
        editor.commands.setActiveComment(null)
      }
    }
  }, [expandedThreadId, editor])

  function toggleThread(threadId: string) {
    if (expandedThreadId === threadId) {
      setExpandedThreadId(null)
      setReplyText('')
    } else {
      setExpandedThreadId(threadId)
      setReplyText('')
    }
  }

  function handleListKeyDown(e: React.KeyboardEvent) {
    if (expandedThreadId) {
      // When a thread is expanded, Escape collapses it
      if (e.key === 'Escape') {
        e.preventDefault()
        e.nativeEvent.stopImmediatePropagation()
        setExpandedThreadId(null)
        setReplyText('')
        listRef.current?.focus()
      }
      return
    }

    if (navigableThreadIds.length === 0) return

    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, navigableThreadIds.length - 1))
      requestAnimationFrame(() => {
        listRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'nearest' })
      })
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
      requestAnimationFrame(() => {
        listRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'nearest' })
      })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const threadId = navigableThreadIds[selectedIndex]
      if (threadId) toggleThread(threadId)
    }
  }

  function handleAddComment() {
    if (!editor || !newCommentText.trim()) return

    let { from, to } = editor.state.selection

    // If no selection, use word range
    if (from === to) {
      if (!wordRange) return
      from = wordRange.from
      to = wordRange.to
      editor.commands.setTextSelection({ from, to })
    }

    // Clear preview before applying the real mark
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

  function handleAddReply(threadId: string) {
    if (!replyText.trim()) return

    const newReply: Comment = {
      id: generateCommentId(),
      text: replyText.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      resolved: false,
      parentId: threadId,
    }

    onCommentsChange([...comments, newReply])
    setReplyText('')
  }

  function handleResolve(threadId: string) {
    const newComments = comments.map(c =>
      c.id === threadId ? { ...c, resolved: !c.resolved, updatedAt: new Date() } : c
    )
    onCommentsChange(newComments)
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
    setReplyText('')
  }

  function handleCleanupOrphaned() {
    const orphanedIds = new Set(orphanedThreads.map(t => t.root.id))
    const newComments = comments.filter(
      c => !orphanedIds.has(c.id) && !orphanedIds.has(c.parentId ?? '')
    )
    onCommentsChange(newComments)
    setExpandedThreadId(null)
    setReplyText('')
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
      <div key={root.id} className={(isResolved || isOrphaned) && !isExpanded ? 'opacity-60' : ''}>
        {/* Thread summary / toggle */}
        <button
          data-selected={isSelected && !expandedThreadId}
          onClick={() => toggleThread(root.id)}
          className={`w-full text-left px-2 py-2 rounded-md ${
            isExpanded ? 'bg-accent' : isSelected && !expandedThreadId ? 'bg-accent' : 'hover:bg-accent'
          }`}
        >
          <div className="text-sm line-clamp-2 flex items-center gap-1">
            {isResolved && !isOrphaned && <Check className="h-3 w-3 shrink-0" />}
            {root.text}
          </div>
          {!isExpanded && replies.length > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </div>
          )}
        </button>

        {/* Expanded thread detail */}
        {isExpanded && (
          <div className="border-l-2 border-accent ml-2 mb-2">
            {/* Navigate to text or orphaned warning */}
            {isOrphaned ? (
              <div className="px-3 py-1.5 text-xs text-muted-foreground">
                Annotated text was deleted
              </div>
            ) : (
              <button
                onClick={() => navigateToComment(root.id)}
                className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Go to text &rarr;
              </button>
            )}

            {/* Date */}
            <div className="px-3 pb-1 text-xs text-muted-foreground">
              {new Date(root.createdAt).toLocaleDateString()}
            </div>

            {/* Replies */}
            {replies.map(reply => (
              <div key={reply.id} className="px-3 py-1.5 border-t border-border/50">
                <div className="text-sm">{reply.text}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {new Date(reply.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}

            {/* Reply input - hide for orphaned comments */}
            {!isOrphaned && (
              <div className="px-3 py-2 border-t border-border/50">
                <Input
                  ref={replyInputRef}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleAddReply(root.id)
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault()
                      e.nativeEvent.stopImmediatePropagation()
                      setExpandedThreadId(null)
                      setReplyText('')
                      listRef.current?.focus()
                    }
                  }}
                  placeholder="Reply..."
                  className="h-7 text-xs"
                />
              </div>
            )}

            {/* Actions */}
            <div className="px-3 py-1.5 border-t border-border/50 flex gap-1.5">
              {!isOrphaned && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResolve(root.id)}
                  className="h-7 text-xs flex-1"
                >
                  {root.resolved ? (
                    <>
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Reopen
                    </>
                  ) : (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Resolve
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(root.id)}
                className={`h-7 text-xs text-destructive hover:text-destructive ${isOrphaned ? 'flex-1' : ''}`}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {isOrphaned && 'Delete'}
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="absolute right-0 top-0 bottom-0 w-72 border-l bg-background flex flex-col shadow-lg z-20">
      <SidebarHeader title="Comments" onBack={onBack} onClose={onClose} />

      <div ref={listRef} className="flex-1 overflow-y-auto outline-none" tabIndex={-1} onKeyDown={handleListKeyDown}>
        {/* Add comment section - show when in add mode */}
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

        {/* No comments state */}
        {threads.length === 0 && !addMode && (
          <div className="text-center text-muted-foreground text-sm py-8 px-4">
            No comments yet. Select text and add a comment.
          </div>
        )}

        {/* Open comments section */}
        {openThreads.length > 0 && (
          <div className="p-2">
            <div className="text-xs font-medium text-muted-foreground px-2 py-1">
              Open ({openThreads.length})
            </div>
            {openThreads.map(({ root, replies }) => renderThread(root, replies, false))}
          </div>
        )}

        {/* Orphaned comments section */}
        {orphanedThreads.length > 0 && (
          <div className="p-2 border-t">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs font-medium text-muted-foreground">
                Orphaned ({orphanedThreads.length})
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

        {/* Resolved comments section */}
        {resolvedThreads.length > 0 && (
          <div className="p-2 border-t">
            <button
              onClick={() => setShowResolved(!showResolved)}
              className="w-full flex items-center justify-between px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <span>Resolved ({resolvedThreads.length})</span>
              <ChevronRight className={`h-4 w-4 transition-transform ${showResolved ? 'rotate-90' : ''}`} />
            </button>
            {showResolved && resolvedThreads.map(({ root, replies }) => renderThread(root, replies, true))}
          </div>
        )}
      </div>
    </div>
  )
}
