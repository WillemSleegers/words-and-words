import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  ExternalHyperlink,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ImageRun,
} from 'docx'
import { saveAs } from 'file-saver'
import type { Editor } from '@tiptap/react'
import type { FontFamily, Variable } from './documents/types'

// Map editor fonts to Word-compatible fonts
function getWordFont(font: FontFamily): string {
  const fontMap: Record<FontFamily, string> = {
    system: 'Aptos',
    inter: 'Aptos',
    serif: 'Georgia',
    georgia: 'Georgia',
    merriweather: 'Georgia',
    mono: 'Consolas',
  }
  return fontMap[font] || 'Aptos'
}

interface TextStyle {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strike?: boolean
  code?: boolean
}

type DocxChild = Paragraph | Table

function parseInlineContent(
  node: ChildNode,
  style: TextStyle = {},
  variables: Variable[] = []
): (TextRun | ExternalHyperlink)[] {
  const runs: (TextRun | ExternalHyperlink)[] = []

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || ''
    if (text) {
      runs.push(
        new TextRun({
          text,
          bold: style.bold,
          italics: style.italic,
          underline: style.underline ? {} : undefined,
          strike: style.strike,
          font: style.code ? 'Courier New' : undefined,
        })
      )
    }
    return runs
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return runs
  }

  const el = node as HTMLElement
  const tag = el.tagName.toLowerCase()

  // Handle variable nodes
  if (tag === 'span' && el.hasAttribute('data-variable-id')) {
    const variableId = el.getAttribute('data-variable-id')
    const variable = variables.find((v) => v.id === variableId)
    const text = variable?.value || '[Deleted Variable]'
    runs.push(
      new TextRun({
        text,
        bold: style.bold,
        italics: style.italic,
        underline: style.underline ? {} : undefined,
        strike: style.strike,
      })
    )
    return runs
  }

  // Create new style based on current element
  const newStyle: TextStyle = { ...style }
  if (tag === 'strong' || tag === 'b') newStyle.bold = true
  if (tag === 'em' || tag === 'i') newStyle.italic = true
  if (tag === 'u') newStyle.underline = true
  if (tag === 's' || tag === 'del' || tag === 'strike') newStyle.strike = true
  if (tag === 'code') newStyle.code = true

  // Handle links
  if (tag === 'a') {
    const href = el.getAttribute('href') || ''
    const linkText = el.textContent || href
    runs.push(
      new ExternalHyperlink({
        children: [
          new TextRun({
            text: linkText,
            style: 'Hyperlink',
            bold: newStyle.bold,
            italics: newStyle.italic,
          }),
        ],
        link: href,
      })
    )
    return runs
  }

  // Handle line breaks
  if (tag === 'br') {
    runs.push(new TextRun({ break: 1 }))
    return runs
  }

  // Recursively process children
  for (const child of Array.from(el.childNodes)) {
    runs.push(...parseInlineContent(child, newStyle, variables))
  }

  return runs
}

function getAlignment(el: HTMLElement): (typeof AlignmentType)[keyof typeof AlignmentType] | undefined {
  const style = el.getAttribute('style') || ''
  if (style.includes('text-align: center')) return AlignmentType.CENTER
  if (style.includes('text-align: right')) return AlignmentType.RIGHT
  if (style.includes('text-align: justify')) return AlignmentType.JUSTIFIED
  return undefined
}

function parseBlockElement(el: HTMLElement, variables: Variable[] = []): DocxChild[] {
  const results: DocxChild[] = []
  const tag = el.tagName.toLowerCase()
  const alignment = getAlignment(el)

  // Headings
  if (tag.match(/^h[1-6]$/)) {
    const level = parseInt(tag[1]) as 1 | 2 | 3 | 4 | 5 | 6
    const headingLevels: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
      1: HeadingLevel.HEADING_1,
      2: HeadingLevel.HEADING_2,
      3: HeadingLevel.HEADING_3,
      4: HeadingLevel.HEADING_4,
      5: HeadingLevel.HEADING_5,
      6: HeadingLevel.HEADING_6,
    }
    const children = parseInlineContent(el, {}, variables)
    results.push(
      new Paragraph({
        children,
        heading: headingLevels[level],
        alignment,
      })
    )
    return results
  }

  // Paragraphs
  if (tag === 'p') {
    const children = parseInlineContent(el, {}, variables)
    results.push(
      new Paragraph({
        children,
        alignment,
      })
    )
    return results
  }

  // Blockquotes
  if (tag === 'blockquote') {
    for (const child of Array.from(el.children)) {
      const childResults = parseBlockElement(child as HTMLElement, variables)
      for (const result of childResults) {
        if (result instanceof Paragraph) {
          results.push(
            new Paragraph({
              children: [
                new TextRun({ text: '' }), // Reset any previous formatting
                ...parseInlineContent(child as HTMLElement, {}, variables),
              ],
              indent: { left: 720 }, // 0.5 inch indent
              alignment,
            })
          )
        } else {
          results.push(result)
        }
      }
    }
    if (results.length === 0) {
      // Direct text in blockquote
      results.push(
        new Paragraph({
          children: parseInlineContent(el, {}, variables),
          indent: { left: 720 },
          alignment,
        })
      )
    }
    return results
  }

  // Lists
  if (tag === 'ul' || tag === 'ol') {
    const isOrdered = tag === 'ol'
    let index = 1
    for (const li of Array.from(el.querySelectorAll(':scope > li'))) {
      const bullet = isOrdered ? `${index}. ` : '• '
      const children = parseInlineContent(li, {}, variables)
      results.push(
        new Paragraph({
          children: [new TextRun({ text: bullet }), ...children],
          indent: { left: 720 },
        })
      )
      index++
    }
    return results
  }

  // Code blocks
  if (tag === 'pre') {
    const codeEl = el.querySelector('code')
    const text = codeEl?.textContent || el.textContent || ''
    const lines = text.split('\n')
    for (const line of lines) {
      results.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              font: 'Courier New',
            }),
          ],
        })
      )
    }
    return results
  }

  // Tables
  if (tag === 'table') {
    const rows: TableRow[] = []
    const tableRows = el.querySelectorAll('tr')
    for (const tr of Array.from(tableRows)) {
      const cells: TableCell[] = []
      const tableCells = tr.querySelectorAll('td, th')
      for (const td of Array.from(tableCells)) {
        cells.push(
          new TableCell({
            children: [
              new Paragraph({
                children: parseInlineContent(td, {}, variables),
              }),
            ],
          })
        )
      }
      if (cells.length > 0) {
        rows.push(new TableRow({ children: cells }))
      }
    }
    if (rows.length > 0) {
      results.push(
        new Table({
          rows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      )
    }
    return results
  }

  // Images - convert to placeholder text (images require base64 which is complex)
  if (tag === 'img') {
    const alt = el.getAttribute('alt') || 'Image'
    const src = el.getAttribute('src') || ''
    results.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `[${alt}]`,
            italics: true,
          }),
        ],
      })
    )
    return results
  }

  // Divs and other containers - process children
  if (tag === 'div' || tag === 'section' || tag === 'article') {
    for (const child of Array.from(el.children)) {
      results.push(...parseBlockElement(child as HTMLElement, variables))
    }
    return results
  }

  // Fallback: treat as paragraph
  const children = parseInlineContent(el, {}, variables)
  if (children.length > 0) {
    results.push(
      new Paragraph({
        children,
        alignment,
      })
    )
  }

  return results
}

function htmlToDocxElements(html: string, variables: Variable[] = []): DocxChild[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const elements: DocxChild[] = []

  for (const child of Array.from(doc.body.children)) {
    elements.push(...parseBlockElement(child as HTMLElement, variables))
  }

  // Ensure there's at least one paragraph
  if (elements.length === 0) {
    elements.push(new Paragraph({ children: [] }))
  }

  return elements
}

export async function exportToWord(
  editor: Editor,
  title: string,
  font: FontFamily = 'system',
  variables: Variable[] = []
): Promise<void> {
  const html = editor.getHTML()
  const docxElements = htmlToDocxElements(html, variables)
  const wordFont = getWordFont(font)

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: wordFont,
            size: 24, // 12pt body text
          },
          paragraph: {
            spacing: {
              after: 120, // 6pt after paragraphs
              line: 276, // 1.15 line spacing
            },
          },
        },
        heading1: {
          run: {
            font: wordFont,
            size: 54, // 27pt
            bold: true,
          },
          paragraph: {
            spacing: { before: 240, after: 120 },
          },
        },
        heading2: {
          run: {
            font: wordFont,
            size: 44, // 22pt
            bold: true,
          },
          paragraph: {
            spacing: { before: 200, after: 80 },
          },
        },
        heading3: {
          run: {
            font: wordFont,
            size: 36, // 18pt
            bold: true,
          },
          paragraph: {
            spacing: { before: 160, after: 80 },
          },
        },
        heading4: {
          run: {
            font: wordFont,
            size: 30, // 15pt
            bold: true,
          },
          paragraph: {
            spacing: { before: 120, after: 60 },
          },
        },
      },
    },
    sections: [
      {
        children: docxElements,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const filename = `${title.replace(/[^a-zA-Z0-9\s-]/g, '').trim() || 'document'}.docx`
  saveAs(blob, filename)
}
