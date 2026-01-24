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
