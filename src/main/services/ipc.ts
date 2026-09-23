import { ipcMain, dialog, shell, clipboard, nativeImage, BrowserWindow } from 'electron'
import type { CopyResult, ThemePreference } from '../../shared/types'
import {
  getLibrary,
  importStickerFiles,
  getStickerById,
  getOriginalFilePath,
  setStickerFavorite,
  renameSticker,
  markStickerUsed,
  setStickerPack,
  clearPackFromStickers,
  deleteSticker
} from './stickerLibrary'
import { getPacks, createPack, renamePack, deletePack } from './packLibrary'
import { getSettings, setTheme } from './settingsStore'

const STICKER_FILE_FILTERS = [
  { name: 'Stickers', extensions: ['png', 'webp', 'jpg', 'jpeg', 'gif'] }
]

// dialog.showMessageBox requires a real BrowserWindow argument to attach
// to, or none at all — it doesn't accept `undefined`, so this picks the
// right overload based on whether we found one.
async function confirmDestructiveAction(
  event: Electron.IpcMainInvokeEvent,
  options: Electron.MessageBoxOptions
): Promise<boolean> {
  const window = BrowserWindow.fromWebContents(event.sender)
  const { response } = window
    ? await dialog.showMessageBox(window, options)
    : await dialog.showMessageBox(options)
  return response === 1
}

// Each handle() call answers one message the preload bridge can send from
// the renderer. Keeping them in one place makes it easy to see the app's
// entire "renderer-to-system" surface at a glance.
export function registerIpcHandlers(): void {
  ipcMain.handle('library:get', () => {
    return getLibrary()
  })

  ipcMain.handle('stickers:import', (_event, filePaths: string[]) => {
    return importStickerFiles(filePaths)
  })

  ipcMain.handle('dialog:select-sticker-files', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    const options: Electron.OpenDialogOptions = {
      title: 'Import stickers',
      properties: ['openFile', 'multiSelections'],
      filters: STICKER_FILE_FILTERS
    }
    const result = window
      ? await dialog.showOpenDialog(window, options)
      : await dialog.showOpenDialog(options)
    if (result.canceled) return []
    return result.filePaths
  })

  ipcMain.handle('stickers:copy', (_event, id: string): CopyResult => {
    const sticker = getStickerById(id)
    if (!sticker) return { ok: false, reason: 'Sticker no longer exists' }

    const image = nativeImage.createFromPath(getOriginalFilePath(sticker))
    if (image.isEmpty()) {
      return { ok: false, reason: 'This image could not be copied' }
    }

    clipboard.writeImage(image)
    const updated = markStickerUsed(id)
    return { ok: true, sticker: updated ?? sticker }
  })

  ipcMain.handle('stickers:open', (_event, id: string) => {
    const sticker = getStickerById(id)
    if (!sticker) return
    shell.openPath(getOriginalFilePath(sticker))
  })

  ipcMain.handle('stickers:toggle-favorite', (_event, id: string) => {
    const sticker = getStickerById(id)
    if (!sticker) return undefined
    return setStickerFavorite(id, !sticker.isFavorite)
  })

  ipcMain.handle('stickers:rename', (_event, id: string, displayName: string) => {
    return renameSticker(id, displayName)
  })

  ipcMain.handle('stickers:set-pack', (_event, id: string, packId: string | null) => {
    return setStickerPack(id, packId)
  })

  ipcMain.handle('stickers:delete', async (event, id: string): Promise<boolean> => {
    const sticker = getStickerById(id)
    if (!sticker) return false

    const confirmed = await confirmDestructiveAction(event, {
      type: 'warning',
      buttons: ['Cancel', 'Delete'],
      defaultId: 0,
      cancelId: 0,
      title: 'Delete sticker',
      message: `Delete "${sticker.displayName}"?`,
      detail: 'This removes it from StickerVault and deletes the stored file. This cannot be undone.'
    })
    if (!confirmed) return false
    return deleteSticker(id)
  })

  ipcMain.handle('packs:get', () => {
    return getPacks()
  })

  ipcMain.handle('packs:create', (_event, name: string) => {
    return createPack(name)
  })

  ipcMain.handle('packs:rename', (_event, id: string, name: string) => {
    return renamePack(id, name)
  })

  ipcMain.handle('packs:delete', async (event, id: string): Promise<boolean> => {
    const packs = getPacks()
    const pack = packs.find((p) => p.id === id)
    if (!pack) return false

    const confirmed = await confirmDestructiveAction(event, {
      type: 'warning',
      buttons: ['Cancel', 'Delete'],
      defaultId: 0,
      cancelId: 0,
      title: 'Delete pack',
      message: `Delete the "${pack.name}" pack?`,
      detail: 'Stickers inside it are not deleted — they just move back to All Stickers.'
    })
    if (!confirmed) return false

    const deleted = deletePack(id)
    if (deleted) clearPackFromStickers(id)
    return deleted
  })

  ipcMain.handle('settings:get', () => {
    return getSettings()
  })

  ipcMain.handle('settings:set-theme', (_event, theme: ThemePreference) => {
    return setTheme(theme)
  })
}
