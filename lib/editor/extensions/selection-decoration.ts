import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

const selectionDecorationKey = new PluginKey('selectionDecoration')

/**
 * Shows the text selection via decorations when the editor loses focus.
 * This keeps the selection visible even when focus moves to a context menu
 * or sidebar.
 */
export const SelectionDecoration = Extension.create({
  name: 'selectionDecoration',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: selectionDecorationKey,

        state: {
          init: () => true, // focused by default
          apply: (tr, prev) => {
            const meta = tr.getMeta(selectionDecorationKey)
            if (meta !== undefined) return meta as boolean
            return prev
          },
        },

        props: {
          decorations(state) {
            const focused = selectionDecorationKey.getState(state) as boolean
            if (focused) return DecorationSet.empty

            const { from, to } = state.selection
            if (from === to) return DecorationSet.empty

            return DecorationSet.create(state.doc, [
              Decoration.inline(from, to, {
                style: 'background-color: Highlight; color: HighlightText;',
              }),
            ])
          },
        },

        view(editorView) {
          const handleFocus = () => {
            editorView.dispatch(
              editorView.state.tr.setMeta(selectionDecorationKey, true)
            )
          }
          const handleBlur = () => {
            editorView.dispatch(
              editorView.state.tr.setMeta(selectionDecorationKey, false)
            )
          }

          editorView.dom.addEventListener('focus', handleFocus)
          editorView.dom.addEventListener('blur', handleBlur)

          return {
            destroy() {
              editorView.dom.removeEventListener('focus', handleFocus)
              editorView.dom.removeEventListener('blur', handleBlur)
            },
          }
        },
      }),
    ]
  },
})
