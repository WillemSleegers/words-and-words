'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Shortcut {
  keys: string[]
  description: string
  markdown?: string
}

interface ShortcutGroup {
  title: string
  shortcuts: Shortcut[]
}

// Base shortcuts using generic "Mod" for the platform modifier
const baseShortcutGroups: ShortcutGroup[] = [
  {
    title: 'Quick Actions',
    shortcuts: [
      { keys: ['Mod', 'Shift', 'P'], description: 'Command palette' },
      { keys: ['Mod', 'S'], description: 'Save document' },
      { keys: ['Mod', 'F'], description: 'Find' },
    ],
  },
  {
    title: 'Text Formatting',
    shortcuts: [
      { keys: ['Mod', 'B'], description: 'Bold', markdown: '**text**' },
      { keys: ['Mod', 'I'], description: 'Italic', markdown: '*text*' },
      { keys: ['Mod', 'U'], description: 'Underline' },
      { keys: ['Mod', 'Shift', 'S'], description: 'Strikethrough', markdown: '~~text~~' },
      { keys: ['Mod', '`'], description: 'Inline code', markdown: '`code`' },
      { keys: ['Mod', 'Shift', 'L'], description: 'Align left' },
      { keys: ['Mod', 'Shift', 'E'], description: 'Align center' },
      { keys: ['Mod', 'Shift', 'R'], description: 'Align right' },
      { keys: ['Mod', 'Shift', 'J'], description: 'Justify' },
    ],
  },
  {
    title: 'Headings',
    shortcuts: [
      { keys: ['Mod', 'Alt', '1'], description: 'Heading 1', markdown: '# ' },
      { keys: ['Mod', 'Alt', '2'], description: 'Heading 2', markdown: '## ' },
      { keys: ['Mod', 'Alt', '3'], description: 'Heading 3', markdown: '### ' },
      { keys: ['Mod', 'Alt', '4'], description: 'Heading 4', markdown: '#### ' },
    ],
  },
  {
    title: 'Lists & Blocks',
    shortcuts: [
      { keys: ['Mod', 'Shift', '8'], description: 'Bullet list', markdown: '- ' },
      { keys: ['Mod', 'Shift', '9'], description: 'Numbered list', markdown: '1. ' },
      { keys: ['Mod', 'Shift', 'B'], description: 'Blockquote', markdown: '> ' },
      { keys: ['Mod', 'Alt', 'C'], description: 'Code block', markdown: '```' },
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      { keys: ['Mod', 'Z'], description: 'Undo' },
      { keys: ['Mod', 'Shift', 'Z'], description: 'Redo' },
      { keys: ['Mod', 'K'], description: 'Insert link' },
      { keys: ['Mod', 'A'], description: 'Select all' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['Mod', 'Home'], description: 'Go to start' },
      { keys: ['Mod', 'End'], description: 'Go to end' },
    ],
  },
]

// Detect if running on Mac
function isMac(): boolean {
  if (typeof navigator === 'undefined') return false
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0
}

// Replace 'Mod' with platform-specific key and 'Alt' with 'Option' on Mac
function getPlatformKey(key: string, mac: boolean): string {
  if (key === 'Mod') return mac ? '⌘' : 'Ctrl'
  if (key === 'Alt') return mac ? '⌥' : 'Alt'
  if (key === 'Shift') return mac ? '⇧' : 'Shift'
  if (key === 'Ctrl') return mac ? '⌃' : 'Ctrl'
  return key
}

// Transform shortcuts for the current platform
function getShortcutGroups(mac: boolean): ShortcutGroup[] {
  return baseShortcutGroups.map(group => ({
    ...group,
    shortcuts: group.shortcuts.map(shortcut => ({
      ...shortcut,
      keys: shortcut.keys.map(key => getPlatformKey(key, mac)),
    })),
  }))
}

// Normalize key names for comparison - returns display key for current platform
function normalizeKey(key: string, mac: boolean): string {
  const keyMap: Record<string, string> = {
    'Control': mac ? '⌃' : 'CTRL',
    'Meta': mac ? '⌘' : 'CTRL',
    'Alt': mac ? '⌥' : 'ALT',
    'Shift': mac ? '⇧' : 'SHIFT',
  }
  return keyMap[key] || key.toUpperCase()
}

function Kbd({ children, highlighted }: { children: string; highlighted?: boolean }) {
  return (
    <kbd
      className={`px-1.5 py-0.5 text-xs font-mono rounded border transition-colors duration-150 min-w-6 text-center ${
        highlighted
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-muted border-border'
      }`}
    >
      {children}
    </kbd>
  )
}

function ShortcutRow({ shortcut, pressedKeys }: { shortcut: Shortcut; pressedKeys: Set<string> }) {
  // Check if this shortcut matches the currently pressed keys
  // Mac symbols don't need uppercasing, regular keys do
  const isHighlighted = shortcut.keys.length > 0 &&
    shortcut.keys.every(key => {
      const normalizedKey = ['⌘', '⌥', '⇧', '⌃'].includes(key) ? key : key.toUpperCase()
      return pressedKeys.has(normalizedKey)
    }) &&
    pressedKeys.size === shortcut.keys.length

  return (
    <div
      className={`flex items-center justify-between gap-2 py-1.5 px-2 rounded transition-colors duration-150 ${
        isHighlighted ? 'bg-primary/10' : ''
      }`}
    >
      <span className="text-sm shrink-0">{shortcut.description}</span>
      <div className="flex items-center gap-1 shrink-0">
        {shortcut.markdown && (
          <span className="text-xs text-muted-foreground font-mono mr-1 hidden sm:inline">
            {shortcut.markdown}
          </span>
        )}
        {shortcut.keys.map((key, i) => (
          <span key={i} className="flex items-center">
            {i > 0 && <span className="text-muted-foreground text-xs mx-0.5">+</span>}
            <Kbd highlighted={isHighlighted}>{key}</Kbd>
          </span>
        ))}
      </div>
    </div>
  )
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set())
  const [mac, setMac] = useState(false)

  // Detect platform on mount
  useEffect(() => {
    setMac(isMac())
  }, [])

  const shortcutGroups = useMemo(() => getShortcutGroups(mac), [mac])

  function handleKeyDown(e: KeyboardEvent) {
    // Don't track if dialog is closed
    if (!open) return

    // Prevent default to stop browser shortcuts from firing
    e.preventDefault()

    // Build the set of currently pressed modifier keys + the main key
    const keys = new Set<string>()
    if (e.ctrlKey || e.metaKey) keys.add(mac ? '⌘' : 'CTRL')
    if (e.altKey) keys.add(mac ? '⌥' : 'ALT')
    if (e.shiftKey) keys.add(mac ? '⇧' : 'SHIFT')

    // Add the actual key if it's not a modifier itself
    const normalizedKey = normalizeKey(e.key, mac)
    const modifiers = mac
      ? ['⌘', '⌥', '⇧', '⌃']
      : ['CTRL', 'ALT', 'SHIFT', 'META', 'CONTROL']
    if (!modifiers.includes(normalizedKey)) {
      keys.add(normalizedKey)
    }

    setPressedKeys(keys)
  }

  function handleKeyUp() {
    // Clear all keys on any key release for cleaner UX
    setPressedKeys(new Set())
  }

  // Clear pressed keys when dialog closes
  useEffect(() => {
    if (!open) {
      setPressedKeys(new Set())
    }
  }, [open])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Press any shortcut to highlight it
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-4">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h3 className="font-medium text-sm text-muted-foreground mb-2">
                {group.title}
              </h3>
              <div className="space-y-0.5">
                {group.shortcuts.map((shortcut, i) => (
                  <ShortcutRow
                    key={i}
                    shortcut={shortcut}
                    pressedKeys={pressedKeys}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Tip: Many formatting options also work with Markdown syntax. Just type the markdown and it will be converted automatically.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
