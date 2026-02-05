"use client"

import type { Editor } from "@tiptap/react"
import type { Settings } from "@/lib/settings"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type SaveStatus = "idle" | "saving" | "saved"

interface StatusBarProps {
  editor: Editor | null
  settings: Settings
  onSettingsChange: (updates: Partial<Settings>) => void
  saveStatus: SaveStatus
  hasUnsavedChanges: boolean
}

export function StatusBar({
  editor,
  settings,
  onSettingsChange,
  saveStatus,
  hasUnsavedChanges,
}: StatusBarProps) {
  const counterVisible = settings.showCounter && editor != null
  const saveVisible = settings.showSaveStatus

  // Don't render if nothing is enabled
  if (!counterVisible && !saveVisible) return null

  const saveLabel = hasUnsavedChanges
    ? "Unsaved changes"
    : saveStatus === "saving"
      ? "Saving..."
      : "Saved"

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-10">
      <div className="flex items-center bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border">
        {counterVisible && (
          <button
            onClick={() =>
              onSettingsChange({
                counter: settings.counter === "words" ? "characters" : "words",
              })
            }
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {settings.counter === "words"
              ? `${editor.storage.characterCount.words()} words`
              : `${editor.storage.characterCount.characters()} characters`}
          </button>
        )}

        {counterVisible && saveVisible && (
          <div className="w-px h-3.5 bg-border mx-2.5" />
        )}

        {saveVisible && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center py-1" aria-live="polite" aria-label={saveLabel}>
                <span
                  className={cn(
                    "size-1.5 rounded-full transition-colors duration-300",
                    hasUnsavedChanges && "bg-amber-500",
                    !hasUnsavedChanges && saveStatus === "saving" && "bg-muted-foreground animate-pulse",
                    !hasUnsavedChanges && saveStatus === "saved" && "bg-green-500",
                    !hasUnsavedChanges && saveStatus === "idle" && "bg-muted-foreground/40"
                  )}
                />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{saveLabel}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
