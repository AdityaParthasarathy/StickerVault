import { nativeImage } from 'electron'
import { randomUUID, createHash } from 'crypto'
import { existsSync, readFileSync, writeFileSync, statSync, copyFileSync, unlinkSync } from 'fs'
import { extname, basename, join } from 'path'
import type { Sticker, ImportResult, ImportSkip } from '../../shared/types'
import { paths, ensureStorageDirsExist } from './paths'

const MIME_TYPES_BY_EXTENSION: Record<string, string> = {
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif'
}

const THUMBNAIL_MAX_DIMENSION = 320

// The metadata file is small (a JSON array) and only ever touched by user
// actions like importing, so reading/writing it synchronously and in full
// is simple and plenty fast - no need for a real database at this scale.
function readLibrary(): Sticker[] {
  if (!existsSync(paths.libraryFile)) return []
  try {
    const raw = readFileSync(paths.libraryFile, 'utf-8')
    return JSON.parse(raw) as Sticker[]
  } catch {
    // A corrupted or hand-edited metadata file shouldn't crash the app -
    // treat it as an empty library rather than failing to launch.
    return []
  }
}

function writeLibrary(stickers: Sticker[]): void {
  writeFileSync(paths.libraryFile, JSON.stringify(stickers, null, 2), 'utf-8')
}

export function getLibrary(): Sticker[] {
  ensureStorageDirsExist()
  return readLibrary()
}

function hashFile(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

function displayNameFromFile(fileName: string): string {
  const withoutExtension = fileName.slice(0, fileName.length - extname(fileName).length)
  return withoutExtension || fileName
}

/** Resizes down to a small preview so the grid never has to decode full-size
 *  originals just to show a thumbnail (see MVP performance requirement). */
function createThumbnail(sourcePath: string, image: Electron.NativeImage, id: string): void {
  const { width, height } = image.getSize()
  const scale = Math.min(1, THUMBNAIL_MAX_DIMENSION / Math.max(width, height))
  const thumbnail =
    scale < 1 ? image.resize({ width: Math.round(width * scale) }) : image
  writeFileSync(join(paths.thumbnailsDir, `${id}.png`), thumbnail.toPNG())
}

function buildStickerRecord(
  id: string,
  extension: string,
  mimeType: string,
  originalName: string,
  displayName: string,
  fileSize: number,
  width: number,
  height: number,
  contentHash: string
): Sticker {
  return {
    id,
    filename: `${id}${extension}`,
    originalName,
    displayName,
    mimeType,
    fileSize,
    width,
    height,
    isFavorite: false,
    createdAt: Date.now(),
    lastUsedAt: null,
    packId: null,
    contentHash
  }
}

export function isSupportedImageExtension(extension: string): boolean {
  return extension.toLowerCase() in MIME_TYPES_BY_EXTENSION
}

// Importing a big folder is a long synchronous loop (hash, decode, thumbnail
// per file). Yielding between files keeps the app's window responsive
// instead of freezing until the whole batch is done.
const yieldToEventLoop = (): Promise<void> => new Promise((resolve) => setImmediate(resolve))

export async function importStickerFiles(filePaths: string[]): Promise<ImportResult> {
  ensureStorageDirsExist()
  const library = readLibrary()
  const existingHashes = new Set(library.map((sticker) => sticker.contentHash))

  const imported: Sticker[] = []
  const skipped: ImportSkip[] = []

  for (const sourcePath of filePaths) {
    const fileName = basename(sourcePath)
    const extension = extname(sourcePath).toLowerCase()
    const mimeType = MIME_TYPES_BY_EXTENSION[extension]

    if (!mimeType) {
      skipped.push({ fileName, reason: 'Unsupported file type' })
      continue
    }

    let fileSize: number
    try {
      fileSize = statSync(sourcePath).size
    } catch {
      skipped.push({ fileName, reason: 'File could not be read' })
      continue
    }

    const contentHash = hashFile(sourcePath)
    if (existingHashes.has(contentHash)) {
      skipped.push({ fileName, reason: 'Already in your library' })
      continue
    }

    const image = nativeImage.createFromPath(sourcePath)
    if (image.isEmpty()) {
      skipped.push({ fileName, reason: 'Image could not be read (it may be corrupt)' })
      continue
    }

    const id = randomUUID()
    const { width, height } = image.getSize()

    // Copy the original byte-for-byte into our storage folder. We never
    // re-encode, crop, or otherwise transform the file the user imported -
    // only the separate thumbnail is a generated copy.
    copyFileSync(sourcePath, join(paths.originalsDir, `${id}${extension}`))
    createThumbnail(sourcePath, image, id)

    const sticker = buildStickerRecord(
      id,
      extension,
      mimeType,
      fileName,
      displayNameFromFile(fileName),
      fileSize,
      width,
      height,
      contentHash
    )

    existingHashes.add(contentHash)
    imported.push(sticker)
    await yieldToEventLoop()
  }

  if (imported.length > 0) {
    // Re-read instead of writing the copy loaded at the start: the user may
    // have favorited/renamed something while this import was yielding, and
    // writing the stale copy back would silently undo that.
    writeLibrary([...readLibrary(), ...imported])
  }

  return { imported, skipped }
}

// Used by the sticker editor (background removal + text) to save an edited
// result as a brand-new sticker, rather than overwriting the one the user
// started from - the original stays untouched and importable again.
export function importGeneratedImage(pngBytes: Buffer, displayName: string): Sticker {
  ensureStorageDirsExist()

  const image = nativeImage.createFromBuffer(pngBytes)
  if (image.isEmpty()) {
    throw new Error('Generated image could not be read')
  }

  const id = randomUUID()
  const { width, height } = image.getSize()
  const contentHash = createHash('sha256').update(pngBytes).digest('hex')

  writeFileSync(join(paths.originalsDir, `${id}.png`), pngBytes)
  createThumbnail(join(paths.originalsDir, `${id}.png`), image, id)

  const sticker = buildStickerRecord(
    id,
    '.png',
    'image/png',
    `${displayName}.png`,
    displayName.trim() || 'Untitled',
    pngBytes.length,
    width,
    height,
    contentHash
  )

  const library = readLibrary()
  library.push(sticker)
  writeLibrary(library)

  return sticker
}

export function getStickerById(id: string): Sticker | undefined {
  return readLibrary().find((sticker) => sticker.id === id)
}

export function getOriginalFilePath(sticker: Sticker): string {
  return join(paths.originalsDir, sticker.filename)
}

function updateSticker(id: string, patch: Partial<Sticker>): Sticker | undefined {
  const library = readLibrary()
  const index = library.findIndex((sticker) => sticker.id === id)
  if (index === -1) return undefined

  library[index] = { ...library[index], ...patch }
  writeLibrary(library)
  return library[index]
}

export function setStickerFavorite(id: string, isFavorite: boolean): Sticker | undefined {
  return updateSticker(id, { isFavorite })
}

export function renameSticker(id: string, displayName: string): Sticker | undefined {
  const trimmed = displayName.trim()
  if (!trimmed) return undefined
  return updateSticker(id, { displayName: trimmed })
}

export function markStickerUsed(id: string): Sticker | undefined {
  return updateSticker(id, { lastUsedAt: Date.now() })
}

export function setStickerPack(id: string, packId: string | null): Sticker | undefined {
  return updateSticker(id, { packId })
}

// Called when a pack is deleted, so stickers that belonged to it fall back
// to "no pack" instead of pointing at a pack that no longer exists.
export function clearPackFromStickers(packId: string): void {
  const library = readLibrary()
  let changed = false
  for (const sticker of library) {
    if (sticker.packId === packId) {
      sticker.packId = null
      changed = true
    }
  }
  if (changed) writeLibrary(library)
}

export function deleteSticker(id: string): boolean {
  const library = readLibrary()
  const index = library.findIndex((sticker) => sticker.id === id)
  if (index === -1) return false

  const [removed] = library.splice(index, 1)
  writeLibrary(library)

  // The metadata entry is gone either way - if a stray file can't be
  // deleted (already missing, locked, etc.) that's not worth failing over.
  try {
    unlinkSync(join(paths.originalsDir, removed.filename))
  } catch {
    // ignore
  }
  try {
    unlinkSync(join(paths.thumbnailsDir, `${removed.id}.png`))
  } catch {
    // ignore
  }

  return true
}
