'use client'

import { useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  ChevronUp,
  ChevronDown,
  Replace,
  ReplaceAll,
  CaseSensitive,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { SearchHighlightStorage } from '@/lib/editor/extensions/search-highlight'
import type { SidebarMode } from '../CommandSidebar'
import { SidebarHeader } from './SidebarHeader'

interface SidebarFindReplaceProps {
  mode: 'find' | 'find-replace'
  onModeChange: (mode: SidebarMode) => void
  onClose: () => void
  editor: Editor | null
}

export function SidebarFindReplace({ mode, onModeChange, onClose, editor }: SidebarFindReplaceProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [replaceTerm, setReplaceTerm] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

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

  // Focus search input on mount and mode change
  useEffect(() => {
    searchInputRef.current?.focus()
    searchInputRef.current?.select()
  }, [mode])

  // Update search when term or matchCase changes
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    editor.commands.setSearchTerm(searchTerm, matchCase)
  }, [editor, searchTerm, matchCase])

  // Clear search on unmount
  useEffect(() => {
    return () => {
      if (editor && !editor.isDestroyed) {
        editor.commands.clearSearch()
      }
    }
  }, [editor])

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        editor?.commands.goToPreviousMatch()
      } else {
        editor?.commands.goToNextMatch()
      }
      searchInputRef.current?.focus()
    }
  }

  function handleReplaceKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleReplace()
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

  return (
    <div className="absolute right-0 top-0 bottom-0 w-72 border-l bg-background flex flex-col shadow-lg z-20">
      <SidebarHeader
        title={mode === 'find' ? 'Find' : 'Find & Replace'}
        onBack={() => onModeChange('commands')}
        onClose={onClose}
      />

      <div className="p-3 space-y-3">
        <div className="space-y-2">
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
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {matchCount === 0
                ? 'No results'
                : currentIndex < 0
                  ? `${matchCount} found`
                  : `${currentIndex + 1} of ${matchCount}`}
            </span>
            <div className="flex items-center gap-1">
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
            </div>
          </div>
        </div>

        {mode === 'find-replace' && (
          <div className="space-y-2">
            <Input
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              onKeyDown={handleReplaceKeyDown}
              placeholder="Replace"
              className="h-8"
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReplace}
                disabled={matchCount === 0}
                className="flex-1"
              >
                <Replace className="h-4 w-4 mr-1" />
                Replace
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReplaceAll}
                disabled={matchCount === 0}
                className="flex-1"
              >
                <ReplaceAll className="h-4 w-4 mr-1" />
                All
              </Button>
            </div>
          </div>
        )}

        {mode === 'find' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onModeChange('find-replace')}
            className="w-full justify-start"
          >
            <Replace className="h-4 w-4 mr-2" />
            Show Replace
          </Button>
        )}
        {mode === 'find-replace' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onModeChange('find')}
            className="w-full justify-start text-muted-foreground"
          >
            Hide Replace
          </Button>
        )}
      </div>
    </div>
  )
}
