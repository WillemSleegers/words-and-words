import { Node, mergeAttributes } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    title: {
      setTitle: () => ReturnType
      toggleTitle: () => ReturnType
    }
    subtitle: {
      setSubtitle: () => ReturnType
      toggleSubtitle: () => ReturnType
    }
  }
}

export const Title = Node.create({
  name: 'title',

  group: 'block',

  content: 'inline*',

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="title"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'title',
        class: 'document-title',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setTitle:
        () =>
        ({ commands }) => {
          return commands.setNode(this.name)
        },
      toggleTitle:
        () =>
        ({ commands, state }) => {
          const { selection } = state
          const node = state.doc.nodeAt(selection.from)
          const parent = selection.$from.parent

          if (parent.type.name === this.name) {
            return commands.setNode('paragraph')
          }
          return commands.setNode(this.name)
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Alt-0': () => this.editor.commands.toggleTitle(),
    }
  },
})

export const Subtitle = Node.create({
  name: 'subtitle',

  group: 'block',

  content: 'inline*',

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="subtitle"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'subtitle',
        class: 'document-subtitle',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setSubtitle:
        () =>
        ({ commands }) => {
          return commands.setNode(this.name)
        },
      toggleSubtitle:
        () =>
        ({ commands, state }) => {
          const { selection } = state
          const parent = selection.$from.parent

          if (parent.type.name === this.name) {
            return commands.setNode('paragraph')
          }
          return commands.setNode(this.name)
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Alt-9': () => this.editor.commands.toggleSubtitle(),
    }
  },
})
