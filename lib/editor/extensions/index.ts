import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import TextAlign from '@tiptap/extension-text-align'
import CharacterCount from '@tiptap/extension-character-count'
import Underline from '@tiptap/extension-underline'
import { TextStyle, FontFamily } from '@tiptap/extension-text-style'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { CollapsibleHeadings } from './collapsible-headings'
import { VariableNode } from './variable-node'
import { Title, Subtitle } from './title-subtitle'
import { SearchHighlight } from './search-highlight'
import { CommentMark } from './comment-mark'

export const extensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3, 4],
    },
    link: false, // Disable to configure separately below
  }),
  Link.configure({
    openOnClick: false,
    enableClickSelection: true, // Click to select link text
    HTMLAttributes: {
      class: 'text-primary underline cursor-pointer',
    },
  }),
  Underline,
  TextStyle,
  FontFamily.configure({
    types: ['textStyle'],
  }),
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
  CollapsibleHeadings,
  VariableNode,
  Title,
  Subtitle,
  SearchHighlight,
  CommentMark,
]
