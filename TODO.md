# To Think About

- [ ] Link click behavior is awkward
  - Current: `openOnClick: false` + `enableClickSelection: true`
  - Single click on link selects it (inconsistent with regular text which needs double-click)
  - To follow a link: click → click link icon → click Open button (3 steps)
  - Options considered:
    1. `openOnClick: true` - but then double-click to select doesn't work (first click navigates away)
    2. Show "Open" button directly in bubble menu when on a link (2 steps: double-click → click Open)
    3. Cmd/Ctrl+click to follow - but Tiptap doesn't have built-in support for this
  - Might need a custom click handler or accept the trade-off
- [ ] Can we wrap content of a header in a div element or something equivalent so we can handle collapsing content better (ie animate it better)?
- [x] Move the collapse chevron to collapse sections to the left of the header instead of the right.

## Code Improvements

### High Priority

- [ ] Fix auto-save `useEffect` circular dependency
  - `saveDocument` is in the dependency array but captures `document` and `content`
  - Creates circular dependency flow that could cause issues
  - Location: `app/editor/[id]/page.tsx:80`

### Medium Priority

- [ ] Add error boundaries around key components
  - Wrap CommandPalette, EditorContent with React error boundaries
  - Gracefully handle runtime errors instead of crashing the whole app

- [ ] Optimize event listeners in KeyboardShortcutsDialog
  - `handleKeyDown` and `handleKeyUp` are recreated each render
  - Causes listener re-registration on every render while dialog is open
  - Location: `components/editor/KeyboardShortcutsDialog.tsx:215-223`

### Low Priority

- [ ] Animate collapsible headings
  - Currently instant (display: none)
  - Would need to wrap collapsed content in a single container for unified animation
  - ProseMirror decorations apply to individual nodes, making "slide up" effect complex

- [ ] Add loading skeletons
  - Replace "Loading document..." text with skeleton screens for better UX

- [ ] Add JSDoc comments to custom hooks
  - Document `useDocumentEditor` and `useSettings` for better IDE support
  - Location: `hooks/use-document-editor.ts`, `hooks/use-settings.ts`

## Completed

- [x] Add a button to the top right that launches the command palette.
- [x] Create a toolbar with all the typical text editor options. Make it a dialog window that shows in the center of the screen. This could be used to select options on a phone.
  - Created FormattingToolbar but removed it - couldn't get active state indicators working properly
  - All formatting options are available via the command palette instead
- [x] Remove the insert table and insert image options from the top right. It should be included in the toolbar mentioned in the previous todo item and via the command palette, so we don't need it anymore as separate buttons.
- [x] You can't tell whether the text is currently set to, for example, bold. Can we think of something to address this?
  - Implemented bubble menu with `useEditorState` hook for reactive active states
  - Shows formatting buttons with active state indicators when text is selected
- [x] Do we still need the settings dialog?
  - Removed - all settings (theme, counter visibility) are available via command palette
- [x] Are there any other online text editors that use a command palette?
  - Notion, Linear, Obsidian, Typora
