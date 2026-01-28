'use client'

import { EditorContent as TiptapEditorContent, type Editor } from '@tiptap/react'
import { EditorBubbleMenu } from './EditorBubbleMenu'
import { EditorContextMenu } from './EditorContextMenu'

interface EditorContentProps {
  editor: Editor | null
  onAddComment?: () => void
  onFindReplace?: () => void
  onInsertVariable?: () => void
}

export function EditorContent({ editor, onAddComment, onFindReplace, onInsertVariable }: EditorContentProps) {
  return (
    <EditorContextMenu
      editor={editor}
      onAddComment={onAddComment}
      onFindReplace={onFindReplace}
      onInsertVariable={onInsertVariable}
    >
      <div>
        {editor && <EditorBubbleMenu editor={editor} onAddComment={onAddComment} />}
        <TiptapEditorContent editor={editor} />
      </div>
    </EditorContextMenu>
  )
}
