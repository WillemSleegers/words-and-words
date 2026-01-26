'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'

interface CollapseToggleButtonProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function CollapseToggleButton({
  isCollapsed,
  onToggle,
}: CollapseToggleButtonProps) {
  return (
    <button
      type="button"
      className={`heading-collapse-toggle ${isCollapsed ? 'collapsed' : ''}`}
      onMouseDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onToggle()
      }}
      aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
    >
      {isCollapsed ? (
        <ChevronRight className="h-5 w-5" />
      ) : (
        <ChevronDown className="h-5 w-5" />
      )}
    </button>
  )
}
