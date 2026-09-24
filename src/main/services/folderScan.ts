import { createWriteStream, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync } from 'fs'
import { tmpdir } from 'os'
import { basename, extname, join } from 'path'
import { pipeline } from 'stream/promises'
import yauzl from 'yauzl'
import type { ImportSkip } from '../../shared/types'
import { isSupportedImageExtension } from './stickerLibrary'

// Safety nets against pointing the importer at something enormous (a whole
// drive, or a maliciously crafted "zip bomb"). Importing is per-file work,
// so these keep a runaway import from tying the app up or filling the disk.
const MAX_FILES_PER_IMPORT = 5000
const MAX_ENTRY_BYTES = 50 * 1024 * 1024
const MAX_TOTAL_EXTRACTED_BYTES = 1024 * 1024 * 1024

export interface ScanResult {
  files: string[]
  skipped: ImportSkip[]
  /** Deletes any temp files created while unpacking zips. Always call this
   *  once the files have been imported (or the import failed). */
  cleanup: () => void
}

interface Budget {
  remainingFiles: number
  remainingBytes: number
}

const isZip = (filePath: string): boolean => extname(filePath).toLowerCase() === '.zip'

function extractZipImages(
  zipPath: string,
  destinationRoot: string,
  budget: Budget
): Promise<{ files: string[]; encryptedCount: number; failed: boolean; stoppedEarly: boolean }> {
  return new Promise((resolve) => {
    const files: string[] = []
    let encryptedCount = 0
    let settled = false
    let stoppedEarly = false

    const finish = (failed = false): void => {
      if (settled) return
      settled = true
      resolve({ files, encryptedCount, failed, stoppedEarly })
    }

    yauzl.open(zipPath, { lazyEntries: true }, (openError, zipfile) => {
      if (openError || !zipfile) {
        finish(true)
        return
      }

      zipfile.on('error', () => {
        // e.g. an entry with an unsafe name like ../../x - the reader refuses
        // it and can't continue, so keep what was read and say so.
        stoppedEarly = true
        finish(files.length === 0)
      })
      zipfile.on('end', () => finish())

      const openStream = (entry: yauzl.Entry): Promise<NodeJS.ReadableStream> =>
        new Promise((res, rej) =>
          zipfile.openReadStream(entry, (err, stream) => (err || !stream ? rej(err) : res(stream)))
        )

      zipfile.on('entry', async (entry: yauzl.Entry) => {
        // Entry names are only ever used for their final file name - never
        // as a path - so a crafted "../../evil" entry can't escape the temp
        // folder (the classic "zip slip" attack).
        const entryName = entry.fileName
        const shortName = entryName.split('/').pop() ?? ''
        const isJunk = entryName.includes('__MACOSX/') || shortName.startsWith('._')

        const wanted =
          !entryName.endsWith('/') && !isJunk && isSupportedImageExtension(extname(shortName))

        if (wanted) {
          if (entry.isEncrypted()) {
            encryptedCount++
          } else if (
            entry.uncompressedSize <= MAX_ENTRY_BYTES &&
            budget.remainingFiles > 0 &&
            budget.remainingBytes >= entry.uncompressedSize
          ) {
            try {
              const safeName = shortName.replace(/[<>:"\\|?*\u0000-\u001f]/g, '_')
              // One subfolder per extracted file so two entries with the
              // same name in different zip folders can't collide, while
              // each file keeps its original name (used as the sticker name).
              const entryDir = join(destinationRoot, String(files.length))
              mkdirSync(entryDir, { recursive: true })
              const destination = join(entryDir, safeName)
              await pipeline(await openStream(entry), createWriteStream(destination))
              files.push(destination)
              budget.remainingFiles--
              budget.remainingBytes -= entry.uncompressedSize
            } catch {
              // One unreadable entry shouldn't abandon the rest of the archive.
            }
          } else if (budget.remainingFiles <= 0 || budget.remainingBytes <= 0) {
            zipfile.close()
            finish()
            return
          }
        }

        zipfile.readEntry()
      })

      zipfile.readEntry()
    })
  })
}

/** Expands a mix of files, folders, and zip archives into a flat list of
 *  image files ready to import. Folders are searched recursively (including
 *  any zips inside them) and anything that isn't a supported image is
 *  ignored quietly - a folder full of .txt/.psd/etc. shouldn't produce a
 *  wall of "unsupported file" errors. Files the user picked directly are
 *  passed through untouched so they still get proper feedback if they
 *  can't be imported. */
export async function collectImageFiles(inputPaths: string[]): Promise<ScanResult> {
  const files: string[] = []
  const zips: string[] = []
  const skipped: ImportSkip[] = []
  let hitLimit = false
  let tempRoot: string | null = null

  const walk = (folderPath: string): void => {
    if (hitLimit) return

    let entries
    try {
      entries = readdirSync(folderPath, { withFileTypes: true })
    } catch {
      skipped.push({ fileName: basename(folderPath), reason: 'Folder could not be opened' })
      return
    }

    for (const entry of entries) {
      if (hitLimit) return
      // Symlinks/junctions are skipped so a link pointing back up the tree
      // can't send the scan into an infinite loop.
      if (entry.isSymbolicLink()) continue

      const fullPath = join(folderPath, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.isFile() && isZip(entry.name)) {
        zips.push(fullPath)
      } else if (entry.isFile() && isSupportedImageExtension(extname(entry.name))) {
        if (files.length >= MAX_FILES_PER_IMPORT) {
          hitLimit = true
          return
        }
        files.push(fullPath)
      }
    }
  }

  for (const inputPath of inputPaths) {
    let isDirectory = false
    try {
      isDirectory = statSync(inputPath).isDirectory()
    } catch {
      // Let the importer report unreadable/missing files with its own message.
    }

    if (isDirectory) walk(inputPath)
    else if (isZip(inputPath)) zips.push(inputPath)
    else files.push(inputPath)
  }

  const budget: Budget = {
    remainingFiles: Math.max(0, MAX_FILES_PER_IMPORT - files.length),
    remainingBytes: MAX_TOTAL_EXTRACTED_BYTES
  }

  for (const zipPath of zips) {
    tempRoot ??= mkdtempSync(join(tmpdir(), 'stickervault-zip-'))
    const zipName = basename(zipPath)
    const zipDestination = join(tempRoot, String(files.length), 'zip')
    mkdirSync(zipDestination, { recursive: true })

    const result = await extractZipImages(zipPath, zipDestination, budget)
    files.push(...result.files)

    if (result.failed) {
      skipped.push({ fileName: zipName, reason: 'Zip file could not be opened' })
    } else if (result.files.length === 0) {
      skipped.push({
        fileName: zipName,
        reason:
          result.encryptedCount > 0
            ? 'Password-protected zips are not supported'
            : 'No images found inside'
      })
    } else if (result.stoppedEarly) {
      skipped.push({
        fileName: zipName,
        reason: 'Stopped early: the archive contains an invalid entry'
      })
    } else if (result.encryptedCount > 0) {
      skipped.push({
        fileName: zipName,
        reason: `${result.encryptedCount} password-protected image(s) skipped`
      })
    }
  }

  if (hitLimit || budget.remainingFiles <= 0) {
    skipped.push({
      fileName: 'Large batch',
      reason: `Only the first ${MAX_FILES_PER_IMPORT.toLocaleString()} images were imported`
    })
  }

  const root = tempRoot
  return {
    files,
    skipped,
    cleanup: () => {
      if (root) rmSync(root, { recursive: true, force: true })
    }
  }
}
