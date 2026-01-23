# Words and Words

A minimal, distraction-free text editor built with Next.js 16, React 19, and Tiptap.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React Compiler
- **React**: 19
- **Editor**: Tiptap (rich text editor)
- **Styling**: Tailwind CSS 4 with OKLCH color system
- **Components**: shadcn/ui

## Project Structure

```
app/
  editor/[id]/page.tsx    # Main editor page
  documents/              # Document list page
  globals.css             # Global styles including Tiptap editor styles
components/
  editor/
    EditorContent.tsx           # Tiptap editor wrapper
    EditorToolbar.tsx           # Floating toolbar (top right)
    KeyboardShortcutsDialog.tsx # Keyboard shortcuts help dialog
    SettingsDialog.tsx          # Settings dialog (theme, counter visibility)
  ui/                           # shadcn/ui components
hooks/
  use-document-editor.ts  # Tiptap editor hook with extensions
  use-settings.ts         # Settings hook (theme, counter preferences)
lib/
  documents.ts            # Document storage utilities
  settings.ts             # Settings storage and theme application
  editor/extensions/      # Tiptap extensions configuration
```

## Design Decisions

### Floating UI Elements

The editor uses a minimal floating UI approach:

- **Back button**: Fixed top-left
- **Toolbar**: Fixed top-right (insert image, insert table, keyboard shortcuts, settings)
- **Counter**: Fixed bottom-center, click to toggle between words/characters

All UI fades into the background - the focus is on the content.

### Settings

Settings are stored in localStorage and include:

- **Theme**: light, dark, or system
- **Show counter**: toggle visibility of word/character count
- **Counter type**: words or characters (toggled by clicking the counter itself)

### Editor Styling

- Borderless design - the editor appears as "one giant white space"
- Tiptap styles defined in `globals.css` under `.tiptap-editor`
- Supports markdown shortcuts (e.g., `#` for heading, `**text**` for bold)

### React Compiler

We use the React Compiler (`reactCompiler: true` in next.config.ts) instead of manual memoization. No need for `useCallback` or `useMemo` for performance - the compiler handles it.

## Notes

- Documents are stored in browser localStorage via `lib/documents.ts`
- Auto-save triggers after 1 second of inactivity
- Cmd/Ctrl+S manually saves
- Press `?` to open keyboard shortcuts dialog
- Will be replaced by database logic at a later time
