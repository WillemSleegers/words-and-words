'use client'

import { useEffect, useState } from 'react'
import type { Editor } from '@tiptap/react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
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
  ChevronRight,
  ChevronLeft,
  Check,
  FileDown,
  ChevronsUpDown,
  Variable,
  Search,
} from 'lucide-react'
import { exportToWord } from '@/lib/export-to-word'
import type { Settings as SettingsType } from '@/lib/settings'
import type { FontFamily, Variable as VariableType } from '@/lib/documents/types'
import type { CollapsibleHeadingsStorage } from '@/lib/editor/extensions/collapsible-headings'

interface Command {
  id: string
  label: string
  icon: React.ReactNode
  action: () => void
  group: string
  keywords?: string[]
  hasSubmenu?: boolean
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editor: Editor | null
  settings: SettingsType
  onSettingsChange: (updates: Partial<SettingsType>) => void
  onShowShortcuts: () => void
  onShowVariables: () => void
  onShowFindReplace: () => void
  documentTitle: string
  documentFont: FontFamily
  variables: VariableType[]
}

type Page = null | 'font' | 'variables'

const fonts: { id: string; label: string; fontFamily: string; description: string }[] = [
  { id: 'system', label: 'System Default', fontFamily: 'system-ui, -apple-system, sans-serif', description: 'Uses your system font' },
  { id: 'inter', label: 'Inter', fontFamily: 'Inter, system-ui, sans-serif', description: 'Clean sans-serif' },
  { id: 'serif', label: 'Serif', fontFamily: 'Georgia, Times New Roman, serif', description: 'Classic serif' },
  { id: 'georgia', label: 'Georgia', fontFamily: 'Georgia, serif', description: 'Elegant serif' },
  { id: 'merriweather', label: 'Merriweather', fontFamily: 'Merriweather, Georgia, serif', description: 'Readable serif' },
  { id: 'mono', label: 'Monospace', fontFamily: 'ui-monospace, Cascadia Code, Source Code Pro, monospace', description: 'Fixed-width font' },
]

export function CommandPalette({
  open,
  onOpenChange,
  editor,
  settings,
  onSettingsChange,
  onShowShortcuts,
  onShowVariables,
  onShowFindReplace,
  documentTitle,
  documentFont,
  variables,
}: CommandPaletteProps) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState<Page>(null)

  // Reset search and page when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSearch('')
      setPage(null)
    }
  }, [open])

  function runCommand(action: () => void, keepOpen = false) {
    action()
    if (!keepOpen) {
      onOpenChange(false)
    }
  }

  function selectFont(fontFamily: string) {
    editor?.chain().focus().setMark('textStyle', { fontFamily }).run()
    onOpenChange(false)
  }

  function getCurrentSectionInfo() {
    if (!editor) return null

    const { doc, selection } = editor.state
    const cursorPos = selection.from

    // Find all headings and their positions
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

    // Find the heading that contains the cursor (the nearest heading before cursor)
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

      // Force re-render
      if (storage.editorView) {
        storage.editorView.dispatch(
          storage.editorView.state.tr.setMeta('collapsibleHeadingsUpdate', true)
        )
      }
    }

    // Move cursor to the end of the heading
    editor.chain().focus().setTextSelection(heading.endPos - 1).run()
  }

  const currentSectionInfo = getCurrentSectionInfo()

  const commands: Command[] = [
    // Formatting
    {
      id: 'bold',
      label: 'Bold',
      icon: <Bold className="h-4 w-4" />,
      action: () => editor?.chain().focus().toggleBold().run(),
      group: 'Formatting',
      keywords: ['strong', 'weight'],
    },
    {
      id: 'italic',
      label: 'Italic',
      icon: <Italic className="h-4 w-4" />,
      action: () => editor?.chain().focus().toggleItalic().run(),
      group: 'Formatting',
      keywords: ['emphasis', 'slant'],
    },
    {
      id: 'underline',
      label: 'Underline',
      icon: <Underline className="h-4 w-4" />,
      action: () => editor?.chain().focus().toggleUnderline().run(),
      group: 'Formatting',
    },
    {
      id: 'strikethrough',
      label: 'Strikethrough',
      icon: <Strikethrough className="h-4 w-4" />,
      action: () => editor?.chain().focus().toggleStrike().run(),
      group: 'Formatting',
      keywords: ['strike', 'delete', 'cross'],
    },
    {
      id: 'code',
      label: 'Inline Code',
      icon: <Code className="h-4 w-4" />,
      action: () => editor?.chain().focus().toggleCode().run(),
      group: 'Formatting',
      keywords: ['monospace'],
    },
    // Headings
    {
      id: 'title',
      label: 'Title',
      icon: <Type className="h-4 w-4" />,
      action: () => editor?.chain().focus().toggleTitle().run(),
      group: 'Headings',
      keywords: ['document title', 'main heading'],
    },
    {
      id: 'subtitle',
      label: 'Subtitle',
      icon: <Type className="h-4 w-4" />,
      action: () => editor?.chain().focus().toggleSubtitle().run(),
      group: 'Headings',
      keywords: ['document subtitle', 'tagline'],
    },
    {
      id: 'h1',
      label: 'Heading 1',
      icon: <Heading1 className="h-4 w-4" />,
      action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
      group: 'Headings',
      keywords: ['h1'],
    },
    {
      id: 'h2',
      label: 'Heading 2',
      icon: <Heading2 className="h-4 w-4" />,
      action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
      group: 'Headings',
      keywords: ['h2'],
    },
    {
      id: 'h3',
      label: 'Heading 3',
      icon: <Heading3 className="h-4 w-4" />,
      action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
      group: 'Headings',
      keywords: ['h3'],
    },
    {
      id: 'h4',
      label: 'Heading 4',
      icon: <Heading4 className="h-4 w-4" />,
      action: () => editor?.chain().focus().toggleHeading({ level: 4 }).run(),
      group: 'Headings',
      keywords: ['h4'],
    },
    // Blocks
    {
      id: 'bullet-list',
      label: 'Bullet List',
      icon: <List className="h-4 w-4" />,
      action: () => editor?.chain().focus().toggleBulletList().run(),
      group: 'Blocks',
      keywords: ['unordered', 'ul'],
    },
    {
      id: 'numbered-list',
      label: 'Numbered List',
      icon: <ListOrdered className="h-4 w-4" />,
      action: () => editor?.chain().focus().toggleOrderedList().run(),
      group: 'Blocks',
      keywords: ['ordered', 'ol'],
    },
    {
      id: 'blockquote',
      label: 'Blockquote',
      icon: <Quote className="h-4 w-4" />,
      action: () => editor?.chain().focus().toggleBlockquote().run(),
      group: 'Blocks',
      keywords: ['quote', 'citation'],
    },
    {
      id: 'code-block',
      label: 'Code Block',
      icon: <CodeSquare className="h-4 w-4" />,
      action: () => editor?.chain().focus().toggleCodeBlock().run(),
      group: 'Blocks',
      keywords: ['pre', 'syntax'],
    },
    // Insert
    {
      id: 'image',
      label: 'Insert Image',
      icon: <Image className="h-4 w-4" />,
      action: () => {
        const url = window.prompt('Image URL')
        if (url) editor?.chain().focus().setImage({ src: url }).run()
      },
      group: 'Insert',
      keywords: ['picture', 'photo'],
    },
    {
      id: 'table',
      label: 'Insert Table',
      icon: <Table className="h-4 w-4" />,
      action: () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
      group: 'Insert',
      keywords: ['grid'],
    },
    {
      id: 'link',
      label: 'Insert Link',
      icon: <Link className="h-4 w-4" />,
      action: () => {
        const url = window.prompt('URL')
        if (url) editor?.chain().focus().setLink({ href: url }).run()
      },
      group: 'Insert',
      keywords: ['url', 'href', 'anchor'],
    },
    {
      id: 'insert-variable',
      label: 'Insert Variable',
      icon: <Variable className="h-4 w-4" />,
      action: () => {
        if (variables.length === 0) {
          onShowVariables()
        } else {
          setPage('variables')
          setSearch('')
        }
      },
      group: 'Insert',
      keywords: ['placeholder', 'template', 'dynamic'],
      hasSubmenu: variables.length > 0,
    },
    {
      id: 'manage-variables',
      label: 'Manage Variables',
      icon: <Variable className="h-4 w-4" />,
      action: () => onShowVariables(),
      group: 'Insert',
      keywords: ['placeholder', 'template', 'dynamic', 'edit'],
    },
    // Actions
    {
      id: 'find-replace',
      label: 'Find & Replace',
      icon: <Search className="h-4 w-4" />,
      action: () => onShowFindReplace(),
      group: 'Actions',
      keywords: ['search', 'find', 'replace', 'substitute'],
    },
    {
      id: 'undo',
      label: 'Undo',
      icon: <Undo className="h-4 w-4" />,
      action: () => editor?.chain().focus().undo().run(),
      group: 'Actions',
    },
    {
      id: 'redo',
      label: 'Redo',
      icon: <Redo className="h-4 w-4" />,
      action: () => editor?.chain().focus().redo().run(),
      group: 'Actions',
    },
    {
      id: 'export-word',
      label: 'Export to Word',
      icon: <FileDown className="h-4 w-4" />,
      action: () => {
        if (editor) {
          exportToWord(editor, documentTitle, documentFont, variables)
        }
      },
      group: 'Actions',
      keywords: ['download', 'docx', 'word', 'save', 'export'],
    },
    {
      id: 'toggle-section-collapse',
      label: currentSectionInfo?.isCollapsed ? 'Expand Section' : 'Collapse Section',
      icon: <ChevronsUpDown className="h-4 w-4" />,
      action: toggleCurrentSectionCollapse,
      group: 'Actions',
      keywords: ['collapse', 'expand', 'fold', 'hide', 'heading'],
    },
    // Settings
    {
      id: 'theme-light',
      label: 'Theme: Light',
      icon: <Sun className="h-4 w-4" />,
      action: () => onSettingsChange({ theme: 'light' }),
      group: 'Settings',
      keywords: ['appearance', 'bright'],
    },
    {
      id: 'theme-dark',
      label: 'Theme: Dark',
      icon: <Moon className="h-4 w-4" />,
      action: () => onSettingsChange({ theme: 'dark' }),
      group: 'Settings',
      keywords: ['appearance', 'night'],
    },
    {
      id: 'theme-system',
      label: 'Theme: System',
      icon: <Monitor className="h-4 w-4" />,
      action: () => onSettingsChange({ theme: 'system' }),
      group: 'Settings',
      keywords: ['appearance', 'auto'],
    },
    {
      id: 'toggle-counter',
      label: settings.showCounter ? 'Hide Word Count' : 'Show Word Count',
      icon: settings.showCounter ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />,
      action: () => onSettingsChange({ showCounter: !settings.showCounter }),
      group: 'Settings',
      keywords: ['counter', 'words', 'characters', 'stats'],
    },
    {
      id: 'toggle-toc',
      label: settings.showTableOfContents ? 'Hide Table of Contents' : 'Show Table of Contents',
      icon: <ListTree className="h-4 w-4" />,
      action: () => onSettingsChange({ showTableOfContents: !settings.showTableOfContents }),
      group: 'Settings',
      keywords: ['toc', 'outline', 'navigation', 'sidebar', 'headings'],
    },
    {
      id: 'font',
      label: 'Font',
      icon: <Type className="h-4 w-4" />,
      action: () => {
        setPage('font')
        setSearch('')
      },
      group: 'Settings',
      keywords: ['typeface', 'typography'],
      hasSubmenu: true,
    },
    // Help
    {
      id: 'shortcuts',
      label: 'Keyboard Shortcuts',
      icon: <Keyboard className="h-4 w-4" />,
      action: () => onShowShortcuts(),
      group: 'Help',
      keywords: ['hotkeys', 'keys', 'help'],
    },
  ]

  // Group commands
  const groups = ['Formatting', 'Headings', 'Blocks', 'Insert', 'Actions', 'Settings', 'Help']

  // Font page content
  if (page === 'font') {
    return (
      <CommandDialog open={open} onOpenChange={onOpenChange}>
        <CommandInput
          placeholder="Select a font..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandGroup>
            <CommandItem
              value="back"
              onSelect={() => {
                setPage(null)
                setSearch('')
              }}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-2">Back</span>
            </CommandItem>
          </CommandGroup>
          <CommandEmpty>No fonts found.</CommandEmpty>
          <CommandGroup heading="Fonts">
            {fonts.map((font) => (
              <CommandItem
                key={font.id}
                value={`${font.label} ${font.description}`}
                onSelect={() => selectFont(font.fontFamily)}
              >
                <Type className="h-4 w-4" />
                <span className="ml-2 flex-1">{font.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    )
  }

  // Variables page content
  if (page === 'variables') {
    return (
      <CommandDialog open={open} onOpenChange={onOpenChange}>
        <CommandInput
          placeholder="Select a variable to insert..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandGroup>
            <CommandItem
              value="back"
              onSelect={() => {
                setPage(null)
                setSearch('')
              }}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-2">Back</span>
            </CommandItem>
          </CommandGroup>
          <CommandEmpty>No variables found.</CommandEmpty>
          <CommandGroup heading="Variables">
            {variables.map((variable) => (
              <CommandItem
                key={variable.id}
                value={`${variable.name} ${variable.value}`}
                onSelect={() => {
                  editor?.chain().focus().insertVariable(variable.id).run()
                  onOpenChange(false)
                }}
              >
                <Variable className="h-4 w-4" />
                <span className="ml-2 flex-1">{variable.name}</span>
                <span className="text-muted-foreground text-sm">{variable.value}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    )
  }

  // Main page content
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map((group) => {
          const groupCommands = commands.filter((cmd) => cmd.group === group)
          if (groupCommands.length === 0) return null
          return (
            <CommandGroup key={group} heading={group}>
              {groupCommands.map((command) => (
                <CommandItem
                  key={command.id}
                  value={`${command.label} ${command.keywords?.join(' ') || ''}`}
                  onSelect={() => runCommand(command.action, command.hasSubmenu)}
                >
                  {command.icon}
                  <span className="ml-2 flex-1">{command.label}</span>
                  {command.hasSubmenu && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )
        })}
      </CommandList>
    </CommandDialog>
  )
}
