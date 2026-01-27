import { Mark, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { EditorView } from '@tiptap/pm/view'
import type { Comment } from '@/lib/documents/types'

export interface CommentMarkOptions {
  HTMLAttributes: Record<string, unknown>
  onCommentClick?: (commentId: string) => void
}

export interface CommentMarkStorage {
  comments: Comment[]
  activeCommentId: string | null
  editorView: EditorView | null
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    commentMark: {
      setComment: (commentId: string) => ReturnType
      unsetComment: () => ReturnType
      removeComment: (commentId: string) => ReturnType
      setActiveComment: (commentId: string | null) => ReturnType
      setCommentPreview: (from: number, to: number) => ReturnType
      clearCommentPreview: () => ReturnType
    }
  }
}

const commentPluginKey = new PluginKey('commentMark')

export const CommentMark = Mark.create<CommentMarkOptions, CommentMarkStorage>({
  name: 'comment',

  // Allow multiple comment marks on the same text
  inclusive: false,
  excludes: '',

  addOptions() {
    return {
      HTMLAttributes: {},
      onCommentClick: undefined,
    }
  },

  addStorage() {
    return {
      comments: [],
      activeCommentId: null,
      editorView: null,
    }
  },

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-comment-id'),
        renderHTML: (attributes) => {
          if (!attributes.commentId) {
            return {}
          }
          return {
            'data-comment-id': attributes.commentId,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment-id]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const commentId = HTMLAttributes['data-comment-id']
    const storage = this.storage
    const comment = storage.comments.find(c => c.id === commentId && c.parentId === null)
    const isResolved = comment?.resolved ?? false
    const isActive = storage.activeCommentId === commentId

    const classes = ['comment-highlight']
    if (isResolved) classes.push('resolved')
    if (isActive) classes.push('active')

    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: classes.join(' '),
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setComment:
        (commentId: string) =>
        ({ commands }) => {
          return commands.setMark(this.name, { commentId })
        },
      unsetComment:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name)
        },
      removeComment:
        (commentId: string) =>
        ({ tr, dispatch }) => {
          if (!dispatch) return true
          const markType = tr.doc.type.schema.marks.comment
          if (!markType) return false
          // Walk the document and remove all instances of this comment mark
          tr.doc.descendants((node, pos) => {
            if (node.isText) {
              const mark = node.marks.find(
                m => m.type.name === 'comment' && m.attrs.commentId === commentId
              )
              if (mark) {
                tr.removeMark(pos, pos + node.nodeSize, mark)
              }
            }
          })
          dispatch(tr)
          return true
        },
      setCommentPreview:
        (from: number, to: number) =>
        ({ editor }) => {
          const storage = (editor.storage as unknown as { comment: CommentMarkStorage }).comment
          if (storage.editorView) {
            storage.editorView.dispatch(
              storage.editorView.state.tr.setMeta(commentPluginKey, { preview: { from, to } })
            )
          }
          return true
        },
      clearCommentPreview:
        () =>
        ({ editor }) => {
          const storage = (editor.storage as unknown as { comment: CommentMarkStorage }).comment
          if (storage.editorView) {
            storage.editorView.dispatch(
              storage.editorView.state.tr.setMeta(commentPluginKey, { preview: null })
            )
          }
          return true
        },
      setActiveComment:
        (commentId: string | null) =>
        ({ editor }) => {
          const storage = (editor.storage as unknown as { comment: CommentMarkStorage }).comment
          storage.activeCommentId = commentId
          // Trigger re-render for active state styling
          if (storage.editorView) {
            storage.editorView.dispatch(
              storage.editorView.state.tr.setMeta(commentPluginKey, { activeCommentId: commentId })
            )
          }
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    const extension = this

    return [
      new Plugin({
        key: commentPluginKey,
        state: {
          init() {
            return { preview: DecorationSet.empty, active: DecorationSet.empty }
          },
          apply(tr, oldState: { preview: DecorationSet; active: DecorationSet }) {
            let { preview, active } = oldState
            const meta = tr.getMeta(commentPluginKey)
            if (meta && 'preview' in meta) {
              const p = meta.preview as { from: number; to: number } | null
              preview = p
                ? DecorationSet.create(tr.doc, [
                    Decoration.inline(p.from, p.to, { class: 'comment-highlight' }),
                  ])
                : DecorationSet.empty
            } else if (tr.docChanged) {
              preview = preview.map(tr.mapping, tr.doc)
            }
            if (meta && 'activeCommentId' in meta) {
              const activeId = meta.activeCommentId as string | null
              if (!activeId) {
                active = DecorationSet.empty
              } else {
                const decorations: Decoration[] = []
                tr.doc.descendants((node, pos) => {
                  if (node.isText) {
                    const mark = node.marks.find(
                      m => m.type.name === 'comment' && m.attrs.commentId === activeId
                    )
                    if (mark) {
                      decorations.push(
                        Decoration.inline(pos, pos + node.nodeSize, { class: 'comment-active' })
                      )
                    }
                  }
                })
                active = DecorationSet.create(tr.doc, decorations)
              }
            } else if (tr.docChanged) {
              active = active.map(tr.mapping, tr.doc)
            }
            return { preview, active }
          },
        },
        view: (view) => {
          extension.storage.editorView = view
          return {
            destroy: () => {
              extension.storage.editorView = null
            },
          }
        },
        props: {
          decorations(state) {
            const s = commentPluginKey.getState(state) as { preview: DecorationSet; active: DecorationSet } | undefined
            if (!s) return DecorationSet.empty
            // Merge both decoration sets
            return s.preview.add(state.doc, s.active.find())
          },
          handleClick(view, pos) {
            const $pos = view.state.doc.resolve(pos)
            const marks = $pos.marks()
            const commentMark = marks.find(m => m.type.name === 'comment')

            if (commentMark && commentMark.attrs.commentId) {
              const commentId = commentMark.attrs.commentId as string
              if (extension.options.onCommentClick) {
                extension.options.onCommentClick(commentId)
              }
              return true
            }
            return false
          },
        },
      }),
    ]
  },
})

// Helper to get the highlighted text for a comment from the document
export function getCommentHighlightedText(
  editor: { state: { doc: { descendants: (callback: (node: { isText: boolean; text?: string; marks: readonly { type: { name: string }; attrs: { commentId?: string } }[] }, pos: number) => void) => void } } },
  commentId: string
): string {
  let text = ''
  editor.state.doc.descendants((node) => {
    if (node.isText && node.text) {
      const commentMark = node.marks.find(
        m => m.type.name === 'comment' && m.attrs.commentId === commentId
      )
      if (commentMark) {
        text += node.text
      }
    }
  })
  return text
}
