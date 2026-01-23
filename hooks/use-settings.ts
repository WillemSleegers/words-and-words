'use client'

import { useState, useEffect } from 'react'
import { getSettings, saveSettings, applyTheme, type Settings } from '@/lib/settings'

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(() => getSettings())
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings on mount
  useEffect(() => {
    const loaded = getSettings()
    setSettingsState(loaded)
    applyTheme(loaded.theme)
    setIsLoaded(true)
  }, [])

  // Listen for system theme changes
  useEffect(() => {
    if (settings.theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    function handleChange() {
      applyTheme('system')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [settings.theme])

  function updateSettings(updates: Partial<Settings>) {
    const newSettings = { ...settings, ...updates }
    setSettingsState(newSettings)
    saveSettings(newSettings)

    if (updates.theme) {
      applyTheme(updates.theme)
    }
  }

  return { settings, updateSettings, isLoaded }
}
