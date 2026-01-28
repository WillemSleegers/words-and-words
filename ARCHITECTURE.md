# Words and Words — Architecture Overview

A minimal, distraction-free text editor built with Next.js 16, React 19, and Tiptap v3.

## Design Philosophy

### Keyboard-First, Command Palette-Centric

The command sidebar (Cmd+Shift+P) is the heart of the interface. Every feature in the app is accessible from this single, searchable list — formatting, headings, settings, theme switching, find/replace, comments, variables, export. This design choice serves three goals:

1. **Discoverability** — New users can open the command palette and browse everything the app can do. No hunting through menus or memorizing where features live.

2. **Consistency** — There's always one predictable answer to "where is X?" Open the command palette and search for it.

3. **Keyboard efficiency** — Power users can navigate the entire app without touching the mouse. Arrow keys, Enter, Escape, and a search query get you anywhere.

### Quick Access as Accelerators

While the command palette is comprehensive, common actions have faster paths:

| Access Method          | Purpose                 | Examples                                |
| ---------------------- | ----------------------- | --------------------------------------- |
| **Bubble menu**        | Formatting on selection | Bold, italic, link, add comment         |
| **Context menu**       | Right-click actions     | Insert image, table, heading conversion |
| **Keyboard shortcuts** | Muscle memory           | Cmd+B, Cmd+F, Cmd+S                     |
| **Table of Contents**  | Document navigation     | Click heading to jump                   |

The principle: the command palette is always the fallback — complete and consistent. Shortcuts are accelerators for frequent actions, not replacements for the palette.

### Minimal Chrome

The editor maximizes writing space. UI elements are:

- **Floating** (back button, command button, word count) rather than fixed toolbars
- **On-demand** (bubble menu appears on selection, sidebar opens when invoked)
- **Dismissable** (Escape closes everything, returning focus to writing)

## Tech Stack

| Layer         | Technology                                                       |
| ------------- | ---------------------------------------------------------------- |
| Framework     | Next.js 16 (App Router), React 19 with React Compiler            |
| Editor        | Tiptap v3 (ProseMirror-based)                                    |
| Styling       | Tailwind CSS 4 with OKLCH color system                           |
| UI Components | shadcn/ui (Radix primitives)                                     |
| Icons         | Lucide React                                                     |
| Export        | `docx` library for Word document generation                      |
| Storage       | localStorage (adapter pattern, designed for future DB migration) |

## Project Structure

```
app/
  layout.tsx                    # Root layout (fonts, global CSS)
  page.tsx                      # Redirect → /documents
  documents/page.tsx            # Document list with create/delete
  editor/page.tsx               # Redirect → /documents
  editor/[id]/page.tsx          # Main editor page (341 lines)

components/
  editor/
    CommandSidebar.tsx           # Sidebar orchestrator — switches between modes
    EditorBubbleMenu.tsx         # Floating toolbar on text selection
    EditorContent.tsx            # Tiptap editor wrapper + context menu
    EditorContextMenu.tsx        # Right-click context menu
    CollapseToggleButton.tsx     # Heading collapse/expand chevron
    FindReplaceBar.tsx           # Floating find/replace bar
    KeyboardShortcutsDialog.tsx  # Keyboard shortcuts reference dialog
    TableOfContents.tsx          # Heading navigation sidebar
    VariablesDialog.tsx          # Variable management dialog
    sidebar/
      SidebarHeader.tsx          # Shared header with back/close buttons
      SidebarCommandList.tsx     # Command palette with search + keyboard nav
      SidebarCommentsList.tsx    # Comment thread list and management
      SidebarCommentThread.tsx   # Single comment thread detail view
      SidebarFindReplace.tsx     # Find and replace panel
      SidebarFontPicker.tsx      # Font selection panel
      SidebarVariableInsert.tsx  # Variable insertion picker
  ui/                            # shadcn/ui components (button, input, dialog, etc.)

hooks/
  use-document-editor.ts         # Tiptap editor initialization with extensions
  use-auto-save.ts               # Debounced auto-save with status tracking
  use-settings.ts                # Settings persistence and theme management
  use-table-of-contents.ts       # Reactive heading extraction for TOC

lib/
  documents/
    types.ts                     # Document, Comment, Variable interfaces
    local-storage.ts             # localStorage storage implementation
    index.ts                     # Re-exports, documentStorage singleton
  editor/
    commands.ts                  # Shared helpers: fonts array, section collapse
    extensions/
      index.ts                  # Extension configuration array
      collapsible-headings.ts   # Heading collapse/expand via decorations
      comment-mark.ts           # Text-anchored comment marks + decorations
      variable-node.ts          # Dynamic variable placeholder nodes
      search-highlight.ts       # Find/replace with match decorations
      title-subtitle.ts         # Document title/subtitle nodes
  settings.ts                   # Settings storage and theme application
  export-to-word.ts             # HTML → Word document conversion
  utils.ts                      # cn() className utility
```

## Architecture

### Data Flow

```
localStorage ← documentStorage adapter → EditorPage (state owner)
                                              │
                    ┌───────────────┬──────────┼──────────┬─────────────┐
                    │               │          │          │             │
              EditorContent   CommandSidebar  TOC   VariablesDialog  Counter
                    │               │
              Tiptap Editor    SidebarCommandList
              (extensions)     SidebarFindReplace
                               SidebarFontPicker
                               SidebarVariableInsert
                               SidebarCommentsList
```

**State ownership**: `EditorPage` is the single source of truth for document content, comments, variables, and settings. It passes data and callbacks down to child components.

**Editor state**: Tiptap manages its own document model (ProseMirror). Document-level data like comments and variables are synced to Tiptap's `editor.storage` so extensions can access them during rendering.

**Persistence**: `useAutoSave` debounces content changes (1s), writing to localStorage via the `documentStorage` adapter. Settings use a separate localStorage key.

### Editor Extensions

The editor uses six custom Tiptap extensions:

| Extension             | Type                    | Purpose                                                                                                        |
| --------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| `CollapsibleHeadings` | Extension (decorations) | Adds collapse/expand chevrons to headings; hides content between collapsed heading and next same-level heading |
| `CommentMark`         | Mark + decorations      | Wraps commented text in spans with comment IDs; handles resolved/active/preview styling                        |
| `VariableNode`        | Node (inline, atom)     | Renders dynamic variable placeholders that resolve values at render time                                       |
| `SearchHighlight`     | Extension (decorations) | Find/replace with regex matching, match navigation, and visual highlighting                                    |
| `Title`               | Node (block)            | Document-level title, distinct from h1 headings                                                                |
| `Subtitle`            | Node (block)            | Document-level subtitle                                                                                        |

### Sidebar Architecture

The `CommandSidebar` component is a mode-based orchestrator. The `SidebarMode` type determines which panel renders:

| Mode           | Component               | Trigger                                    |
| -------------- | ----------------------- | ------------------------------------------ |
| `commands`     | `SidebarCommandList`    | Cmd+Shift+P or command button              |
| `find`         | `SidebarFindReplace`    | Cmd+F                                      |
| `find-replace` | `SidebarFindReplace`    | From find mode                             |
| `font`         | `SidebarFontPicker`     | From commands                              |
| `variables`    | `SidebarVariableInsert` | From commands                              |
| `comments`     | `SidebarCommentsList`   | From commands or clicking highlighted text |

### Comment System

Comments use a mark-based anchoring approach:

1. **Text anchoring**: `CommentMark` wraps selected text in a `<span>` with a `data-comment-id` attribute
2. **Data model**: Flat `Comment[]` array on the document with `parentId` for threading (`null` = root comment, `string` = reply)
3. **Sidebar**: `SidebarCommentsList` shows all root comments grouped by resolved/unresolved; expanding a thread shows replies and a reply input
4. **Navigation**: Clicking a comment highlight opens its thread in the sidebar; clicking "Go to text" in the sidebar scrolls to the highlighted text

### Document Storage Adapter

```typescript
interface DocumentStorage {
  list(): Promise<DocumentMetadata[]>
  get(id: string): Promise<Document | null>
  create(title: string, content?: string): Promise<Document>
  update(id: string, data: Partial<Document>): Promise<void>
  delete(id: string): Promise<void>
}
```

Currently implemented with localStorage (`local-storage.ts`). The adapter pattern means switching to a database requires only implementing this interface — no changes to components or hooks.

### Settings

Settings are stored in localStorage and managed by `useSettings`:

| Setting                   | Values                | Default  |
| ------------------------- | --------------------- | -------- |
| `theme`                   | light / dark / system | system   |
| `showCounter`             | boolean               | true     |
| `counter`                 | words / characters    | words    |
| `showTableOfContents`     | boolean               | false    |
| `editorStyle`             | seamless / page       | seamless |
| `showCollapsibleSections` | boolean               | true     |
| `showComments`            | boolean               | true     |

### Keyboard Shortcuts

| Shortcut    | Action                    |
| ----------- | ------------------------- |
| Cmd+S       | Save document             |
| Cmd+Shift+P | Open command sidebar      |
| Cmd+F       | Open find                 |
| Cmd+B/I/U   | Bold / Italic / Underline |
| Cmd+Shift+X | Strikethrough             |
| Cmd+E       | Inline code               |
| Cmd+Alt+1-4 | Heading levels            |
| Cmd+Alt+0   | Toggle title              |
| Cmd+Alt+9   | Toggle subtitle           |
| Escape      | Close sidebar / deselect  |

## Coding Conventions

- **React Compiler** is enabled — no manual `useCallback`/`useMemo` needed
- **OKLCH colors**: Use direct `oklch()` values, not `oklch(from ...)` (limited browser support)
- **No timing hacks**: Don't use `setTimeout` workarounds; fix root causes
- **Tiptap v3**: `BubbleMenu` imports from `@tiptap/react/menus`; use `useEditorState` for reactive checks
- **Imports**: Absolute paths via `@/` alias (maps to project root)
