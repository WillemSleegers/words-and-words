'use client'

import { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, Locate, MessageSquare, RotateCcw, Trash2 } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Comment } from '@/lib/documents/types'

interface CommentThreadDetailProps {
  root: Comment
  replies: Comment[]
  isOrphaned: boolean
  comments: Comment[]
  onCommentsChange: (comments: Comment[]) => void
  onNavigateToComment: (commentId: string) => void
  onDelete: (threadId: string) => void
}

function generateCommentId(): string {
  return `comment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export function CommentThreadDetail({
  root,
  replies,
  isOrphaned,
  comments,
  onCommentsChange,
  onNavigateToComment,
  onDelete,
}: CommentThreadDetailProps) {
  const [replyText, setReplyText] = useState('')
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const replyInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  function startEditing(comment: Comment) {
    setEditingCommentId(comment.id)
    setEditText(comment.text)
    requestAnimationFrame(() => editInputRef.current?.focus())
  }

  function handleSaveEdit() {
    if (!editingCommentId || !editText.trim()) return
    const newComments = comments.map(c =>
      c.id === editingCommentId ? { ...c, text: editText.trim(), updatedAt: new Date() } : c
    )
    onCommentsChange(newComments)
    setEditingCommentId(null)
    setEditText('')
  }

  function cancelEdit() {
    setEditingCommentId(null)
    setEditText('')
  }

  function handleAddReply() {
    if (!replyText.trim()) return

    const newReply: Comment = {
      id: generateCommentId(),
      text: replyText.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      resolved: false,
      parentId: root.id,
    }

    onCommentsChange([...comments, newReply])
    setReplyText('')
    setShowReplyInput(false)
  }

  function handleResolve() {
    const newComments = comments.map(c =>
      c.id === root.id ? { ...c, resolved: !c.resolved, updatedAt: new Date() } : c
    )
    onCommentsChange(newComments)
  }

  return (
    <div className="border-t border-border" onClick={(e) => e.stopPropagation()}>
      {/* Orphaned notice */}
      {isOrphaned && (
        <div className="px-3 py-1 text-xs text-muted-foreground">
          Annotated text was deleted
        </div>
      )}

      {/* Action buttons - icon only with tooltips */}
      <div className="px-2 py-1 flex gap-0.5">
        {!isOrphaned && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                data-thread-item
                tabIndex={-1}
                onClick={() => onNavigateToComment(root.id)}
                className="h-7 w-7 focus:bg-accent"
              >
                <Locate className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>Go to text</p></TooltipContent>
          </Tooltip>
        )}
        {!isOrphaned && !showReplyInput && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                data-thread-item
                tabIndex={-1}
                onClick={() => {
                  setShowReplyInput(true)
                  requestAnimationFrame(() => replyInputRef.current?.focus())
                }}
                className="h-7 w-7 focus:bg-accent"
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>Reply</p></TooltipContent>
          </Tooltip>
        )}
        {!isOrphaned && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                data-thread-item
                tabIndex={-1}
                onClick={handleResolve}
                className="h-7 w-7 focus:bg-accent"
              >
                {root.resolved ? (
                  <RotateCcw className="h-3.5 w-3.5" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{root.resolved ? 'Reopen' : 'Resolve'}</p>
            </TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              data-thread-item
              tabIndex={-1}
              onClick={() => onDelete(root.id)}
              className="h-7 w-7 text-destructive hover:text-destructive focus:bg-accent"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom"><p>Delete</p></TooltipContent>
        </Tooltip>
      </div>

      {/* Replies */}
      {replies.map(reply => (
        <div key={reply.id} className="px-3 py-1.5 border-t border-border/50">
          {editingCommentId === reply.id ? (
            <Input
              ref={editInputRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSaveEdit()
                }
                if (e.key === 'Escape') {
                  e.preventDefault()
                  e.nativeEvent.stopImmediatePropagation()
                  cancelEdit()
                }
              }}
              className="h-7 text-xs"
            />
          ) : (
            <div
              data-thread-item
              tabIndex={-1}
              role="button"
              className="text-sm cursor-pointer hover:bg-accent/50 focus:bg-accent/50 rounded-sm -mx-1 px-1 outline-none"
              onClick={() => startEditing(reply)}
            >
              {reply.text}
            </div>
          )}
          <div className="text-xs text-muted-foreground mt-0.5">
            {new Date(reply.createdAt).toLocaleDateString()}
          </div>
        </div>
      ))}

      {/* Reply input */}
      {!isOrphaned && showReplyInput && (
        <div className="px-3 py-2 border-t border-border/50">
          <Input
            ref={replyInputRef}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleAddReply()
              }
              if (e.key === 'Escape') {
                e.preventDefault()
                e.nativeEvent.stopImmediatePropagation()
                setShowReplyInput(false)
                setReplyText('')
              }
            }}
            placeholder="Reply..."
            className="h-7 text-xs"
          />
        </div>
      )}
    </div>
  )
}
