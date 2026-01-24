'use client'

import { EditorContent as TiptapEditorContent, type Editor } from '@tiptap/react'
import { EditorBubbleMenu } from './EditorBubbleMenu'

interface EditorContentProps {
  editor: Editor | null
}

export function EditorContent({ editor }: EditorContentProps) {
  return (
    <>
      {editor && <EditorBubbleMenu editor={editor} />}
      <TiptapEditorContent editor={editor} />
    </>
  )
}
