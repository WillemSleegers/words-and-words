"use client"

import { useEditor } from "@tiptap/react"
import { extensions } from "@/lib/editor"

interface UseDocumentEditorOptions {
  content?: string
  onUpdate?: (content: string) => void
}

export function useDocumentEditor({
  content = "",
  onUpdate,
}: UseDocumentEditorOptions) {
  const editor = useEditor({
    extensions,
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
