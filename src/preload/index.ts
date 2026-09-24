import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { AppSettings, CopyResult, ImportResult, Pack, Sticker, ThemePreference } from '../shared/types'

// This file is the ONLY bridge between the React UI and the Electron main
// process. The renderer can never import Node/Electron modules directly —
// instead, we explicitly list the functions it's allowed to call here, and
// `contextBridge` exposes them on `window.api` in a safe, read-only way.
const api = {
  getLibrary: (): Promise<Sticker[]> => ipcRenderer.invoke('library:get'),

  importStickers: (filePaths: string[]): Promise<ImportResult> =>
    ipcRenderer.invoke('stickers:import', filePaths),

  importGeneratedSticker: (pngBytes: Uint8Array, displayName: string): Promise<Sticker> =>
    ipcRenderer.invoke('stickers:import-generated', pngBytes, displayName),

  selectStickerFiles: (): Promise<string[]> =>
    ipcRenderer.invoke('dialog:select-sticker-files'),

  selectStickerFolders: (): Promise<string[]> =>
    ipcRenderer.invoke('dialog:select-sticker-folders'),

  // Drag-and-dropped `File` objects don't carry a filesystem path by
  // default for security reasons — this is the sanctioned way to recover
  // it, and it only works inside a real drop event, not on any File.
  getPathForFile: (file: File): string => webUtils.getPathForFile(file),

  copySticker: (id: string): Promise<CopyResult> => ipcRenderer.invoke('stickers:copy', id),

  openSticker: (id: string): Promise<void> => ipcRenderer.invoke('stickers:open', id),

  toggleFavorite: (id: string): Promise<Sticker | undefined> =>
    ipcRenderer.invoke('stickers:toggle-favorite', id),

  renameSticker: (id: string, displayName: string): Promise<Sticker | undefined> =>
    ipcRenderer.invoke('stickers:rename', id, displayName),

  setStickerPack: (id: string, packId: string | null): Promise<Sticker | undefined> =>
    ipcRenderer.invoke('stickers:set-pack', id, packId),

  // Resolves true only if the user confirmed the native "are you sure?"
  // dialog and the sticker was actually removed.
  deleteSticker: (id: string): Promise<boolean> => ipcRenderer.invoke('stickers:delete', id),

  getPacks: (): Promise<Pack[]> => ipcRenderer.invoke('packs:get'),

  createPack: (name: string): Promise<Pack | undefined> =>
    ipcRenderer.invoke('packs:create', name),

  renamePack: (id: string, name: string): Promise<Pack | undefined> =>
    ipcRenderer.invoke('packs:rename', id, name),

  deletePack: (id: string): Promise<boolean> => ipcRenderer.invoke('packs:delete', id),

  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),

  setTheme: (theme: ThemePreference): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:set-theme', theme)
}

export type StickerVaultApi = typeof api

contextBridge.exposeInMainWorld('api', api)
