'use client'

import type { Editor } from '@tiptap/react'
import { Type } from 'lucide-react'
import { fonts } from '@/lib/editor/commands'
import type { SidebarMode } from '../CommandSidebar'
import { SidebarHeader } from './SidebarHeader'

interface SidebarFontPickerProps {
  onModeChange: (mode: SidebarMode) => void
  onClose: () => void
  editor: Editor | null
}

export function SidebarFontPicker({ onModeChange, onClose, editor }: SidebarFontPickerProps) {
  function selectFont(fontFamily: string) {
    editor?.chain().focus().setMark('textStyle', { fontFamily }).run()
    onClose()
  }

  return (
    <div className="absolute right-0 top-0 bottom-0 w-72 border-l bg-background flex flex-col shadow-lg z-20">
      <SidebarHeader
        title="Select Font"
        onBack={() => onModeChange('commands')}
        onClose={onClose}
      />
      <div className="flex-1 overflow-y-auto p-2">
        {fonts.map((font) => (
          <button
            key={font.id}
            onClick={() => selectFont(font.fontFamily)}
            className="w-full text-left px-3 py-2 rounded-md hover:bg-accent flex items-center gap-2"
          >
            <Type className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm">{font.label}</div>
              <div className="text-xs text-muted-foreground">{font.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
