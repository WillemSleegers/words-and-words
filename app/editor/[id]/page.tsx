'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { documentStorage, type Document } from '@/lib/documents'
import { EditorContent } from '@/components/editor/EditorContent'
import { EditorToolbar } from '@/components/editor/EditorToolbar'
import { useDocumentEditor } from '@/hooks/use-document-editor'
import { KeyboardShortcutsDialog } from '@/components/editor/KeyboardShortcutsDialog'
import { CommandPalette } from '@/components/editor/CommandPalette'
import { VariablesDialog } from '@/components/editor/VariablesDialog'
import type { Variable } from '@/lib/documents/types'
import type { VariableNodeStorage } from '@/lib/editor/extensions/variable-node'
import { useSettings } from '@/hooks/use-settings'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TableOfContents } from '@/components/editor/TableOfContents'

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
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showVariables, setShowVariables] = useState(false)
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
      // Command palette with Cmd+Shift+P
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault()
        setShowCommandPalette(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [saveDocument])

  function handleContentChange(newContent: string) {
    setContent(newContent)
    setHasUnsavedChanges(true)
  }

  async function handleVariablesChange(newVariables: Variable[]) {
    if (!document) return

    // Update editor storage so NodeViews can access current values
    if (editor && !editor.isDestroyed) {
      const storage = editor.storage as unknown as { variable: VariableNodeStorage }
      storage.variable.variables = newVariables
      // Force re-render of all variable nodes
      editor.view.dispatch(editor.state.tr)
    }

    // Save to document
    try {
      await documentStorage.update(document.id, { variables: newVariables })
      setDocument({ ...document, variables: newVariables })
    } catch {
      // Silent fail
    }
  }

  // Sync variables to editor storage when document loads
  useEffect(() => {
    if (editor && document && !editor.isDestroyed) {
      const storage = editor.storage as unknown as { variable: VariableNodeStorage }
      storage.variable.variables = document.variables || []
    }
  }, [editor, document])

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading document...</div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Top navigation bar */}
      <header className="shrink-0 h-10 flex items-center justify-between px-4 mt-2">
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

        <EditorToolbar onShowCommandPalette={() => setShowCommandPalette(true)} />
      </header>

      {/* Main content area with TOC */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 flex justify-center">
          {/* Table of Contents - positioned to the left of content */}
          {settings.showTableOfContents && (
            <div className="hidden lg:block w-56 shrink-0 mr-4">
              <TableOfContents
                editor={editor}
                className="sticky top-0 max-h-[calc(100vh-3rem)] overflow-y-auto"
              />
            </div>
          )}
          <div className="w-full max-w-3xl">
            <EditorContent editor={editor} />
          </div>
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

      <CommandPalette
        open={showCommandPalette}
        onOpenChange={setShowCommandPalette}
        editor={editor}
        settings={settings}
        onSettingsChange={updateSettings}
        onShowShortcuts={() => setShowShortcuts(true)}
        onShowVariables={() => setShowVariables(true)}
        variables={document?.variables || []}
        documentTitle={document?.title || 'Untitled'}
        documentFont={document?.font || 'system'}
      />

      <VariablesDialog
        open={showVariables}
        onOpenChange={setShowVariables}
        variables={document?.variables || []}
        onVariablesChange={handleVariablesChange}
        editor={editor}
      />
    </div>
  )
}
