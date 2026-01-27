export type FontFamily = 'system' | 'serif' | 'mono' | 'inter' | 'georgia' | 'merriweather'

export interface Variable {
  id: string
  name: string
  value: string
}

export interface Comment {
  id: string
  text: string
  createdAt: Date
  updatedAt: Date
  resolved: boolean
  parentId: string | null  // null = root comment, string = reply to another comment
}

export interface Document {
  id: string
  title: string
  content: string
  font: FontFamily
  variables: Variable[]
  comments: Comment[]
  createdAt: Date
  updatedAt: Date
}

export interface DocumentMetadata {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
}

export interface DocumentStorage {
  list(): Promise<DocumentMetadata[]>
  get(id: string): Promise<Document | null>
  create(title: string, content?: string): Promise<Document>
  update(id: string, data: Partial<Pick<Document, 'title' | 'content' | 'font' | 'variables' | 'comments'>>): Promise<Document>
  delete(id: string): Promise<void>
}
