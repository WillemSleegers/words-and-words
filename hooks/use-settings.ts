'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { getSettings, saveSettings, type Settings } from '@/lib/settings'

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(() => getSettings())
  const [isLoaded, setIsLoaded] = useState(false)
  const { setTheme } = useTheme()

  // Load settings on mount and sync theme with next-themes
  useEffect(() => {
    const loaded = getSettings()
    setSettingsState(loaded)
    setTheme(loaded.theme)
    setIsLoaded(true)
  }, [setTheme])

  function updateSettings(updates: Partial<Settings>) {
    const newSettings = { ...settings, ...updates }
    setSettingsState(newSettings)
    saveSettings(newSettings)

    if (updates.theme) {
      setTheme(updates.theme)
    }
  }

  return { settings, updateSettings, isLoaded }
}
