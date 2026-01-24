import { Node, mergeAttributes } from '@tiptap/core'
import { NodeViewRenderer } from '@tiptap/react'
import type { Variable } from '@/lib/documents/types'

export interface VariableNodeOptions {
  HTMLAttributes: Record<string, unknown>
}

export interface VariableNodeStorage {
  variables: Variable[]
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    variableNode: {
      insertVariable: (variableId: string) => ReturnType
    }
  }
}

export const VariableNode = Node.create<VariableNodeOptions, VariableNodeStorage>({
  name: 'variable',

  group: 'inline',

  inline: true,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addStorage() {
    return {
      variables: [],
    }
  },

  addAttributes() {
    return {
      variableId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-variable-id'),
        renderHTML: (attributes) => {
          if (!attributes.variableId) {
            return {}
          }
          return {
            'data-variable-id': attributes.variableId,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-variable-id]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'variable-node',
      }),
    ]
  },

  addNodeView() {
    const storage = this.storage

    const nodeViewRenderer: NodeViewRenderer = ({ node }) => {
      const dom = document.createElement('span')
      dom.className = 'variable-node'
      dom.setAttribute('data-variable-id', node.attrs.variableId || '')
      dom.contentEditable = 'false'

      const updateContent = () => {
        const variableId = node.attrs.variableId
        const variable = storage.variables.find((v) => v.id === variableId)

        if (variable) {
          dom.textContent = variable.value
          dom.classList.remove('variable-deleted')
          dom.title = variable.name
        } else {
          dom.textContent = '[Deleted Variable]'
          dom.classList.add('variable-deleted')
          dom.title = 'This variable has been deleted'
        }
      }

      updateContent()

      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type.name !== 'variable') {
            return false
          }
          updateContent()
          return true
        },
      }
    }

    return nodeViewRenderer
  },

  addCommands() {
    return {
      insertVariable:
        (variableId: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { variableId },
          })
        },
    }
  },
})
