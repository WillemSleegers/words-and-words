'use client'

import type { Editor } from '@tiptap/react'
import { Variable } from 'lucide-react'
import type { Variable as VariableType } from '@/lib/documents/types'
import type { SidebarMode } from '../CommandSidebar'
import { SidebarHeader } from './SidebarHeader'

interface SidebarVariableInsertProps {
  onModeChange: (mode: SidebarMode) => void
  onClose: () => void
  editor: Editor | null
  variables: VariableType[]
}

export function SidebarVariableInsert({ onModeChange, onClose, editor, variables }: SidebarVariableInsertProps) {
  return (
    <div className="absolute right-0 top-0 bottom-0 w-72 border-l bg-background flex flex-col shadow-lg z-20">
      <SidebarHeader
        title="Insert Variable"
        onBack={() => onModeChange('commands')}
        onClose={onClose}
      />
      <div className="flex-1 overflow-y-auto p-2">
        {variables.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            No variables defined yet.
          </div>
        ) : (
          variables.map((variable) => (
            <button
              key={variable.id}
              onClick={() => {
                editor?.chain().focus().insertVariable(variable.id).run()
                onClose()
              }}
              className="w-full text-left px-3 py-2 rounded-md hover:bg-accent flex items-center gap-2"
            >
              <Variable className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="text-sm">{variable.name}</div>
                <div className="text-xs text-muted-foreground truncate">{variable.value}</div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
