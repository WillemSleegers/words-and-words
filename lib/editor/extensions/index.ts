import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import TextAlign from '@tiptap/extension-text-align'
import CharacterCount from '@tiptap/extension-character-count'
import Underline from '@tiptap/extension-underline'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'

export const extensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3, 4],
    },
  }),
  Underline,
  Image.configure({
    inline: false,
    allowBase64: true,
  }),
  Placeholder.configure({
    placeholder: 'Start writing...',
  }),
  Typography,
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  CharacterCount,
  Table.configure({
    resizable: true,
  }),
  TableRow,
  TableHeader,
  TableCell,
]
