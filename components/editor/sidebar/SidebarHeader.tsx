'use client'

import { ChevronLeft, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface SidebarHeaderProps {
  title: string
  onBack?: () => void
  backLabel?: string
  onClose: () => void
}

export function SidebarHeader({ title, onBack, backLabel = 'Back to commands', onClose }: SidebarHeaderProps) {
  return (
    <div className="p-3 border-b flex items-center justify-between">
      <h3 className="font-medium text-sm">{title}</h3>
      <div className="flex items-center gap-1">
        {onBack && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onBack}
                aria-label={backLabel}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{backLabel}</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Close (Escape)</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
