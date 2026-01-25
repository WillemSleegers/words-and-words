import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet, EditorView } from '@tiptap/pm/view'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

export interface SearchMatch {
  from: number
  to: number
}

export interface SearchHighlightStorage {
  searchTerm: string
  matchCase: boolean
  matches: SearchMatch[]
  currentIndex: number
  editorView: EditorView | null
}

const searchHighlightPluginKey = new PluginKey('searchHighlight')

function findMatches(
  doc: ProseMirrorNode,
  searchTerm: string,
  matchCase: boolean
): SearchMatch[] {
  if (!searchTerm) return []

  const matches: SearchMatch[] = []
  const flags = matchCase ? 'g' : 'gi'
  const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(escapedTerm, flags)

  // Walk through all text nodes and find matches
  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      let match
      regex.lastIndex = 0
      while ((match = regex.exec(node.text)) !== null) {
        matches.push({
          from: pos + match.index,
          to: pos + match.index + match[0].length,
        })
      }
    }
  })

  return matches
}

export const SearchHighlight = Extension.create<object, SearchHighlightStorage>({
  name: 'searchHighlight',

  addStorage() {
    return {
      searchTerm: '',
      matchCase: false,
      matches: [],
      currentIndex: 0,
      editorView: null,
    }
  },

  addCommands() {
    return {
      setSearchTerm:
        (term: string, matchCase: boolean = false) =>
        ({ editor }) => {
          const storage = (editor.storage as unknown as { searchHighlight: SearchHighlightStorage }).searchHighlight
          storage.searchTerm = term
          storage.matchCase = matchCase
          storage.matches = findMatches(editor.state.doc, term, matchCase)
          // Start at -1 so first Enter goes to match 0
          storage.currentIndex = -1

          // Trigger re-render
          if (storage.editorView) {
            storage.editorView.dispatch(
              storage.editorView.state.tr.setMeta('searchHighlightUpdate', true)
            )
          }

          return true
        },

      clearSearch:
        () =>
        ({ editor }) => {
          const storage = (editor.storage as unknown as { searchHighlight: SearchHighlightStorage }).searchHighlight
          storage.searchTerm = ''
          storage.matches = []
          storage.currentIndex = -1

          if (storage.editorView) {
            storage.editorView.dispatch(
              storage.editorView.state.tr.setMeta('searchHighlightUpdate', true)
            )
          }

          return true
        },

      goToNextMatch:
        () =>
        ({ editor }) => {
          const storage = (editor.storage as unknown as { searchHighlight: SearchHighlightStorage }).searchHighlight
          if (storage.matches.length === 0) return false

          storage.currentIndex = (storage.currentIndex + 1) % storage.matches.length
          const match = storage.matches[storage.currentIndex]

          // Scroll to match and trigger decoration update (without focusing editor)
          if (storage.editorView) {
            const coords = storage.editorView.coordsAtPos(match.from)
            const editorRect = storage.editorView.dom.getBoundingClientRect()

            // Scroll if match is outside visible area
            if (coords.top < editorRect.top || coords.bottom > editorRect.bottom) {
              storage.editorView.dom.scrollIntoView({ block: 'center' })
              const element = storage.editorView.domAtPos(match.from)
              if (element.node instanceof HTMLElement) {
                element.node.scrollIntoView({ block: 'center', behavior: 'smooth' })
              } else if (element.node.parentElement) {
                element.node.parentElement.scrollIntoView({ block: 'center', behavior: 'smooth' })
              }
            }

            // Trigger decoration re-render
            storage.editorView.dispatch(
              storage.editorView.state.tr.setMeta('searchHighlightUpdate', true)
            )
          }

          return true
        },

      goToPreviousMatch:
        () =>
        ({ editor }) => {
          const storage = (editor.storage as unknown as { searchHighlight: SearchHighlightStorage }).searchHighlight
          if (storage.matches.length === 0) return false

          storage.currentIndex =
            storage.currentIndex <= 0
              ? storage.matches.length - 1
              : storage.currentIndex - 1
          const match = storage.matches[storage.currentIndex]

          // Scroll to match and trigger decoration update (without focusing editor)
          if (storage.editorView) {
            const coords = storage.editorView.coordsAtPos(match.from)
            const editorRect = storage.editorView.dom.getBoundingClientRect()

            // Scroll if match is outside visible area
            if (coords.top < editorRect.top || coords.bottom > editorRect.bottom) {
              const element = storage.editorView.domAtPos(match.from)
              if (element.node instanceof HTMLElement) {
                element.node.scrollIntoView({ block: 'center', behavior: 'smooth' })
              } else if (element.node.parentElement) {
                element.node.parentElement.scrollIntoView({ block: 'center', behavior: 'smooth' })
              }
            }

            // Trigger decoration re-render
            storage.editorView.dispatch(
              storage.editorView.state.tr.setMeta('searchHighlightUpdate', true)
            )
          }

          return true
        },

      replaceCurrentMatch:
        (replacement: string) =>
        ({ editor }) => {
          const storage = (editor.storage as unknown as { searchHighlight: SearchHighlightStorage }).searchHighlight
          if (!storage.editorView) return false

          // Recalculate matches from current doc to ensure positions are accurate
          const currentMatches = findMatches(storage.editorView.state.doc, storage.searchTerm, storage.matchCase)
          if (currentMatches.length === 0 || storage.currentIndex < 0 || storage.currentIndex >= currentMatches.length) {
            return false
          }

          const match = currentMatches[storage.currentIndex]

          // Replace using direct transaction (no focus)
          const tr = storage.editorView.state.tr.replaceWith(
            match.from,
            match.to,
            editor.schema.text(replacement)
          )
          storage.editorView.dispatch(tr)

          // Recalculate matches after replacement
          storage.matches = findMatches(storage.editorView.state.doc, storage.searchTerm, storage.matchCase)

          // Adjust current index - stay at same index to highlight next match
          if (storage.currentIndex >= storage.matches.length) {
            storage.currentIndex = storage.matches.length > 0 ? 0 : -1
          }

          // Trigger decoration update
          storage.editorView.dispatch(
            storage.editorView.state.tr.setMeta('searchHighlightUpdate', true)
          )

          return true
        },

      replaceAllMatches:
        (replacement: string) =>
        ({ editor }) => {
          const storage = (editor.storage as unknown as { searchHighlight: SearchHighlightStorage }).searchHighlight
          if (!storage.editorView) return false

          // Recalculate matches from current doc
          const currentMatches = findMatches(storage.editorView.state.doc, storage.searchTerm, storage.matchCase)
          if (currentMatches.length === 0) return false

          // Replace in reverse order to preserve positions
          const matchesToReplace = [...currentMatches].reverse()

          const tr = storage.editorView.state.tr
          for (const match of matchesToReplace) {
            tr.replaceWith(match.from, match.to, editor.schema.text(replacement))
          }
          storage.editorView.dispatch(tr)

          // Clear matches after replacing all
          storage.matches = []
          storage.currentIndex = -1

          // Trigger decoration update
          storage.editorView.dispatch(
            storage.editorView.state.tr.setMeta('searchHighlightUpdate', true)
          )

          return true
        },

      refreshMatches:
        () =>
        ({ editor }) => {
          const storage = (editor.storage as unknown as { searchHighlight: SearchHighlightStorage }).searchHighlight
          if (!storage.searchTerm) return false

          storage.matches = findMatches(editor.state.doc, storage.searchTerm, storage.matchCase)

          if (storage.currentIndex >= storage.matches.length) {
            storage.currentIndex = storage.matches.length > 0 ? 0 : -1
          }

          if (storage.editorView) {
            storage.editorView.dispatch(
              storage.editorView.state.tr.setMeta('searchHighlightUpdate', true)
            )
          }

          return true
        },
    }
  },

  addProseMirrorPlugins() {
    const storage = this.storage

    return [
      new Plugin({
        key: searchHighlightPluginKey,

        view: (view) => {
          storage.editorView = view
          return {
            destroy: () => {
              storage.editorView = null
            },
          }
        },

        props: {
          decorations: (state) => {
            const { doc } = state
            const decorations: Decoration[] = []

            // Recalculate matches from current doc state
            const matches = findMatches(doc, storage.searchTerm, storage.matchCase)
            storage.matches = matches

            matches.forEach((match, index) => {
              const isCurrentMatch = index === storage.currentIndex
              decorations.push(
                Decoration.inline(match.from, match.to, {
                  class: isCurrentMatch ? 'search-match search-match-current' : 'search-match',
                })
              )
            })

            return DecorationSet.create(doc, decorations)
          },
        },
      }),
    ]
  },
})

// Type augmentation for Tiptap commands
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    searchHighlight: {
      setSearchTerm: (term: string, matchCase?: boolean) => ReturnType
      clearSearch: () => ReturnType
      goToNextMatch: () => ReturnType
      goToPreviousMatch: () => ReturnType
      replaceCurrentMatch: (replacement: string) => ReturnType
      replaceAllMatches: (replacement: string) => ReturnType
      refreshMatches: () => ReturnType
    }
  }
}
