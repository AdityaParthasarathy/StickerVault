import { app } from 'electron'
import { join } from 'path'
import { mkdirSync } from 'fs'

// Everything StickerVault stores lives under Electron's standard per-user
// app data folder - on Windows that's
// C:\Users\<you>\AppData\Roaming\StickerVault\ - so we never have to guess
// where it's safe to write files.
const root = app.getPath('userData')

export const paths = {
  root,
  originalsDir: join(root, 'stickers', 'originals'),
  thumbnailsDir: join(root, 'stickers', 'thumbnails'),
  libraryFile: join(root, 'library.json'),
  packsFile: join(root, 'packs.json'),
  settingsFile: join(root, 'settings.json')
}

export function ensureStorageDirsExist(): void {
  mkdirSync(paths.originalsDir, { recursive: true })
  mkdirSync(paths.thumbnailsDir, { recursive: true })
}
