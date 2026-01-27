'use client'

import { EditorContent as TiptapEditorContent, type Editor } from '@tiptap/react'
import { EditorBubbleMenu } from './EditorBubbleMenu'

interface EditorContentProps {
  editor: Editor | null
  onAddComment?: () => void
}

export function EditorContent({ editor, onAddComment }: EditorContentProps) {
  return (
    <>
      {editor && <EditorBubbleMenu editor={editor} onAddComment={onAddComment} />}
      <TiptapEditorContent editor={editor} />
    </>
  )
}
