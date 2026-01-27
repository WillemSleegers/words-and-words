"use client"

import { useEffect, useState } from "react"
import { documentStorage, type Document } from "@/lib/documents"

type SaveStatus = "idle" | "saving" | "saved"

interface UseAutoSaveOptions {
  document: Document | null
  content: string
  hasUnsavedChanges: boolean
  onSaved: () => void
}

export function useAutoSave({
  document,
  content,
  hasUnsavedChanges,
  onSaved,
}: UseAutoSaveOptions) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")

  async function saveDocument() {
    if (!document || !hasUnsavedChanges) return

    setSaveStatus("saving")
    try {
      await documentStorage.update(document.id, { content })
      onSaved()
      setSaveStatus("saved")
    } catch {
      setSaveStatus("idle")
    }
  }

  // Reset save status after showing "Saved" briefly
  useEffect(() => {
    if (saveStatus === "saved") {
      const timeout = setTimeout(() => setSaveStatus("idle"), 2000)
      return () => clearTimeout(timeout)
    }
  }, [saveStatus])

  // Auto-save after 1 second of inactivity
  useEffect(() => {
    if (!hasUnsavedChanges || !document) return

    const timeout = setTimeout(() => {
      saveDocument()
    }, 1000)

    return () => clearTimeout(timeout)
  }, [hasUnsavedChanges, document, saveDocument])

  return { saveStatus, saveDocument }
}
