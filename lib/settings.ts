export type CounterType = 'words' | 'characters'

export interface Settings {
  theme: 'light' | 'dark' | 'system'
  showCounter: boolean
  counter: CounterType
}

const STORAGE_KEY = 'editor-settings'

const defaultSettings: Settings = {
  theme: 'system',
  showCounter: true,
  counter: 'words',
}

export function getSettings(): Settings {
  if (typeof window === 'undefined') return defaultSettings

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return defaultSettings

  try {
    return { ...defaultSettings, ...JSON.parse(stored) }
  } catch {
    return defaultSettings
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function applyTheme(theme: Settings['theme']): void {
  if (typeof window === 'undefined') return

  const root = document.documentElement

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  } else {
    root.classList.toggle('dark', theme === 'dark')
  }
}
