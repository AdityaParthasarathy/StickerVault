// Shared between the main process and the renderer, so both sides agree on
// exactly what a "sticker" looks like.
export interface Sticker {
  id: string
  filename: string
  originalName: string
  displayName: string
  mimeType: string
  fileSize: number
  width: number
  height: number
  isFavorite: boolean
  createdAt: number
  lastUsedAt: number | null
  packId: string | null
  /** SHA-256 of the original file's bytes, used only to detect re-importing
   *  the exact same file twice. Not shown anywhere in the UI. */
  contentHash: string
}

export interface ImportSkip {
  fileName: string
  reason: string
}

export interface ImportResult {
  imported: Sticker[]
  skipped: ImportSkip[]
}

export type CopyResult = { ok: true; sticker: Sticker } | { ok: false; reason: string }

export interface Pack {
  id: string
  name: string
  createdAt: number
}

export type ThemePreference = 'light' | 'dark' | 'system'

export interface AppSettings {
  theme: ThemePreference
}
