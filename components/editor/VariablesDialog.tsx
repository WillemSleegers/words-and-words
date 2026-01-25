'use client'

import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Variable } from 'lucide-react'
import type { Variable as VariableType } from '@/lib/documents/types'

interface VariablesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  variables: VariableType[]
  onVariablesChange: (variables: VariableType[]) => void
  editor: Editor | null
}

function generateVariableId(): string {
  return `var_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export function VariablesDialog({
  open,
  onOpenChange,
  variables,
  onVariablesChange,
  editor,
}: VariablesDialogProps) {
  const [newName, setNewName] = useState('')
  const [newValue, setNewValue] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editValue, setEditValue] = useState('')

  function handleAddVariable() {
    if (!newName.trim()) return

    const newVariable: VariableType = {
      id: generateVariableId(),
      name: newName.trim(),
      value: newValue,
    }

    onVariablesChange([...variables, newVariable])
    setNewName('')
    setNewValue('')
  }

  function handleDeleteVariable(id: string) {
    onVariablesChange(variables.filter((v) => v.id !== id))
  }

  function handleStartEdit(variable: VariableType) {
    setEditingId(variable.id)
    setEditName(variable.name)
    setEditValue(variable.value)
  }

  function handleSaveEdit() {
    if (!editingId || !editName.trim()) return

    onVariablesChange(
      variables.map((v) =>
        v.id === editingId ? { ...v, name: editName.trim(), value: editValue } : v
      )
    )
    setEditingId(null)
    setEditName('')
    setEditValue('')
  }

  function handleCancelEdit() {
    setEditingId(null)
    setEditName('')
    setEditValue('')
  }

  function handleInsertVariable(variableId: string) {
    if (!editor) return
    editor.chain().focus().insertVariable(variableId).run()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Variable className="h-5 w-5" />
            Document Variables
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new variable form */}
          <div className="flex gap-2">
            <Input
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddVariable()
                }
              }}
            />
            <Input
              placeholder="Value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddVariable()
                }
              }}
            />
            <Button
              size="icon"
              onClick={handleAddVariable}
              disabled={!newName.trim()}
              aria-label="Add variable"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Variables list */}
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {variables.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No variables defined. Add one above.
              </p>
            ) : (
              variables.map((variable) => (
                <div
                  key={variable.id}
                  className="flex items-center gap-2 p-2 rounded-md border bg-muted/30"
                >
                  {editingId === variable.id ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 h-8"
                        autoFocus
                      />
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 h-8"
                      />
                      <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <button
                        className="flex-1 text-left hover:bg-muted/50 rounded p-1 transition-colors"
                        onClick={() => handleInsertVariable(variable.id)}
                        title="Click to insert"
                      >
                        <span className="font-medium text-sm">{variable.name}</span>
                        <span className="text-muted-foreground text-sm ml-2">
                          = {variable.value || '(empty)'}
                        </span>
                      </button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleStartEdit(variable)}
                      >
                        <span className="sr-only">Edit</span>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteVariable(variable.id)}
                        aria-label={`Delete ${variable.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  )
}
