'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { Settings } from '@/lib/settings'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: Settings
  onSettingsChange: (updates: Partial<Settings>) => void
}

export function SettingsDialog({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
}: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Theme */}
          <div className="flex items-center justify-between">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={settings.theme}
              onValueChange={(value: Settings['theme']) =>
                onSettingsChange({ theme: value })
              }
            >
              <SelectTrigger id="theme" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Show counter */}
          <div className="flex items-center justify-between">
            <Label htmlFor="show-counter">Show counter</Label>
            <Switch
              id="show-counter"
              checked={settings.showCounter}
              onCheckedChange={(checked) =>
                onSettingsChange({ showCounter: checked })
              }
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
