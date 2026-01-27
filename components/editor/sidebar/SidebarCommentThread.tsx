'use client'

import { useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, MessageSquare, Trash2 } from 'lucide-react'
import type { Comment } from '@/lib/documents/types'
import { getCommentHighlightedText } from '@/lib/editor/extensions/comment-mark'
import { SidebarHeader } from './SidebarHeader'

interface SidebarCommentThreadProps {
  editor: Editor | null
  comments: Comment[]
  onCommentsChange: (comments: Comment[]) => void
  activeCommentId: string
  onBack: () => void
  onClose: () => void
}

function generateCommentId(): string {
  return `comment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export function SidebarCommentThread({
  editor,
  comments,
  onCommentsChange,
  activeCommentId,
  onBack,
  onClose,
}: SidebarCommentThreadProps) {
  const [replyText, setReplyText] = useState('')
  const replyInputRef = useRef<HTMLInputElement>(null)

  const rootComment = comments.find(c => c.id === activeCommentId)
  const replies = comments.filter(c => c.parentId === activeCommentId).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
  const highlightedText = editor ? getCommentHighlightedText(editor, activeCommentId) : ''

  if (!rootComment) return null

  function handleAddReply() {
    if (!replyText.trim()) return

    const newReply: Comment = {
      id: generateCommentId(),
      text: replyText.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      resolved: false,
      parentId: activeCommentId,
    }

    onCommentsChange([...comments, newReply])
    setReplyText('')
  }

  function handleResolve() {
    const newComments = comments.map(c =>
      c.id === activeCommentId ? { ...c, resolved: !c.resolved, updatedAt: new Date() } : c
    )
    onCommentsChange(newComments)
  }

  function handleDelete() {
    const newComments = comments.filter(
      c => c.id !== activeCommentId && c.parentId !== activeCommentId
    )
    onCommentsChange(newComments)

    if (editor) {
      editor.commands.removeComment(activeCommentId)
    }

    onBack()
  }

  function navigateToComment() {
    if (!editor) return

    let foundPos: number | null = null
    editor.state.doc.descendants((node, pos) => {
      if (foundPos !== null) return false
      if (node.isText) {
        const commentMark = node.marks.find(
          m => m.type.name === 'comment' && m.attrs.commentId === activeCommentId
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

  return (
    <div className="absolute right-0 top-0 bottom-0 w-72 border-l bg-background flex flex-col shadow-lg z-20">
      <SidebarHeader
        title="Comment Thread"
        onBack={onBack}
        backLabel="Back to comments"
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto">
        {/* Highlighted text */}
        <button
          onClick={navigateToComment}
          className="w-full text-left p-3 border-b bg-muted/30 hover:bg-muted/50"
        >
          <div className="text-xs text-muted-foreground line-clamp-3">
            &ldquo;{highlightedText}&rdquo;
          </div>
        </button>

        {/* Root comment */}
        <div className="p-3 border-b">
          <div className="text-sm">{rootComment.text}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {new Date(rootComment.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* Replies */}
        {replies.map(reply => (
          <div key={reply.id} className="p-3 border-b bg-muted/20">
            <div className="text-sm">{reply.text}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {new Date(reply.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}

        {/* Reply input */}
        <div className="p-3 border-b">
          <div className="flex gap-2">
            <Input
              ref={replyInputRef}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleAddReply()
                }
              }}
              placeholder="Reply..."
              className="h-8 flex-1"
            />
            <Button
              size="sm"
              onClick={handleAddReply}
              disabled={!replyText.trim()}
            >
              Reply
            </Button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 border-t flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleResolve}
          className="flex-1"
        >
          {rootComment.resolved ? (
            <>
              <MessageSquare className="h-4 w-4 mr-1" />
              Reopen
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-1" />
              Resolve
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
