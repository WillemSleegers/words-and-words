'use client'

import { useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  X,
  ChevronUp,
  ChevronDown,
  Replace,
  ReplaceAll,
  CaseSensitive,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { SearchHighlightStorage } from '@/lib/editor/extensions/search-highlight'

interface FindReplaceBarProps {
  editor: Editor | null
  open: boolean
  onClose: () => void
  showReplace: boolean
  onShowReplaceChange: (show: boolean) => void
}

export function FindReplaceBar({
  editor,
  open,
  onClose,
  showReplace,
  onShowReplaceChange,
}: FindReplaceBarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [replaceTerm, setReplaceTerm] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Get reactive match count from editor
  const editorState = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return { matchCount: 0, currentIndex: -1 }
      const storage = (e.storage as unknown as Record<string, SearchHighlightStorage>).searchHighlight
      return {
        matchCount: storage?.matches?.length ?? 0,
        currentIndex: storage?.currentIndex ?? -1,
      }
    },
  })
  const matchCount = editorState?.matchCount ?? 0
  const currentIndex = editorState?.currentIndex ?? -1

  // Focus search input when opened
  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus()
      searchInputRef.current.select()
    }
  }, [open])

  // Update search when term or matchCase changes
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    editor.commands.setSearchTerm(searchTerm, matchCase)
  }, [editor, searchTerm, matchCase])

  // Clear search when closing
  useEffect(() => {
    if (!open && editor && !editor.isDestroyed) {
      editor.commands.clearSearch()
    }
  }, [open, editor])

  // Handle keyboard shortcuts within the bar
  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        editor?.commands.goToPreviousMatch()
      } else {
        editor?.commands.goToNextMatch()
      }
      // Keep focus in search input so user can continue pressing Enter
      searchInputRef.current?.focus()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  function handleReplaceKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleReplace()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  function handleReplace() {
    if (!editor || matchCount === 0) return
    editor.commands.replaceCurrentMatch(replaceTerm)
  }

  function handleReplaceAll() {
    if (!editor || matchCount === 0) return
    editor.commands.replaceAllMatches(replaceTerm)
  }

  if (!open) return null

  return (
    <div className="absolute top-0 right-0 z-20 bg-background border rounded-lg shadow-lg p-2 flex flex-col gap-2 min-w-80">
      {/* Search row */}
      <div className="flex items-center gap-1">
        <Input
          ref={searchInputRef}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Find"
          className="h-8 flex-1"
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={matchCase ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setMatchCase(!matchCase)}
              aria-label="Match case"
            >
              <CaseSensitive className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Match case</TooltipContent>
        </Tooltip>

        <span className="text-xs text-muted-foreground w-16 text-center tabular-nums">
          {matchCount === 0
            ? 'No results'
            : currentIndex < 0
              ? `${matchCount} found`
              : `${currentIndex + 1} of ${matchCount}`}
        </span>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => editor?.commands.goToPreviousMatch()}
              disabled={matchCount === 0}
              aria-label="Previous match"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Previous (Shift+Enter)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => editor?.commands.goToNextMatch()}
              disabled={matchCount === 0}
              aria-label="Next match"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Next (Enter)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={showReplace ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => onShowReplaceChange(!showReplace)}
              aria-label={showReplace ? 'Hide replace' : 'Show replace'}
            >
              <Replace className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {showReplace ? 'Hide replace' : 'Replace (Cmd+H)'}
          </TooltipContent>
        </Tooltip>

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

      {/* Replace row */}
      {showReplace && (
        <div className="flex items-center gap-1">
          <Input
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            onKeyDown={handleReplaceKeyDown}
            placeholder="Replace"
            className="h-8 flex-1"
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleReplace}
                disabled={matchCount === 0}
                aria-label="Replace"
              >
                <Replace className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Replace</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleReplaceAll}
                disabled={matchCount === 0}
                aria-label="Replace all"
              >
                <ReplaceAll className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Replace all</TooltipContent>
          </Tooltip>

          {/* Spacer to align with search row */}
          <div className="w-8" />
        </div>
      )}
    </div>
  )
}
