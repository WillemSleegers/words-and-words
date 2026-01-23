'use client'

import type { Editor } from '@tiptap/react'
import {
  Image,
  Table,
  Keyboard,
  Settings,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

interface EditorToolbarProps {
  editor: Editor | null
  onShowShortcuts: () => void
  onShowSettings: () => void
}

interface ToolbarButtonProps {
  onClick: () => void
  children: React.ReactNode
  tooltip: string
  isActive?: boolean
}

function ToolbarButton({ onClick, children, tooltip, isActive }: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isActive ? 'secondary' : 'ghost'}
          size="icon"
          onClick={onClick}
          className="h-8 w-8"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export function EditorToolbar({ editor, onShowShortcuts, onShowSettings }: EditorToolbarProps) {
  function addImage() {
    if (!editor) return
    const url = window.prompt('Image URL')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  function insertTable() {
    if (!editor) return
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  return (
    <div className="flex items-center gap-1">
      {editor && (
        <>
          <ToolbarButton onClick={addImage} tooltip="Insert image">
            <Image className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={insertTable} tooltip="Insert table">
            <Table className="h-4 w-4" />
          </ToolbarButton>
        </>
      )}
      <ToolbarButton onClick={onShowShortcuts} tooltip="Keyboard shortcuts (?)">
        <Keyboard className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={onShowSettings} tooltip="Settings">
        <Settings className="h-4 w-4" />
      </ToolbarButton>
    </div>
  )
}
