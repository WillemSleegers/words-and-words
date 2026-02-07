'use client'

import { useEffect } from 'react'
import type { Editor } from '@tiptap/react'
import type { Settings as SettingsType } from '@/lib/settings'
import type { Comment, FontFamily, Variable as VariableType } from '@/lib/documents/types'
import { SidebarCommandList } from './sidebar/SidebarCommandList'
import { SidebarFindReplace } from './sidebar/SidebarFindReplace'
import { SidebarFontPicker } from './sidebar/SidebarFontPicker'
import { SidebarVariableInsert } from './sidebar/SidebarVariableInsert'
import { SidebarCommentsList } from './sidebar/SidebarCommentsList'

export type SidebarMode = 'commands' | 'find' | 'find-replace' | 'font' | 'variables' | 'comments'

interface CommandSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: SidebarMode
  onModeChange: (mode: SidebarMode) => void
  editor: Editor | null
  settings: SettingsType
  onSettingsChange: (updates: Partial<SettingsType>) => void
  onShowShortcuts: () => void
  onShowVariables: () => void
  documentTitle: string
  documentFont: FontFamily
  variables: VariableType[]
  comments: Comment[]
  onCommentsChange: (comments: Comment[]) => void
  addCommentMode: boolean
  onAddCommentModeChange: (addMode: boolean) => void
  initialExpandedCommentId?: string | null
}

export function CommandSidebar({
  open,
  onOpenChange,
  mode,
  onModeChange,
  editor,
  settings,
  onSettingsChange,
  onShowShortcuts,
  onShowVariables,
  documentTitle,
  documentFont,
  variables,
  comments,
  onCommentsChange,
  addCommentMode,
  onAddCommentModeChange,
  initialExpandedCommentId,
}: CommandSidebarProps) {
  // Handle escape key to close sidebar
  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onOpenChange(false)
        editor?.commands.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange, editor])

  if (!open) return null

  const close = () => onOpenChange(false)

  if (mode === 'find' || mode === 'find-replace') {
    return (
      <SidebarFindReplace
        mode={mode}
        onModeChange={onModeChange}
        onClose={close}
        editor={editor}
      />
    )
  }

  if (mode === 'font') {
    return (
      <SidebarFontPicker
        onModeChange={onModeChange}
        onClose={close}
        editor={editor}
      />
    )
  }

  if (mode === 'variables') {
    return (
      <SidebarVariableInsert
        onModeChange={onModeChange}
        onClose={close}
        editor={editor}
        variables={variables}
      />
    )
  }

  if (mode === 'comments') {
    return (
      <SidebarCommentsList
        editor={editor}
        comments={comments}
        onCommentsChange={onCommentsChange}
        onBack={() => onModeChange('commands')}
        onClose={close}
        addMode={addCommentMode}
        onAddModeChange={onAddCommentModeChange}
        initialExpandedId={initialExpandedCommentId}
      />
    )
  }

  return (
    <SidebarCommandList
      onModeChange={onModeChange}
      onClose={close}
      editor={editor}
      settings={settings}
      onSettingsChange={onSettingsChange}
      onShowShortcuts={onShowShortcuts}
      onShowVariables={onShowVariables}
      documentTitle={documentTitle}
      documentFont={documentFont}
      variables={variables}
      onAddComment={() => { onAddCommentModeChange(true); onModeChange('comments') }}
      onShowComments={() => { onAddCommentModeChange(false); onModeChange('comments') }}
    />
  )
}
