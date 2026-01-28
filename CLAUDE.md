# Words and Words

A minimal, distraction-free text editor built with Next.js 16, React 19, and Tiptap.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React Compiler
- **Editor**: Tiptap v3
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
    CollapseToggleButton.tsx    # Heading collapse chevron button
    CommandSidebar.tsx           # Sidebar orchestrator (mode switching)
    EditorBubbleMenu.tsx         # Floating menu on text selection
    EditorContent.tsx            # Tiptap editor wrapper
    KeyboardShortcutsDialog.tsx  # Keyboard shortcuts help dialog
    TableOfContents.tsx          # Sidebar heading navigation
    VariablesDialog.tsx          # Document variables dialog
    sidebar/
      SidebarHeader.tsx          # Shared sidebar header with back/close
      SidebarCommandList.tsx     # Command palette with search + keyboard nav
      SidebarCommentsList.tsx    # Comment threads and replies
      SidebarFindReplace.tsx     # Find and replace UI
      SidebarFontPicker.tsx      # Font selection
      SidebarVariableInsert.tsx  # Variable insertion picker
  ui/                            # shadcn/ui components
hooks/
  use-document-editor.ts    # Tiptap editor hook with extensions
  use-settings.ts           # Settings hook
  use-table-of-contents.ts  # Reactive heading extraction for TOC
lib/
  documents.ts              # Document storage (localStorage, will move to DB)
  documents/types.ts        # Document, Comment, Variable interfaces
  documents/local-storage.ts # localStorage implementation
  settings.ts               # Settings storage and theme application
  editor/commands.ts        # Shared command helpers (fonts, section collapse)
  editor/extensions/        # Custom Tiptap extensions
    collapsible-headings.ts # Heading collapse/expand
    comment-mark.ts         # Comment highlight marks
    variable-node.ts        # Dynamic variable placeholders
    search-highlight.ts     # Search & replace decorations
```

## Design Philosophy

**Keyboard-first, command palette-centric.** The command sidebar (Cmd+Shift+P) is the single, consistent place to discover and access every feature. Users should be able to do anything from the command palette — formatting, settings, navigation, export, comments, find/replace. This promotes:

1. **Discoverability**: New users can explore all features in one searchable list
2. **Consistency**: Every feature lives in one predictable location
3. **Keyboard efficiency**: Power users can navigate entirely via keyboard

**Quick access for common actions.** While the command palette is comprehensive, frequently-used actions also have direct shortcuts:

- **Bubble menu**: Formatting on text selection (bold, italic, link, comment)
- **Context menu**: Right-click for common actions in context
- **Keyboard shortcuts**: Cmd+B, Cmd+I, Cmd+F, etc. for muscle memory
- **Table of Contents**: One-click heading navigation

The principle: command palette is always available and complete; shortcuts are accelerators, not replacements.

## Design Decisions

### Layout

- Floating back button (top-left), command button (top-right)
- Optional Table of Contents sidebar left of content (lg+ screens)
- Editor content centered, max-width 3xl
- Bubble menu on text selection (formatting, links, add comment)
- Word/character counter fixed bottom-center

### Settings

Stored in localStorage (`lib/settings.ts`):

- `theme`: light / dark / system
- `showCounter`, `counter`: word/character count toggle
- `showTableOfContents`: TOC sidebar visibility
- `editorStyle`: seamless / page (with background and shadow)
- `showCollapsibleSections`: heading collapse chevrons
- `showComments`: comment highlights and interactions

### Comments

Text-anchored comments with threaded replies, managed via the CommandSidebar:

- **Comment Mark**: Tiptap Mark extension (`comment-mark.ts`) that wraps commented text in `<span data-comment-id="..." class="comment-highlight">`
- **Data model**: Flat `Comment[]` on Document with `parentId` for threading (null = root, string = reply)
- **Sidebar modes**: `'comments'` (list all threads) and `'comment-thread'` (single thread detail with replies)
- **Creation**: Select text → bubble menu comment button or "Add Comment" command → sidebar opens with input
- **Navigation**: Click highlighted text → sidebar opens to thread; click thread in sidebar → scrolls to text
- **Toggle**: `showComments` setting hides highlights via `.comments-disabled` CSS class

### Document Variables

Per-document dynamic placeholders stored in document metadata. Custom atom node (`variable-node.ts`) stores `variableId` and resolves value at render time. Shows `[Deleted Variable]` if referenced variable is removed.

### Title and Subtitle Nodes

Dedicated nodes (not headings) for document title/subtitle. Uses `div[data-type="title|subtitle"]` to avoid heading conflicts. Not collapsible.

### Collapsible Headings

Chevron toggle on hover next to headings. Collapsed content hidden with `display: none`. Can be toggled globally via `showCollapsibleSections` setting.

### Tiptap v3

- `BubbleMenu` import from `@tiptap/react/menus` (not `@tiptap/react`)
- Use `useEditorState` for reactive `editor.isActive()` checks
- Disable `link: false` in StarterKit when configuring Link separately

### React Compiler

Uses React Compiler (`reactCompiler: true` in next.config.ts) instead of manual `useCallback`/`useMemo`.

## Notes

- Documents stored in browser localStorage, will move to database later
- Auto-save after 1s inactivity; Cmd+S manual save
- Cmd+Shift+P opens command sidebar; Cmd+F opens find

## Coding Guidelines

- **No delay/timeout hacks**: Don't use `setTimeout` or timing workarounds. Fix the root cause.
- **OKLCH colors**: Use direct `oklch()` values, not relative `oklch(from var(...))` syntax (limited browser support).
