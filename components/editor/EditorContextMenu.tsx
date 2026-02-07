'use client'

import { useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  CodeSquare,
  Image,
  Table,
  Link,
  MessageSquare,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Pilcrow,
  Search,
  Variable,
} from 'lucide-react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

interface EditorContextMenuProps {
  editor: Editor | null
  children: React.ReactNode
  onAddComment?: () => void
  onFindReplace?: () => void
  onInsertVariable?: () => void
}

export function EditorContextMenu({
  editor,
  children,
  onAddComment,
  onFindReplace,
  onInsertVariable,
}: EditorContextMenuProps) {
  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) return null
      return {
        isBold: ctx.editor.isActive('bold'),
        isItalic: ctx.editor.isActive('italic'),
        isUnderline: ctx.editor.isActive('underline'),
        isStrike: ctx.editor.isActive('strike'),
        isCode: ctx.editor.isActive('code'),
        isParagraph: ctx.editor.isActive('paragraph'),
        isH1: ctx.editor.isActive('heading', { level: 1 }),
        isH2: ctx.editor.isActive('heading', { level: 2 }),
        isH3: ctx.editor.isActive('heading', { level: 3 }),
        isH4: ctx.editor.isActive('heading', { level: 4 }),
        isBulletList: ctx.editor.isActive('bulletList'),
        isOrderedList: ctx.editor.isActive('orderedList'),
        isBlockquote: ctx.editor.isActive('blockquote'),
        isCodeBlock: ctx.editor.isActive('codeBlock'),
        textAlign: (ctx.editor.getAttributes('paragraph').textAlign || ctx.editor.getAttributes('heading').textAlign || 'left') as string,
        hasSelection: !ctx.editor.state.selection.empty,
      }
    },
  })

  // Defer sidebar-opening actions to onCloseAutoFocus so they execute
  // after the context menu is fully closed and won't have focus stolen
  const pendingActionRef = useRef<(() => void) | null>(null)

  if (!editor || !editorState) {
    return <>{children}</>
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent
        className="w-56"
        onCloseAutoFocus={(e) => {
          if (pendingActionRef.current) {
            e.preventDefault()
            const action = pendingActionRef.current
            pendingActionRef.current = null
            action()
          }
        }}
      >
        {/* Formatting submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Bold className="mr-2 size-4" />
            Formatting
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onSelect={() => editor.chain().focus().toggleBold().run()}>
              <Bold className="mr-2 size-4" />
              Bold
              <ContextMenuShortcut>⌘B</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => editor.chain().focus().toggleItalic().run()}>
              <Italic className="mr-2 size-4" />
              Italic
              <ContextMenuShortcut>⌘I</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => editor.chain().focus().toggleUnderline().run()}>
              <Underline className="mr-2 size-4" />
              Underline
              <ContextMenuShortcut>⌘U</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => editor.chain().focus().toggleStrike().run()}>
              <Strikethrough className="mr-2 size-4" />
              Strikethrough
              <ContextMenuShortcut>⌘⇧X</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => editor.chain().focus().toggleCode().run()}>
              <Code className="mr-2 size-4" />
              Code
              <ContextMenuShortcut>⌘E</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Turn into submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Pilcrow className="mr-2 size-4" />
            Turn into
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onSelect={() => editor.chain().focus().setParagraph().run()}>
              <Pilcrow className="mr-2 size-4" />
              Paragraph
              {editorState.isParagraph && <ContextMenuShortcut>✓</ContextMenuShortcut>}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
              <Heading1 className="mr-2 size-4" />
              Heading 1
              {editorState.isH1 && <ContextMenuShortcut>✓</ContextMenuShortcut>}
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
              <Heading2 className="mr-2 size-4" />
              Heading 2
              {editorState.isH2 && <ContextMenuShortcut>✓</ContextMenuShortcut>}
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
              <Heading3 className="mr-2 size-4" />
              Heading 3
              {editorState.isH3 && <ContextMenuShortcut>✓</ContextMenuShortcut>}
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>
              <Heading4 className="mr-2 size-4" />
              Heading 4
              {editorState.isH4 && <ContextMenuShortcut>✓</ContextMenuShortcut>}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={() => editor.chain().focus().toggleBulletList().run()}>
              <List className="mr-2 size-4" />
              Bullet List
              {editorState.isBulletList && <ContextMenuShortcut>✓</ContextMenuShortcut>}
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => editor.chain().focus().toggleOrderedList().run()}>
              <ListOrdered className="mr-2 size-4" />
              Numbered List
              {editorState.isOrderedList && <ContextMenuShortcut>✓</ContextMenuShortcut>}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={() => editor.chain().focus().toggleBlockquote().run()}>
              <Quote className="mr-2 size-4" />
              Blockquote
              {editorState.isBlockquote && <ContextMenuShortcut>✓</ContextMenuShortcut>}
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => editor.chain().focus().toggleCodeBlock().run()}>
              <CodeSquare className="mr-2 size-4" />
              Code Block
              {editorState.isCodeBlock && <ContextMenuShortcut>✓</ContextMenuShortcut>}
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Text align submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <AlignLeft className="mr-2 size-4" />
            Align
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-44">
            {([
              { icon: AlignLeft, label: 'Left', value: 'left' },
              { icon: AlignCenter, label: 'Center', value: 'center' },
              { icon: AlignRight, label: 'Right', value: 'right' },
              { icon: AlignJustify, label: 'Justify', value: 'justify' },
            ] as const).map((item) => (
              <ContextMenuItem key={item.value} onSelect={() => editor.chain().focus().setTextAlign(item.value).run()}>
                <item.icon className="mr-2 size-4" />
                {item.label}
                {editorState.textAlign === item.value && <ContextMenuShortcut>✓</ContextMenuShortcut>}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        {/* Insert actions */}
        <ContextMenuItem onSelect={() => {
          const url = window.prompt('Image URL:')
          if (url) editor.chain().focus().setImage({ src: url }).run()
        }}>
          <Image className="mr-2 size-4" />
          Insert Image
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          <Table className="mr-2 size-4" />
          Insert Table
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => {
          const url = window.prompt('Link URL:')
          if (url) editor.chain().focus().setLink({ href: url }).run()
        }}>
          <Link className="mr-2 size-4" />
          Insert Link
          <ContextMenuShortcut>⌘K</ContextMenuShortcut>
        </ContextMenuItem>
        {onInsertVariable && (
          <ContextMenuItem onSelect={onInsertVariable}>
            <Variable className="mr-2 size-4" />
            Insert Variable
          </ContextMenuItem>
        )}

        {/* Comment */}
        {onAddComment && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={() => { pendingActionRef.current = onAddComment }}>
              <MessageSquare className="mr-2 size-4" />
              Add Comment
            </ContextMenuItem>
          </>
        )}

        {/* Find & Replace */}
        {onFindReplace && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={() => { pendingActionRef.current = onFindReplace }}>
              <Search className="mr-2 size-4" />
              Find & Replace
              <ContextMenuShortcut>⌘F</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
