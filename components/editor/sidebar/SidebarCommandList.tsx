'use client'

import { useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Input } from '@/components/ui/input'
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
  FileDown,
  ChevronsUpDown,
  Variable,
  Search,
  MessageSquare,
  Square,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react'
import { exportToWord } from '@/lib/export-to-word'
import { getCurrentSectionInfo, toggleCurrentSectionCollapse } from '@/lib/editor/commands'
import type { Settings as SettingsType } from '@/lib/settings'
import type { FontFamily, Variable as VariableType } from '@/lib/documents/types'
import type { SidebarMode } from '../CommandSidebar'
import { SidebarHeader } from './SidebarHeader'

interface Command {
  id: string
  label: string
  icon: React.ReactNode
  action: () => void
  group: string
  keywords?: string[]
  hasSubmenu?: boolean
}

interface SidebarCommandListProps {
  onModeChange: (mode: SidebarMode) => void
  onClose: () => void
  editor: Editor | null
  settings: SettingsType
  onSettingsChange: (updates: Partial<SettingsType>) => void
  onShowShortcuts: () => void
  onShowVariables: () => void
  documentTitle: string
  documentFont: FontFamily
  variables: VariableType[]
  onAddComment: () => void
  onShowComments: () => void
}

export function SidebarCommandList({
  onModeChange,
  onClose,
  editor,
  settings,
  onSettingsChange,
  onShowShortcuts,
  onShowVariables,
  documentTitle,
  documentFont,
  variables,
  onAddComment,
  onShowComments,
}: SidebarCommandListProps) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const commandInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Focus input on mount
  useEffect(() => {
    commandInputRef.current?.focus()
  }, [])

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  function runCommand(action: () => void) {
    action()
    onClose()
  }

  const currentSectionInfo = getCurrentSectionInfo(editor)

  const commands: Command[] = [
    // Formatting
    { id: 'bold', label: 'Bold', icon: <Bold className="h-4 w-4" />, action: () => editor?.chain().focus().toggleBold().run(), group: 'Formatting', keywords: ['strong', 'weight'] },
    { id: 'italic', label: 'Italic', icon: <Italic className="h-4 w-4" />, action: () => editor?.chain().focus().toggleItalic().run(), group: 'Formatting', keywords: ['emphasis'] },
    { id: 'underline', label: 'Underline', icon: <Underline className="h-4 w-4" />, action: () => editor?.chain().focus().toggleUnderline().run(), group: 'Formatting' },
    { id: 'strikethrough', label: 'Strikethrough', icon: <Strikethrough className="h-4 w-4" />, action: () => editor?.chain().focus().toggleStrike().run(), group: 'Formatting', keywords: ['strike', 'delete'] },
    { id: 'code', label: 'Inline Code', icon: <Code className="h-4 w-4" />, action: () => editor?.chain().focus().toggleCode().run(), group: 'Formatting', keywords: ['monospace'] },
    { id: 'align-left', label: 'Align Left', icon: <AlignLeft className="h-4 w-4" />, action: () => editor?.chain().focus().setTextAlign('left').run(), group: 'Formatting', keywords: ['alignment', 'text align'] },
    { id: 'align-center', label: 'Align Center', icon: <AlignCenter className="h-4 w-4" />, action: () => editor?.chain().focus().setTextAlign('center').run(), group: 'Formatting', keywords: ['alignment', 'text align'] },
    { id: 'align-right', label: 'Align Right', icon: <AlignRight className="h-4 w-4" />, action: () => editor?.chain().focus().setTextAlign('right').run(), group: 'Formatting', keywords: ['alignment', 'text align'] },
    { id: 'align-justify', label: 'Justify', icon: <AlignJustify className="h-4 w-4" />, action: () => editor?.chain().focus().setTextAlign('justify').run(), group: 'Formatting', keywords: ['alignment', 'text align'] },
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
    { id: 'insert-variable', label: 'Insert Variable', icon: <Variable className="h-4 w-4" />, action: () => { onModeChange('variables'); }, group: 'Insert', keywords: ['placeholder', 'template'], hasSubmenu: variables.length > 0 },
    { id: 'manage-variables', label: 'Manage Variables', icon: <Variable className="h-4 w-4" />, action: () => onShowVariables(), group: 'Insert', keywords: ['placeholder', 'template', 'edit'] },
    // Actions
    ...(settings.showComments ? [
      { id: 'add-comment', label: 'Add Comment', icon: <MessageSquare className="h-4 w-4" />, action: onAddComment, group: 'Actions', keywords: ['comment', 'annotate', 'note'], hasSubmenu: true },
      { id: 'show-comments', label: 'Show Comments', icon: <MessageSquare className="h-4 w-4" />, action: onShowComments, group: 'Actions', keywords: ['comment', 'list', 'view', 'annotations'], hasSubmenu: true },
    ] : []),
    { id: 'find', label: 'Find', icon: <Search className="h-4 w-4" />, action: () => onModeChange('find'), group: 'Actions', keywords: ['search'], hasSubmenu: true },
    { id: 'find-replace', label: 'Find & Replace', icon: <Search className="h-4 w-4" />, action: () => onModeChange('find-replace'), group: 'Actions', keywords: ['search', 'replace', 'substitute'], hasSubmenu: true },
    { id: 'undo', label: 'Undo', icon: <Undo className="h-4 w-4" />, action: () => editor?.chain().focus().undo().run(), group: 'Actions' },
    { id: 'redo', label: 'Redo', icon: <Redo className="h-4 w-4" />, action: () => editor?.chain().focus().redo().run(), group: 'Actions' },
    { id: 'export-word', label: 'Export to Word', icon: <FileDown className="h-4 w-4" />, action: () => { if (editor) exportToWord(editor, documentTitle, documentFont, variables) }, group: 'Actions', keywords: ['download', 'docx'] },
    { id: 'toggle-section-collapse', label: currentSectionInfo?.isCollapsed ? 'Expand Section' : 'Collapse Section', icon: <ChevronsUpDown className="h-4 w-4" />, action: () => toggleCurrentSectionCollapse(editor), group: 'Actions', keywords: ['collapse', 'expand', 'fold'] },
    // Settings
    { id: 'theme-light', label: 'Theme: Light', icon: <Sun className="h-4 w-4" />, action: () => onSettingsChange({ theme: 'light' }), group: 'Settings', keywords: ['appearance'] },
    { id: 'theme-dark', label: 'Theme: Dark', icon: <Moon className="h-4 w-4" />, action: () => onSettingsChange({ theme: 'dark' }), group: 'Settings', keywords: ['appearance', 'night'] },
    { id: 'theme-system', label: 'Theme: System', icon: <Monitor className="h-4 w-4" />, action: () => onSettingsChange({ theme: 'system' }), group: 'Settings', keywords: ['appearance', 'auto'] },
    { id: 'toggle-counter', label: settings.showCounter ? 'Hide Word Count' : 'Show Word Count', icon: settings.showCounter ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />, action: () => onSettingsChange({ showCounter: !settings.showCounter }), group: 'Settings', keywords: ['counter', 'words'] },
    { id: 'toggle-toc', label: settings.showTableOfContents ? 'Hide Table of Contents' : 'Show Table of Contents', icon: <ListTree className="h-4 w-4" />, action: () => onSettingsChange({ showTableOfContents: !settings.showTableOfContents }), group: 'Settings', keywords: ['toc', 'outline'] },
    { id: 'toggle-collapsible-sections', label: settings.showCollapsibleSections ? 'Disable Collapsible Sections' : 'Enable Collapsible Sections', icon: <ChevronsUpDown className="h-4 w-4" />, action: () => onSettingsChange({ showCollapsibleSections: !settings.showCollapsibleSections }), group: 'Settings', keywords: ['collapse', 'fold', 'headings', 'chevron'] },
    { id: 'toggle-comments', label: settings.showComments ? 'Disable Comments' : 'Enable Comments', icon: <MessageSquare className="h-4 w-4" />, action: () => onSettingsChange({ showComments: !settings.showComments }), group: 'Settings', keywords: ['comment', 'annotation', 'note'] },
    { id: 'toggle-page-style', label: settings.editorStyle === 'page' ? 'Editor Style: Seamless' : 'Editor Style: Page', icon: <Square className="h-4 w-4" />, action: () => onSettingsChange({ editorStyle: settings.editorStyle === 'page' ? 'seamless' : 'page' }), group: 'Settings', keywords: ['view', 'background', 'canvas'] },
    { id: 'font', label: 'Font', icon: <Type className="h-4 w-4" />, action: () => onModeChange('font'), group: 'Settings', keywords: ['typeface'], hasSubmenu: true },
    // Help
    { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: <Keyboard className="h-4 w-4" />, action: () => onShowShortcuts(), group: 'Help', keywords: ['hotkeys', 'keys'] },
  ]

  const groups = ['Formatting', 'Headings', 'Blocks', 'Insert', 'Actions', 'Settings', 'Help']

  const filteredCommands = search
    ? commands.filter(cmd => {
        const searchLower = search.toLowerCase()
        return cmd.label.toLowerCase().includes(searchLower) ||
          cmd.keywords?.some(k => k.toLowerCase().includes(searchLower))
      })
    : commands

  function handleCommandKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
      requestAnimationFrame(() => {
        listRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'nearest' })
      })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
      requestAnimationFrame(() => {
        listRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'nearest' })
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

  return (
    <div className="absolute right-0 top-0 bottom-0 w-72 border-l bg-background flex flex-col shadow-lg z-20">
      <SidebarHeader title="Commands" onClose={onClose} />

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
