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
    CommandPalette.tsx          # Command palette (Cmd+Shift+P) with all actions
    EditorBubbleMenu.tsx        # Floating menu on text selection (formatting + links)
    EditorContent.tsx           # Tiptap editor wrapper
    EditorToolbar.tsx           # Floating toolbar (top right, command palette button)
    KeyboardShortcutsDialog.tsx # Keyboard shortcuts help dialog
    VariablesDialog.tsx         # Dialog for managing document variables
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
- **Toolbar**: Fixed top-right (command palette button only)
- **Bubble menu**: Appears on text selection with formatting buttons and link editing
- **Counter**: Fixed bottom-center, click to toggle between words/characters

### Settings

Settings are stored in localStorage and include:

- **Theme**: light, dark, or system
- **Show counter**: toggle visibility of word/character count
- **Counter type**: words or characters (toggled by clicking the counter itself)

### Editor Styling

- Borderless design - the editor appears as "one giant white space"
- Tiptap styles defined in `globals.css` under `.tiptap-editor`
- Supports markdown shortcuts (e.g., `#` for heading, `**text**` for bold)

### Document Variables

Variables allow inserting dynamic placeholders that update throughout the document:

- **Per-document scope**: Each document has its own variables stored in document metadata
- **Variable Node**: Custom Tiptap atom node (`lib/editor/extensions/variable-node.ts`) that stores `variableId` and looks up value at render time
- **NodeView rendering**: Variables display their current value and update automatically when the value changes
- **Deleted handling**: Shows `[Deleted Variable]` in red if a variable is removed but still referenced
- **Word export**: Variables resolve to their values when exporting to Word

### Collapsible Headings

Headings can be collapsed to hide content beneath them:

- **Collapse toggle**: Chevron button appears on hover next to headings
- **Command palette**: "Collapse Section" / "Expand Section" command for current heading
- **Visual state**: Collapsed content uses `display: none` (no animations per CLAUDE.md guidelines)

### React Compiler

We use the React Compiler (`reactCompiler: true` in next.config.ts) instead of manual memoization. No need for `useCallback` or `useMemo` for performance - the compiler handles it.

### Tiptap v3

We use Tiptap v3 which has some differences from v2:

- **BubbleMenu import**: `import { BubbleMenu } from '@tiptap/react/menus'` (not `@tiptap/react`)
- **Reactive state**: Use `useEditorState` hook for reactive `editor.isActive()` checks. Without it, active states don't update in React.
- **StarterKit includes Link**: Must disable with `link: false` in StarterKit config if configuring Link separately
- **Link extension**: `openOnClick: false` + `enableClickSelection: true` for click-to-select behavior

## Notes

- Documents are stored in browser localStorage via `lib/documents.ts`
- Auto-save triggers after 1 second of inactivity
- Cmd/Ctrl+S manually saves
- Cmd/Ctrl+Shift+P opens the command palette
- Will be replaced by database logic at a later time

## Coding Guidelines

- **No delay/timeout hacks**: Don't use `setTimeout`, `delayDuration`, or similar timing-based workarounds to fix UI issues. Find the root cause and fix it properly.
