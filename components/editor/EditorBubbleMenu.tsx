'use client'

import { useState } from 'react'
import { type Editor, useEditorState } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  Unlink,
  ExternalLink,
  MessageSquare,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface EditorBubbleMenuProps {
  editor: Editor
  onAddComment?: () => void
}

export function EditorBubbleMenu({ editor, onAddComment }: EditorBubbleMenuProps) {
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      isBold: ctx.editor.isActive('bold'),
      isItalic: ctx.editor.isActive('italic'),
      isUnderline: ctx.editor.isActive('underline'),
      isStrike: ctx.editor.isActive('strike'),
      isCode: ctx.editor.isActive('code'),
      isLink: ctx.editor.isActive('link'),
      linkHref: ctx.editor.getAttributes('link').href as string | undefined,
      textAlign: (ctx.editor.getAttributes('paragraph').textAlign || ctx.editor.getAttributes('heading').textAlign || 'left') as string,
    }),
  })

  const items = [
    {
      icon: Bold,
      title: 'Bold',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editorState.isBold,
    },
    {
      icon: Italic,
      title: 'Italic',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editorState.isItalic,
    },
    {
      icon: Underline,
      title: 'Underline',
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editorState.isUnderline,
    },
    {
      icon: Strikethrough,
      title: 'Strikethrough',
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: editorState.isStrike,
    },
    {
      icon: Code,
      title: 'Code',
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: editorState.isCode,
    },
  ]

  function handleLinkOpenChange(open: boolean) {
    setLinkOpen(open)
    if (open) {
      setLinkUrl(editorState.linkHref || '')
    }
  }

  function handleSetLink() {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run()
    }
    setLinkOpen(false)
    setLinkUrl('')
  }

  function handleRemoveLink() {
    editor.chain().focus().unsetLink().run()
    setLinkOpen(false)
    setLinkUrl('')
  }

  return (
    <BubbleMenu
      editor={editor}
      className="flex items-center gap-0.5 rounded-lg border bg-background p-1 shadow-md"
    >
      {items.map((item) => (
        <button
          key={item.title}
          onClick={item.action}
          className={cn(
            'rounded p-1.5 hover:bg-muted transition-colors',
            item.isActive && 'bg-muted text-foreground'
          )}
          title={item.title}
        >
          <item.icon className="h-4 w-4" />
        </button>
      ))}

      {/* Separator */}
      <div className="w-px h-4 bg-border mx-0.5" />

      {/* Text alignment */}
      {[
        { icon: AlignLeft, align: 'left', title: 'Align Left' },
        { icon: AlignCenter, align: 'center', title: 'Align Center' },
        { icon: AlignRight, align: 'right', title: 'Align Right' },
        { icon: AlignJustify, align: 'justify', title: 'Justify' },
      ].map((item) => (
        <button
          key={item.align}
          onClick={() => editor.chain().focus().setTextAlign(item.align).run()}
          className={cn(
            'rounded p-1.5 hover:bg-muted transition-colors',
            editorState.textAlign === item.align && 'bg-muted text-foreground'
          )}
          title={item.title}
        >
          <item.icon className="h-4 w-4" />
        </button>
      ))}

      <Popover open={linkOpen} onOpenChange={handleLinkOpenChange}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'rounded p-1.5 hover:bg-muted transition-colors',
              editorState.isLink && 'bg-muted text-foreground'
            )}
            title="Link"
          >
            <Link className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3" align="start">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSetLink()
            }}
            className="flex flex-col gap-2"
          >
            <Input
              type="url"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="flex-1">
                {editorState.isLink ? 'Update' : 'Add'} link
              </Button>
              {editorState.isLink && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(editorState.linkHref, '_blank')}
                    title="Open link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveLink}
                    title="Remove link"
                  >
                    <Unlink className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </form>
        </PopoverContent>
      </Popover>

      {/* Comment button */}
      {onAddComment && (
        <>
        {/* Separator */}
        <div className="w-px h-4 bg-border mx-0.5" />
        <button
          onClick={onAddComment}
          className="rounded p-1.5 hover:bg-muted transition-colors"
          title="Add Comment"
        >
          <MessageSquare className="h-4 w-4" />
        </button>
        </>
      )}
    </BubbleMenu>
  )
}
