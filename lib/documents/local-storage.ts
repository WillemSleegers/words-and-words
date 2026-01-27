import type { Document, DocumentMetadata, DocumentStorage } from './types'

const STORAGE_KEY = 'words-and-words-documents'

function generateId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

function getStoredDocuments(): Document[] {
  if (typeof window === 'undefined') return []

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []

  try {
    const docs = JSON.parse(stored) as Document[]
    // Convert date strings back to Date objects and add defaults for existing docs
    return docs.map(doc => ({
      ...doc,
      font: doc.font ?? 'system',
      variables: doc.variables ?? [],
      comments: (doc.comments ?? []).map(c => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      })),
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    }))
  } catch {
    return []
  }
}

function saveDocuments(documents: Document[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(documents))
}

export const localStorageAdapter: DocumentStorage = {
  async list(): Promise<DocumentMetadata[]> {
    const docs = getStoredDocuments()
    return docs
      .map(({ id, title, createdAt, updatedAt }) => ({ id, title, createdAt, updatedAt }))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  },

  async get(id: string): Promise<Document | null> {
    const docs = getStoredDocuments()
    return docs.find(doc => doc.id === id) ?? null
  },

  async create(title: string, content = ''): Promise<Document> {
    const docs = getStoredDocuments()
    const now = new Date()

    const newDoc: Document = {
      id: generateId(),
      title,
      content,
      font: 'system',
      variables: [],
      comments: [],
      createdAt: now,
      updatedAt: now,
    }

    docs.push(newDoc)
    saveDocuments(docs)

    return newDoc
  },

  async update(id: string, data: Partial<Pick<Document, 'title' | 'content' | 'font' | 'variables' | 'comments'>>): Promise<Document> {
    const docs = getStoredDocuments()
    const index = docs.findIndex(doc => doc.id === id)

    if (index === -1) {
      throw new Error(`Document not found: ${id}`)
    }

    const updated: Document = {
      ...docs[index],
      ...data,
      updatedAt: new Date(),
    }

    docs[index] = updated
    saveDocuments(docs)

    return updated
  },

  async delete(id: string): Promise<void> {
    const docs = getStoredDocuments()
    const filtered = docs.filter(doc => doc.id !== id)
    saveDocuments(filtered)
  },
}
