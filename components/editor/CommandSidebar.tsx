'use client'

import { useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  ListTree,
  Quote,
  CodeSquare,
  Image,
  Table,
  Link,
  Undo,
  Redo,
  Keyboard,
  Sun,
  Moon,
  Monitor,
  Eye,
  EyeOff,
  Type,
  ChevronUp,
  ChevronDown,
  FileDown,
  ChevronsUpDown,
  Variable,
  Search,
  Replace,
  ReplaceAll,
  CaseSensitive,
  Square,
  MessageSquare,
} from 'lucide-react'
import { exportToWord } from '@/lib/export-to-word'
import type { Settings as SettingsType } from '@/lib/settings'
import type { Comment, FontFamily, Variable as VariableType } from '@/lib/documents/types'
import type { CollapsibleHeadingsStorage } from '@/lib/editor/extensions/collapsible-headings'
import type { SearchHighlightStorage } from '@/lib/editor/extensions/search-highlight'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SidebarHeader } from './sidebar/SidebarHeader'
import { SidebarCommentsList } from './sidebar/SidebarCommentsList'

interface Command {
  id: string
  label: string
  icon: React.ReactNode
  action: () => void
  group: string
  keywords?: string[]
  hasSubmenu?: boolean
}

export type SidebarMode = 'commands' | 'find' | 'find-replace' | 'font' | 'variables' | 'comments'

interface CommandSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: SidebarMode
  onModeChange: (mode: SidebarMode) => void
  editor: Editor | null
  settings: SettingsType
  onSettingsChange: (updates: Partial<SettingsType>) => void
  onShowShortcuts: () => void
  onShowVariables: () => void
  documentTitle: string
  documentFont: FontFamily
  variables: VariableType[]
  onVariablesChange: (variables: VariableType[]) => void
  comments: Comment[]
  onCommentsChange: (comments: Comment[]) => void
  addCommentMode: boolean
  onAddCommentModeChange: (addMode: boolean) => void
  initialExpandedCommentId?: string | null
}

const fonts: { id: string; label: string; fontFamily: string; description: string }[] = [
  { id: 'system', label: 'System Default', fontFamily: 'system-ui, -apple-system, sans-serif', description: 'Uses your system font' },
  { id: 'inter', label: 'Inter', fontFamily: 'Inter, system-ui, sans-serif', description: 'Clean sans-serif' },
  { id: 'serif', label: 'Serif', fontFamily: 'Georgia, Times New Roman, serif', description: 'Classic serif' },
  { id: 'georgia', label: 'Georgia', fontFamily: 'Georgia, serif', description: 'Elegant serif' },
  { id: 'merriweather', label: 'Merriweather', fontFamily: 'Merriweather, Georgia, serif', description: 'Readable serif' },
  { id: 'mono', label: 'Monospace', fontFamily: 'ui-monospace, Cascadia Code, Source Code Pro, monospace', description: 'Fixed-width font' },
]

export function CommandSidebar({
  open,
  onOpenChange,
  mode,
  onModeChange,
  editor,
  settings,
  onSettingsChange,
  onShowShortcuts,
  onShowVariables,
  documentTitle,
  documentFont,
  variables,
  comments,
  onCommentsChange,
  addCommentMode,
  onAddCommentModeChange,
  initialExpandedCommentId,
}: CommandSidebarProps) {
  const [search, setSearch] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [replaceTerm, setReplaceTerm] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const commandInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Get reactive match count from editor for find mode
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

  // Focus appropriate input when mode changes
  useEffect(() => {
    if (!open) return
    if (mode === 'find' || mode === 'find-replace') {
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    } else if (mode === 'commands') {
      commandInputRef.current?.focus()
    }
  }, [open, mode])

  // Update search when term or matchCase changes (find mode)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    if (mode === 'find' || mode === 'find-replace') {
      editor.commands.setSearchTerm(searchTerm, matchCase)
    }
  }, [editor, searchTerm, matchCase, mode])

  // Clear search when closing or leaving find mode
  useEffect(() => {
    if ((!open || (mode !== 'find' && mode !== 'find-replace')) && editor && !editor.isDestroyed) {
      editor.commands.clearSearch()
      setSearchTerm('')
      setReplaceTerm('')
    }
  }, [open, mode, editor])

  // Reset search and selection when opening
  useEffect(() => {
    if (open) {
      setSearch('')
      setSelectedIndex(0)
    }
  }, [open])

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  // Handle escape key
  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onOpenChange(false)
        editor?.commands.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  function runCommand(action: () => void) {
    action()
    onOpenChange(false)
  }

  function selectFont(fontFamily: string) {
    editor?.chain().focus().setMark('textStyle', { fontFamily }).run()
    onOpenChange(false)
  }

  function getCurrentSectionInfo() {
    if (!editor) return null

    const { doc, selection } = editor.state
    const cursorPos = selection.from

    const headings: Array<{
      pos: number
      endPos: number
      level: number
      text: string
      index: number
    }> = []

    let headingIndex = 0
    doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        headings.push({
          pos,
          endPos: pos + node.nodeSize,
          level: node.attrs.level as number,
          text: node.textContent,
          index: headingIndex,
        })
        headingIndex++
      }
    })

    let currentHeading = null
    for (let i = headings.length - 1; i >= 0; i--) {
      if (headings[i].pos <= cursorPos) {
        currentHeading = headings[i]
        break
      }
    }

    if (!currentHeading) return null

    const key = `${currentHeading.level}-${currentHeading.index}-${currentHeading.text.slice(0, 50)}`
    const editorStorage = editor.storage as unknown as { collapsibleHeadings: CollapsibleHeadingsStorage }
    const storage = editorStorage.collapsibleHeadings
    const isCollapsed = storage?.collapsedHeadings?.has(key) ?? false

    return { heading: currentHeading, key, isCollapsed }
  }

  function toggleCurrentSectionCollapse() {
    const sectionInfo = getCurrentSectionInfo()
    if (!sectionInfo || !editor) return

    const { heading, key } = sectionInfo
    const editorStorage = editor.storage as unknown as { collapsibleHeadings: CollapsibleHeadingsStorage }
    const storage = editorStorage.collapsibleHeadings

    if (storage) {
      if (storage.collapsedHeadings.has(key)) {
        storage.collapsedHeadings.delete(key)
      } else {
        storage.collapsedHeadings.add(key)
      }

      if (storage.editorView) {
        storage.editorView.dispatch(
          storage.editorView.state.tr.setMeta('collapsibleHeadingsUpdate', true)
        )
      }
    }

    editor.chain().focus().setTextSelection(heading.endPos - 1).run()
  }

  // Find mode handlers
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

  const currentSectionInfo = getCurrentSectionInfo()

  const commands: Command[] = [
    // Formatting
    { id: 'bold', label: 'Bold', icon: <Bold className="h-4 w-4" />, action: () => editor?.chain().focus().toggleBold().run(), group: 'Formatting', keywords: ['strong', 'weight'] },
    { id: 'italic', label: 'Italic', icon: <Italic className="h-4 w-4" />, action: () => editor?.chain().focus().toggleItalic().run(), group: 'Formatting', keywords: ['emphasis'] },
    { id: 'underline', label: 'Underline', icon: <Underline className="h-4 w-4" />, action: () => editor?.chain().focus().toggleUnderline().run(), group: 'Formatting' },
    { id: 'strikethrough', label: 'Strikethrough', icon: <Strikethrough className="h-4 w-4" />, action: () => editor?.chain().focus().toggleStrike().run(), group: 'Formatting', keywords: ['strike', 'delete'] },
    { id: 'code', label: 'Inline Code', icon: <Code className="h-4 w-4" />, action: () => editor?.chain().focus().toggleCode().run(), group: 'Formatting', keywords: ['monospace'] },
    // Headings
    { id: 'title', label: 'Title', icon: <Type className="h-4 w-4" />, action: () => editor?.chain().focus().toggleTitle().run(), group: 'Headings', keywords: ['document title'] },
    { id: 'subtitle', label: 'Subtitle', icon: <Type className="h-4 w-4" />, action: () => editor?.chain().focus().toggleSubtitle().run(), group: 'Headings', keywords: ['tagline'] },
    { id: 'h1', label: 'Heading 1', icon: <Heading1 className="h-4 w-4" />, action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), group: 'Headings', keywords: ['h1'] },
    { id: 'h2', label: 'Heading 2', icon: <Heading2 className="h-4 w-4" />, action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), group: 'Headings', keywords: ['h2'] },
    { id: 'h3', label: 'Heading 3', icon: <Heading3 className="h-4 w-4" />, action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), group: 'Headings', keywords: ['h3'] },
    { id: 'h4', label: 'Heading 4', icon: <Heading4 className="h-4 w-4" />, action: () => editor?.chain().focus().toggleHeading({ level: 4 }).run(), group: 'Headings', keywords: ['h4'] },
    // Blocks
    { id: 'bullet-list', label: 'Bullet List', icon: <List className="h-4 w-4" />, action: () => editor?.chain().focus().toggleBulletList().run(), group: 'Blocks', keywords: ['unordered', 'ul'] },
    { id: 'numbered-list', label: 'Numbered List', icon: <ListOrdered className="h-4 w-4" />, action: () => editor?.chain().focus().toggleOrderedList().run(), group: 'Blocks', keywords: ['ordered', 'ol'] },
    { id: 'blockquote', label: 'Blockquote', icon: <Quote className="h-4 w-4" />, action: () => editor?.chain().focus().toggleBlockquote().run(), group: 'Blocks', keywords: ['quote'] },
    { id: 'code-block', label: 'Code Block', icon: <CodeSquare className="h-4 w-4" />, action: () => editor?.chain().focus().toggleCodeBlock().run(), group: 'Blocks', keywords: ['pre', 'syntax'] },
    // Insert
    { id: 'image', label: 'Insert Image', icon: <Image className="h-4 w-4" />, action: () => { const url = window.prompt('Image URL'); if (url) editor?.chain().focus().setImage({ src: url }).run() }, group: 'Insert', keywords: ['picture'] },
    { id: 'table', label: 'Insert Table', icon: <Table className="h-4 w-4" />, action: () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), group: 'Insert', keywords: ['grid'] },
    { id: 'link', label: 'Insert Link', icon: <Link className="h-4 w-4" />, action: () => { const url = window.prompt('URL'); if (url) editor?.chain().focus().setLink({ href: url }).run() }, group: 'Insert', keywords: ['url', 'href'] },
    { id: 'insert-variable', label: 'Insert Variable', icon: <Variable className="h-4 w-4" />, action: () => { onModeChange('variables'); setSearch('') }, group: 'Insert', keywords: ['placeholder', 'template'], hasSubmenu: variables.length > 0 },
    { id: 'manage-variables', label: 'Manage Variables', icon: <Variable className="h-4 w-4" />, action: () => onShowVariables(), group: 'Insert', keywords: ['placeholder', 'template', 'edit'] },
    // Actions
    ...(settings.showComments ? [
      { id: 'add-comment', label: 'Add Comment', icon: <MessageSquare className="h-4 w-4" />, action: () => { onAddCommentModeChange(true); onModeChange('comments') }, group: 'Actions', keywords: ['comment', 'annotate', 'note'], hasSubmenu: true },
      { id: 'show-comments', label: 'Show Comments', icon: <MessageSquare className="h-4 w-4" />, action: () => { onAddCommentModeChange(false); onModeChange('comments') }, group: 'Actions', keywords: ['comment', 'list', 'view', 'annotations'], hasSubmenu: true },
    ] : []),
    { id: 'find', label: 'Find', icon: <Search className="h-4 w-4" />, action: () => onModeChange('find'), group: 'Actions', keywords: ['search'], hasSubmenu: true },
    { id: 'find-replace', label: 'Find & Replace', icon: <Search className="h-4 w-4" />, action: () => onModeChange('find-replace'), group: 'Actions', keywords: ['search', 'replace', 'substitute'], hasSubmenu: true },
    { id: 'undo', label: 'Undo', icon: <Undo className="h-4 w-4" />, action: () => editor?.chain().focus().undo().run(), group: 'Actions' },
    { id: 'redo', label: 'Redo', icon: <Redo className="h-4 w-4" />, action: () => editor?.chain().focus().redo().run(), group: 'Actions' },
    { id: 'export-word', label: 'Export to Word', icon: <FileDown className="h-4 w-4" />, action: () => { if (editor) exportToWord(editor, documentTitle, documentFont, variables) }, group: 'Actions', keywords: ['download', 'docx'] },
    { id: 'toggle-section-collapse', label: currentSectionInfo?.isCollapsed ? 'Expand Section' : 'Collapse Section', icon: <ChevronsUpDown className="h-4 w-4" />, action: toggleCurrentSectionCollapse, group: 'Actions', keywords: ['collapse', 'expand', 'fold'] },
    // Settings
    { id: 'theme-light', label: 'Theme: Light', icon: <Sun className="h-4 w-4" />, action: () => onSettingsChange({ theme: 'light' }), group: 'Settings', keywords: ['appearance'] },
    { id: 'theme-dark', label: 'Theme: Dark', icon: <Moon className="h-4 w-4" />, action: () => onSettingsChange({ theme: 'dark' }), group: 'Settings', keywords: ['appearance', 'night'] },
    { id: 'theme-system', label: 'Theme: System', icon: <Monitor className="h-4 w-4" />, action: () => onSettingsChange({ theme: 'system' }), group: 'Settings', keywords: ['appearance', 'auto'] },
    { id: 'toggle-counter', label: settings.showCounter ? 'Hide Word Count' : 'Show Word Count', icon: settings.showCounter ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />, action: () => onSettingsChange({ showCounter: !settings.showCounter }), group: 'Settings', keywords: ['counter', 'words'] },
    { id: 'toggle-toc', label: settings.showTableOfContents ? 'Hide Table of Contents' : 'Show Table of Contents', icon: <ListTree className="h-4 w-4" />, action: () => onSettingsChange({ showTableOfContents: !settings.showTableOfContents }), group: 'Settings', keywords: ['toc', 'outline'] },
    { id: 'toggle-collapsible-sections', label: settings.showCollapsibleSections ? 'Disable Collapsible Sections' : 'Enable Collapsible Sections', icon: <ChevronsUpDown className="h-4 w-4" />, action: () => onSettingsChange({ showCollapsibleSections: !settings.showCollapsibleSections }), group: 'Settings', keywords: ['collapse', 'fold', 'headings', 'chevron'] },
    { id: 'toggle-comments', label: settings.showComments ? 'Disable Comments' : 'Enable Comments', icon: <MessageSquare className="h-4 w-4" />, action: () => onSettingsChange({ showComments: !settings.showComments }), group: 'Settings', keywords: ['comment', 'annotation', 'note'] },
    { id: 'toggle-page-style', label: settings.editorStyle === 'page' ? 'Editor Style: Seamless' : 'Editor Style: Page', icon: <Square className="h-4 w-4" />, action: () => onSettingsChange({ editorStyle: settings.editorStyle === 'page' ? 'seamless' : 'page' }), group: 'Settings', keywords: ['view', 'background', 'canvas'] },
    { id: 'font', label: 'Font', icon: <Type className="h-4 w-4" />, action: () => { onModeChange('font'); setSearch('') }, group: 'Settings', keywords: ['typeface'], hasSubmenu: true },
    // Help
    { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: <Keyboard className="h-4 w-4" />, action: () => onShowShortcuts(), group: 'Help', keywords: ['hotkeys', 'keys'] },
  ]

  const groups = ['Formatting', 'Headings', 'Blocks', 'Insert', 'Actions', 'Settings', 'Help']

  // Filter commands based on search
  const filteredCommands = search
    ? commands.filter(cmd => {
        const searchLower = search.toLowerCase()
        return cmd.label.toLowerCase().includes(searchLower) ||
          cmd.keywords?.some(k => k.toLowerCase().includes(searchLower))
      })
    : commands

  // Handle keyboard navigation in commands mode
  function handleCommandKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
      // Scroll selected item into view
      requestAnimationFrame(() => {
        const selected = listRef.current?.querySelector('[data-selected="true"]')
        selected?.scrollIntoView({ block: 'nearest' })
      })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
      requestAnimationFrame(() => {
        const selected = listRef.current?.querySelector('[data-selected="true"]')
        selected?.scrollIntoView({ block: 'nearest' })
      })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const command = filteredCommands[selectedIndex]
      if (command) {
        if (command.hasSubmenu) {
          command.action()
        } else {
          runCommand(command.action)
        }
      }
    }
  }

  if (!open) return null

  // Render find/find-replace mode
  if (mode === 'find' || mode === 'find-replace') {
    return (
      <div className="absolute right-0 top-0 bottom-0 w-72 border-l bg-background flex flex-col shadow-lg z-20">
        <SidebarHeader
          title={mode === 'find' ? 'Find' : 'Find & Replace'}
          onBack={() => onModeChange('commands')}
          onClose={() => onOpenChange(false)}
        />

        <div className="p-3 space-y-3">
          {/* Search input */}
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

            {/* Match info and navigation */}
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

          {/* Replace input (only in find-replace mode) */}
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

          {/* Toggle to show/hide replace */}
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

  // Render font selection mode
  if (mode === 'font') {
    return (
      <div className="absolute right-0 top-0 bottom-0 w-72 border-l bg-background flex flex-col shadow-lg z-20">
        <SidebarHeader
          title="Select Font"
          onBack={() => onModeChange('commands')}
          onClose={() => onOpenChange(false)}
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

  // Render variables selection mode
  if (mode === 'variables') {
    return (
      <div className="absolute right-0 top-0 bottom-0 w-72 border-l bg-background flex flex-col shadow-lg z-20">
        <SidebarHeader
          title="Insert Variable"
          onBack={() => onModeChange('commands')}
          onClose={() => onOpenChange(false)}
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
                  onOpenChange(false)
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

  // Render comments mode
  if (mode === 'comments') {
    return (
      <SidebarCommentsList
        editor={editor}
        comments={comments}
        onCommentsChange={onCommentsChange}
        onBack={() => onModeChange('commands')}
        onClose={() => onOpenChange(false)}
        addMode={addCommentMode}
        initialExpandedId={initialExpandedCommentId}
      />
    )
  }


  // Render main commands mode
  return (
    <div className="absolute right-0 top-0 bottom-0 w-72 border-l bg-background flex flex-col shadow-lg z-20">
      <SidebarHeader title="Commands" onClose={() => onOpenChange(false)} />

      <div className="p-3 border-b">
        <Input
          ref={commandInputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleCommandKeyDown}
          placeholder="Type a command..."
          className="h-8"
        />
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-2">
        {filteredCommands.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            No commands found.
          </div>
        ) : search ? (
          // Show flat list when searching
          filteredCommands.map((command, index) => (
            <button
              key={command.id}
              data-selected={index === selectedIndex}
              onClick={() => {
                if (command.hasSubmenu) {
                  command.action()
                } else {
                  runCommand(command.action)
                }
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 ${
                index === selectedIndex ? 'bg-accent' : 'hover:bg-accent'
              }`}
            >
              <span className="text-muted-foreground">{command.icon}</span>
              <span className="text-sm flex-1">{command.label}</span>
            </button>
          ))
        ) : (
          // Show grouped list when not searching (with flat index for selection)
          (() => {
            let flatIndex = 0
            return groups.map((group) => {
              const groupCommands = filteredCommands.filter((cmd) => cmd.group === group)
              if (groupCommands.length === 0) return null
              return (
                <div key={group} className="mb-4">
                  <div className="text-xs font-medium text-muted-foreground px-3 py-1">
                    {group}
                  </div>
                  {groupCommands.map((command) => {
                    const currentIndex = flatIndex
                    flatIndex++
                    return (
                      <button
                        key={command.id}
                        data-selected={currentIndex === selectedIndex}
                        onClick={() => {
                          if (command.hasSubmenu) {
                            command.action()
                          } else {
                            runCommand(command.action)
                          }
                        }}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 ${
                          currentIndex === selectedIndex ? 'bg-accent' : 'hover:bg-accent'
                        }`}
                      >
                        <span className="text-muted-foreground">{command.icon}</span>
                        <span className="text-sm flex-1">{command.label}</span>
                      </button>
                    )
                  })}
                </div>
              )
            })
          })()
        )}
      </div>
    </div>
  )
}
