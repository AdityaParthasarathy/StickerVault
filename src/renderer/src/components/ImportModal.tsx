import { useEffect, useState } from 'react'
import type { DragEvent, FC } from 'react'
import type { ImportResult, ImportSkip } from '@shared/types'
import { CheckIcon, CloseIcon, DownloadIcon } from './icons'
import './ImportModal.css'

interface ImportModalProps {
  isImporting: boolean
  onImport: (filePaths: string[]) => Promise<ImportResult>
  onClose: () => void
}

const ImportModal: FC<ImportModalProps> = ({ isImporting, onImport, onClose }) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [result, setResult] = useState<{ addedCount: number; skipped: ImportSkip[] } | null>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // A clean import (nothing skipped) closes itself shortly after — the
  // user just wants to see it worked, not dismiss a dialog by hand. If
  // anything was skipped, we wait for a manual "Done" so they can read why.
  useEffect(() => {
    if (result && result.skipped.length === 0) {
      const timer = setTimeout(onClose, 1300)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [result, onClose])

  const runImport = async (filePaths: string[]): Promise<void> => {
    if (filePaths.length === 0) return
    const importResult = await onImport(filePaths)
    setResult({ addedCount: importResult.imported.length, skipped: importResult.skipped })
  }

  const handleBrowseClick = async (): Promise<void> => {
    const filePaths = await window.api.selectStickerFiles()
    await runImport(filePaths)
  }

  const handleBrowseFolderClick = async (): Promise<void> => {
    const folderPaths = await window.api.selectStickerFolders()
    await runImport(folderPaths)
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>): Promise<void> => {
    event.preventDefault()
    setIsDragOver(false)
    const filePaths = Array.from(event.dataTransfer.files).map((file) =>
      window.api.getPathForFile(file)
    )
    await runImport(filePaths)
  }

  return (
    <div
      className="import-modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="import-modal" role="dialog" aria-modal="true" aria-label="Import stickers">
        <button type="button" className="import-modal__close" title="Close" onClick={onClose}>
          <CloseIcon className="import-modal__close-icon" />
        </button>

        {result ? (
          <div className="import-modal__result">
            <div className="import-modal__result-icon">
              <CheckIcon className="import-modal__result-check" />
            </div>
            <p className="import-modal__result-text">
              {result.addedCount > 0
                ? `${result.addedCount} sticker${result.addedCount === 1 ? '' : 's'} added to your vault.`
                : 'No new stickers were added.'}
            </p>

            {result.skipped.length > 0 && (
              <div className="import-modal__issues">
                <span>
                  {result.skipped.length} file{result.skipped.length === 1 ? '' : 's'} skipped
                </span>
                <ul>
                  {result.skipped.map((issue, index) => (
                    <li key={`${issue.fileName}-${index}`}>
                      <strong>{issue.fileName}</strong> — {issue.reason}
                    </li>
                  ))}
                </ul>
                <button type="button" className="import-modal__done" onClick={onClose}>
                  Done
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            className={`import-modal__dropzone ${isDragOver ? 'import-modal__dropzone--active' : ''}`}
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragOver(true)
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            <DownloadIcon className="import-modal__dropzone-icon" />
            <p className="import-modal__dropzone-title">
              {isImporting ? 'Importing…' : 'Drop stickers, folders or zips here'}
            </p>
            {!isImporting && (
              <>
                <span className="import-modal__or">or</span>
                <div className="import-modal__buttons">
                  <button type="button" className="import-modal__browse" onClick={handleBrowseClick}>
                    Browse Files
                  </button>
                  <button
                    type="button"
                    className="import-modal__browse import-modal__browse--secondary"
                    onClick={handleBrowseFolderClick}
                  >
                    Browse Folder
                  </button>
                </div>
                <p className="import-modal__formats">PNG · WEBP · JPG · GIF · ZIP</p>
                <p className="import-modal__formats">
                  Folders and zips are searched including all subfolders
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ImportModal
