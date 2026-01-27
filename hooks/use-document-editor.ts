"use client"

import { useMemo } from "react"
import { useEditor } from "@tiptap/react"
import { extensions as baseExtensions } from "@/lib/editor"
import { CommentMark } from "@/lib/editor/extensions/comment-mark"

interface UseDocumentEditorOptions {
  content?: string
  onUpdate?: (content: string) => void
  onCommentClick?: (commentId: string) => void
}

export function useDocumentEditor({
  content = "",
  onUpdate,
  onCommentClick,
}: UseDocumentEditorOptions) {
  // Build extensions with the comment click handler
  const editorExtensions = useMemo(() => {
    // Filter out the default CommentMark and add configured one
    const filtered = baseExtensions.filter(ext => ext.name !== 'comment')
    return [
      ...filtered,
      CommentMark.configure({
        onCommentClick,
      }),
    ]
  }, [onCommentClick])

  const editor = useEditor({
    extensions: editorExtensions,
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor focus:outline-none p-8",
      },
    },
  })

  return editor
}
