'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { documentStorage, type Document } from '@/lib/documents'
import { EditorContent } from '@/components/editor/EditorContent'
import { EditorToolbar } from '@/components/editor/EditorToolbar'
import { useDocumentEditor } from '@/hooks/use-document-editor'
import { KeyboardShortcutsDialog } from '@/components/editor/KeyboardShortcutsDialog'
import { SettingsDialog } from '@/components/editor/SettingsDialog'
import { useSettings } from '@/hooks/use-settings'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface EditorPageProps {
  params: Promise<{ id: string }>
}

export default function EditorPage({ params }: EditorPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [document, setDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [content, setContent] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const { settings, updateSettings } = useSettings()

  const editor = useDocumentEditor({
    content,
    onUpdate: handleContentChange,
  })

  useEffect(() => {
    async function loadDocument() {
      const doc = await documentStorage.get(id)
      if (!doc) {
        router.push('/documents')
        return
      }
      setDocument(doc)
      setContent(doc.content)
      setIsLoading(false)
    }
    loadDocument()
  }, [id, router])

  // Update editor content when document loads
  useEffect(() => {
    if (editor && content && !editor.isDestroyed) {
      const currentContent = editor.getHTML()
      if (currentContent !== content && currentContent === '<p></p>') {
        editor.commands.setContent(content)
      }
    }
  }, [editor, content])

  async function saveDocument() {
    if (!document || !hasUnsavedChanges) return

    try {
      await documentStorage.update(document.id, { content })
      setHasUnsavedChanges(false)
    } catch {
      // Silent fail for auto-save
    }
  }

  // Auto-save after 1 second of inactivity
  useEffect(() => {
    if (!hasUnsavedChanges || !document) return

    const timeout = setTimeout(() => {
      saveDocument()
    }, 1000)

    return () => clearTimeout(timeout)
  }, [hasUnsavedChanges, document, saveDocument])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        saveDocument()
      }
      // Show keyboard shortcuts help with ?
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Only trigger if not typing in an input
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          setShowShortcuts(true)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [saveDocument])

  function handleContentChange(newContent: string) {
    setContent(newContent)
    setHasUnsavedChanges(true)
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading document...</div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-background relative">
      {/* Floating back button - top left */}
      <div className="fixed top-4 left-4 z-10">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/documents')}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Back to documents</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Floating toolbar - top right */}
      <div className="fixed top-4 right-4 z-10">
        <EditorToolbar
          editor={editor}
          onShowShortcuts={() => setShowShortcuts(true)}
          onShowSettings={() => setShowSettings(true)}
        />
      </div>

      {/* Main content area - centered */}
      <div className="h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Floating stats - bottom center */}
      {editor && settings.showCounter && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={() => updateSettings({ counter: settings.counter === 'words' ? 'characters' : 'words' })}
            className="text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border hover:bg-muted/50 transition-colors"
          >
            {settings.counter === 'words'
              ? `${editor.storage.characterCount.words()} words`
              : `${editor.storage.characterCount.characters()} characters`}
          </button>
        </div>
      )}

      <KeyboardShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
      />

      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        settings={settings}
        onSettingsChange={updateSettings}
      />
    </div>
  )
}
