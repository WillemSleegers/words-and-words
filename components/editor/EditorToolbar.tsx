'use client'

import { Command } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

interface EditorToolbarProps {
  onShowCommandPalette: () => void
}

export function EditorToolbar({ onShowCommandPalette }: EditorToolbarProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onShowCommandPalette}
          className="h-8 w-8"
        >
          <Command className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Command palette (⌘⇧P)</p>
      </TooltipContent>
    </Tooltip>
  )
}
