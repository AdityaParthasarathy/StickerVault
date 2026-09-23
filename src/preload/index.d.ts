import type { CopyResult, ImportResult, Pack, Sticker } from '../shared/types'

export interface StickerVaultApi {
  getLibrary: () => Promise<Sticker[]>
  importStickers: (filePaths: string[]) => Promise<ImportResult>
  selectStickerFiles: () => Promise<string[]>
  getPathForFile: (file: File) => string
  copySticker: (id: string) => Promise<CopyResult>
  openSticker: (id: string) => Promise<void>
  toggleFavorite: (id: string) => Promise<Sticker | undefined>
  renameSticker: (id: string, displayName: string) => Promise<Sticker | undefined>
  setStickerPack: (id: string, packId: string | null) => Promise<Sticker | undefined>
  deleteSticker: (id: string) => Promise<boolean>
  getPacks: () => Promise<Pack[]>
  createPack: (name: string) => Promise<Pack | undefined>
  renamePack: (id: string, name: string) => Promise<Pack | undefined>
  deletePack: (id: string) => Promise<boolean>
}

declare global {
  interface Window {
    api: StickerVaultApi
  }
}
