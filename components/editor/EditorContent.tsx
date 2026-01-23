'use client'

import { EditorContent as TiptapEditorContent, type Editor } from '@tiptap/react'

interface EditorContentProps {
  editor: Editor | null
}

export function EditorContent({ editor }: EditorContentProps) {
  return <TiptapEditorContent editor={editor} />
}
