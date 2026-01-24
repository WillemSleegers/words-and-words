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
} from 'lucide-react'
import type { Settings as SettingsType } from '@/lib/settings'

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
}

type Page = null | 'font'

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
      id: 'h1',
      label: 'Heading 1',
      icon: <Heading1 className="h-4 w-4" />,
      action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
      group: 'Headings',
      keywords: ['title', 'h1'],
    },
    {
      id: 'h2',
      label: 'Heading 2',
      icon: <Heading2 className="h-4 w-4" />,
      action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
      group: 'Headings',
      keywords: ['subtitle', 'h2'],
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
    // Actions
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
