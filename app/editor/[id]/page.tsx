"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Command } from "lucide-react"
import { documentStorage, type Document } from "@/lib/documents"
import { EditorContent } from "@/components/editor/EditorContent"
import { useDocumentEditor } from "@/hooks/use-document-editor"
import { useAutoSave } from "@/hooks/use-auto-save"
import { KeyboardShortcutsDialog } from "@/components/editor/KeyboardShortcutsDialog"
import {
  CommandSidebar,
  type SidebarMode,
} from "@/components/editor/CommandSidebar"
import { VariablesDialog } from "@/components/editor/VariablesDialog"
import type { Comment, Variable } from "@/lib/documents/types"
import type { VariableNodeStorage } from "@/lib/editor/extensions/variable-node"
import type { CommentMarkStorage } from "@/lib/editor/extensions/comment-mark"
import { useSettings } from "@/hooks/use-settings"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { TableOfContents } from "@/components/editor/TableOfContents"
import { StatusBar } from "@/components/editor/StatusBar"

interface EditorPageProps {
  params: Promise<{ id: string }>
}

export default function EditorPage({ params }: EditorPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [document, setDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [content, setContent] = useState("")
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showVariables, setShowVariables] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("commands")
  const [addCommentMode, setAddCommentMode] = useState(false)
  const [commentFocusKey, setCommentFocusKey] = useState(0)
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)
  const { settings, updateSettings } = useSettings()

  const handleCommentClick = (commentId: string) => {
    setActiveCommentId(commentId)
    setAddCommentMode(false)
    setSidebarOpen(true)
    setSidebarMode("comments")
  }

  function handleAddComment() {
    if (!editor) return

    // Check if cursor/selection is inside an existing comment
    const { from } = editor.state.selection
    const $from = editor.state.doc.resolve(from)
    let existingCommentId: string | null = null

    for (const node of [$from.nodeAfter, $from.nodeBefore]) {
      if (existingCommentId) break
      if (node?.isText) {
        const mark = node.marks.find(m => m.type.name === 'comment')
        if (mark) existingCommentId = mark.attrs.commentId as string
      }
    }

    if (existingCommentId) {
      setActiveCommentId(existingCommentId)
      setAddCommentMode(false)
    } else {
      setAddCommentMode(true)
      setCommentFocusKey(k => k + 1)
    }
    setSidebarOpen(true)
    setSidebarMode("comments")
  }

  const editor = useDocumentEditor({
    content,
    onUpdate: handleContentChange,
    onCommentClick: settings.showComments ? handleCommentClick : undefined,
  })

  useEffect(() => {
    async function loadDocument() {
      const doc = await documentStorage.get(id)
      if (!doc) {
        router.push("/")
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
      if (currentContent !== content && currentContent === "<p></p>") {
        editor.commands.setContent(content)
      }
    }
  }, [editor, content])

  const { saveStatus, saveDocument } = useAutoSave({
    document,
    content,
    hasUnsavedChanges,
    onSaved: () => setHasUnsavedChanges(false),
  })

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Save
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        saveDocument()
      }
      // Command palette with Cmd+Shift+P
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "p") {
        e.preventDefault()
        setSidebarOpen(true)
        setSidebarMode("commands")
      }
      // Find with Cmd+F
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault()
        setSidebarOpen(true)
        setSidebarMode("find")
      }
      // Add comment with Cmd+Shift+M
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "m" && settings.showComments) {
        e.preventDefault()
        handleAddComment()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [saveDocument])

  function handleContentChange(newContent: string) {
    setContent(newContent)
    setHasUnsavedChanges(true)
  }

  async function handleVariablesChange(newVariables: Variable[]) {
    if (!document) return

    // Update editor storage so NodeViews can access current values
    if (editor && !editor.isDestroyed) {
      const storage = editor.storage as unknown as {
        variable: VariableNodeStorage
      }
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
      const storage = editor.storage as unknown as {
        variable: VariableNodeStorage
      }
      storage.variable.variables = document.variables || []
    }
  }, [editor, document])

  async function handleCommentsChange(newComments: Comment[]) {
    if (!document) return

    // Update editor storage so marks can access comment data
    if (editor && !editor.isDestroyed) {
      const storage = editor.storage as unknown as {
        comment: CommentMarkStorage
      }
      storage.comment.comments = newComments
      // Force re-render to update resolved styling
      editor.view.dispatch(editor.state.tr)
    }

    // Save to document
    try {
      await documentStorage.update(document.id, { comments: newComments })
      setDocument({ ...document, comments: newComments })
    } catch {
      // Silent fail
    }
  }

  // Sync comments to editor storage when document loads
  useEffect(() => {
    if (editor && document && !editor.isDestroyed) {
      const storage = editor.storage as unknown as {
        comment: CommentMarkStorage
      }
      storage.comment.comments = document.comments || []
    }
  }, [editor, document])

  function openSidebar(mode: SidebarMode = "commands") {
    setSidebarOpen(true)
    setSidebarMode(mode)
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
      {/* Floating navigation buttons */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              className="size-8"
              aria-label="Back to documents"
            >
              <ArrowLeft className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Back to documents</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="absolute top-3 right-3 z-10">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openSidebar("commands")}
              className="size-8"
              aria-label="Open command palette"
            >
              <Command className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Commands (⌘⇧P)</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Main content area */}
      <div className="h-full overflow-hidden">
        {/* Scrollable content area */}
        <div
          className={`h-full overflow-y-auto ${settings.editorStyle === "page" ? "bg-canvas" : ""}`}
        >
          <div className="mx-auto px-4 flex justify-center min-h-full">
            {/* Table of Contents - positioned to the left of content */}
            {settings.showTableOfContents && (
              <div className="hidden lg:block w-56 shrink-0 mr-4">
                <TableOfContents
                  editor={editor}
                  className="sticky top-0 max-h-[calc(100vh-3rem)] overflow-y-auto"
                />
              </div>
            )}
            <div
              className={`w-full max-w-3xl p-8 ${settings.editorStyle === "page" ? "bg-background shadow-sm" : ""} ${!settings.showCollapsibleSections ? "collapsible-sections-disabled" : ""} ${!settings.showComments ? "comments-disabled" : ""}`}
            >
              <EditorContent
                editor={editor}
                onAddComment={
                  settings.showComments ? handleAddComment : undefined
                }
                onFindReplace={() => {
                  setSidebarOpen(true)
                  setSidebarMode("find-replace")
                }}
                onInsertVariable={() => setShowVariables(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Command Sidebar - overlays full height on right side */}
      {sidebarOpen && (
        <CommandSidebar
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
          mode={sidebarMode}
          onModeChange={setSidebarMode}
          editor={editor}
          settings={settings}
          onSettingsChange={updateSettings}
          onShowShortcuts={() => setShowShortcuts(true)}
          onShowVariables={() => setShowVariables(true)}
          documentTitle={document?.title || "Untitled"}
          documentFont={document?.font || "system"}
          variables={document?.variables || []}
          comments={document?.comments || []}
          onCommentsChange={handleCommentsChange}
          addCommentMode={addCommentMode}
          onAddCommentModeChange={setAddCommentMode}
          commentFocusKey={commentFocusKey}
          activeCommentId={activeCommentId}
          onActiveCommentIdChange={setActiveCommentId}
        />
      )}

      <StatusBar
        editor={editor}
        settings={settings}
        onSettingsChange={updateSettings}
        saveStatus={saveStatus}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      <KeyboardShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
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
