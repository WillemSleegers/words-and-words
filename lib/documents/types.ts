export type FontFamily = 'system' | 'serif' | 'mono' | 'inter' | 'georgia' | 'merriweather'

export interface Document {
  id: string
  title: string
  content: string
  font: FontFamily
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
  update(id: string, data: Partial<Pick<Document, 'title' | 'content' | 'font'>>): Promise<Document>
  delete(id: string): Promise<void>
}
