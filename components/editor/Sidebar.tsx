'use client'

import type { Editor } from '@tiptap/react'
import {
  ArrowLeft,
  Image,
  Table,
  Keyboard,
  Focus,
  Moon,
  Sun,
} from 'lucide-react'
import { useState } from 'react'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  editor: Editor | null
  onBack: () => void
  onShowShortcuts: () => void
}

interface SidebarButtonProps {
  onClick: () => void
  children: React.ReactNode
  tooltip: string
  isActive?: boolean
}

function SidebarButton({ onClick, children, tooltip, isActive }: SidebarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isActive ? "secondary" : "ghost"}
          size="icon"
          onClick={onClick}
          className="w-8 h-8"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export function Sidebar({ editor, onBack, onShowShortcuts }: SidebarProps) {
  const [focusMode, setFocusMode] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

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

  function toggleFocusMode() {
    setFocusMode(!focusMode)
    // TODO: Implement focus mode (hide UI, center content, dim surroundings)
  }

  function toggleDarkMode() {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <>
      <div className="flex flex-col items-center py-2 gap-1">
        {/* Back button */}
        <SidebarButton onClick={onBack} tooltip="Back to documents">
          <ArrowLeft className="h-4 w-4" />
        </SidebarButton>

        <Separator className="w-8 my-1" />

        {/* Help - keyboard shortcuts */}
        <SidebarButton onClick={onShowShortcuts} tooltip="Keyboard shortcuts (?)">
          <Keyboard className="h-4 w-4" />
        </SidebarButton>

        <Separator className="w-8 my-1" />

        {/* Features that need UI */}
        {editor && (
          <>
            <SidebarButton onClick={addImage} tooltip="Insert image">
              <Image className="h-4 w-4" />
            </SidebarButton>
            <SidebarButton onClick={insertTable} tooltip="Insert table">
              <Table className="h-4 w-4" />
            </SidebarButton>
          </>
        )}

        <Separator className="w-8 my-1" />

        {/* Mode toggles */}
        <SidebarButton onClick={toggleFocusMode} tooltip="Focus mode" isActive={focusMode}>
          <Focus className="h-4 w-4" />
        </SidebarButton>
        <SidebarButton onClick={toggleDarkMode} tooltip="Toggle dark mode" isActive={darkMode}>
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </SidebarButton>
      </div>

    </>
  )
}
