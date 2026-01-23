'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FileText, Trash2 } from 'lucide-react'
import { documentStorage, type DocumentMetadata } from '@/lib/documents'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export default function DocumentsPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<DocumentMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newDocTitle, setNewDocTitle] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    loadDocuments()
  }, [])

  async function loadDocuments() {
    setIsLoading(true)
    const docs = await documentStorage.list()
    setDocuments(docs)
    setIsLoading(false)
  }

  async function createDocument() {
    if (!newDocTitle.trim()) return

    const doc = await documentStorage.create(newDocTitle.trim())
    setNewDocTitle('')
    setIsDialogOpen(false)
    router.push(`/editor/${doc.id}`)
  }

  async function deleteDocument(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    await documentStorage.delete(id)
    await loadDocuments()
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Documents</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Document</DialogTitle>
              <DialogDescription>
                Enter a title for your new document.
              </DialogDescription>
            </DialogHeader>
            <Input
              placeholder="Document title"
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createDocument()}
              autoFocus
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createDocument} disabled={!newDocTitle.trim()}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading documents...</div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-medium mb-2">No documents yet</h2>
          <p className="text-muted-foreground mb-4">
            Create your first document to get started.
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Document
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="cursor-pointer hover:border-primary/50 transition-colors group"
              onClick={() => router.push(`/editor/${doc.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate">{doc.title}</CardTitle>
                    <CardDescription>
                      Updated {formatDate(doc.updatedAt)}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity -mt-1 -mr-2"
                    onClick={(e) => deleteDocument(doc.id, e)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
