"use client"

import { useEffect, useRef, useState } from "react"
import { documentStorage, type Document } from "@/lib/documents"

const AUTO_SAVE_DELAY_MS = 1000
const SAVED_INDICATOR_MS = 2000

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

  // Use refs to avoid stale closures in the debounced save
  const documentRef = useRef(document)
  const contentRef = useRef(content)
  const onSavedRef = useRef(onSaved)
  documentRef.current = document
  contentRef.current = content
  onSavedRef.current = onSaved

  async function saveDocument() {
    const doc = documentRef.current
    if (!doc) return

    setSaveStatus("saving")
    try {
      await documentStorage.update(doc.id, { content: contentRef.current })
      onSavedRef.current()
      setSaveStatus("saved")
    } catch {
      setSaveStatus("idle")
    }
  }

  // Reset save status after showing "Saved" briefly
  useEffect(() => {
    if (saveStatus === "saved") {
      const timeout = setTimeout(() => setSaveStatus("idle"), SAVED_INDICATOR_MS)
      return () => clearTimeout(timeout)
    }
  }, [saveStatus])

  // Auto-save after inactivity
  useEffect(() => {
    if (!hasUnsavedChanges || !document) return

    const timeout = setTimeout(() => {
      saveDocument()
    }, AUTO_SAVE_DELAY_MS)

    return () => clearTimeout(timeout)
  }, [hasUnsavedChanges, content, document, saveDocument])

  return { saveStatus, saveDocument }
}
