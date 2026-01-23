'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { extensions } from '@/lib/editor'
import { Toolbar } from './Toolbar'

interface EditorProps {
  content?: string
  onChange?: (content: string) => void
}

export function Editor({ content = '', onChange }: EditorProps) {
  const editor = useEditor({
    extensions,
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor focus:outline-none min-h-[500px] p-4',
      },
    },
  })

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      {editor && (
        <div className="flex items-center justify-end gap-4 px-4 py-2 border-t text-sm text-muted-foreground">
          <span>{editor.storage.characterCount.characters()} characters</span>
          <span>{editor.storage.characterCount.words()} words</span>
        </div>
      )}
    </div>
  )
}
