export type CounterType = "words" | "characters"
export type EditorStyle = "seamless" | "page"

export interface Settings {
  theme: "light" | "dark" | "system"
  showCounter: boolean
  counter: CounterType
  showTableOfContents: boolean
  editorStyle: EditorStyle
  showCollapsibleSections: boolean
  showComments: boolean
  showSaveStatus: boolean
}

const STORAGE_KEY = "editor-settings"

const defaultSettings: Settings = {
  theme: "system",
  showCounter: false,
  counter: "words",
  showTableOfContents: false,
  editorStyle: "seamless",
  showCollapsibleSections: false,
  showComments: true,
  showSaveStatus: true,
}

export function getSettings(): Settings {
  if (typeof window === "undefined") return defaultSettings

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return defaultSettings

  try {
    return { ...defaultSettings, ...JSON.parse(stored) }
  } catch {
    return defaultSettings
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
