import { readdirSync, statSync } from 'fs'
import { basename, extname, join } from 'path'
import type { ImportSkip } from '../../shared/types'
import { isSupportedImageExtension } from './stickerLibrary'

// A safety net against pointing the importer at something like a whole
// drive — importing is synchronous per file, so this keeps a runaway
// scan from tying the app up for minutes.
const MAX_FILES_PER_IMPORT = 5000

export interface ScanResult {
  files: string[]
  skipped: ImportSkip[]
}

/** Expands a mix of files and folders into a flat list of image files.
 *  Folders are searched recursively, and anything that isn't a supported
 *  image is ignored quietly — a folder full of .txt/.psd/etc. shouldn't
 *  produce a wall of "unsupported file" errors. Files the user picked
 *  directly are passed through untouched so they still get proper
 *  feedback if they can't be imported. */
export function collectImageFiles(inputPaths: string[]): ScanResult {
  const files: string[] = []
  const skipped: ImportSkip[] = []
  let hitLimit = false

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
    else files.push(inputPath)
  }

  if (hitLimit) {
    skipped.push({
      fileName: 'Large folder',
      reason: `Only the first ${MAX_FILES_PER_IMPORT.toLocaleString()} images were imported`
    })
  }

  return { files, skipped }
}
