import { useEffect, useState } from 'react'
import type { FC, KeyboardEvent } from 'react'
import type { Pack, Sticker } from '@shared/types'
import { CheckIcon, CloseIcon, StarIcon } from './icons'
import { formatBytes } from '../lib/formatBytes'
import './StickerPreview.css'

interface StickerPreviewProps {
  sticker: Sticker
  packs: Pack[]
  onClose: () => void
  onCopy: (id: string) => Promise<boolean>
  onToggleFavorite: (id: string) => void
  onOpen: (id: string) => void
  onRename: (id: string, displayName: string) => void
  onSetPack: (id: string, packId: string | null) => void
  onDelete: (id: string) => void
}

const StickerPreview: FC<StickerPreviewProps> = ({
  sticker,
  packs,
  onClose,
  onCopy,
  onToggleFavorite,
  onOpen,
  onRename,
  onSetPack,
  onDelete
}) => {
  const [isRenaming, setIsRenaming] = useState(false)
  const [nameDraft, setNameDraft] = useState(sticker.displayName)
  const [copyFeedback, setCopyFeedback] = useState<'copied' | 'failed' | null>(null)

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape' && !isRenaming) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, isRenaming])

  useEffect(() => {
    setNameDraft(sticker.displayName)
  }, [sticker.displayName])

  const handleCopyClick = async (): Promise<void> => {
    const succeeded = await onCopy(sticker.id)
    setCopyFeedback(succeeded ? 'copied' : 'failed')
    setTimeout(() => setCopyFeedback(null), 1400)
  }

  const commitRename = (): void => {
    setIsRenaming(false)
    const trimmed = nameDraft.trim()
    if (trimmed && trimmed !== sticker.displayName) onRename(sticker.id, trimmed)
  }

  const handleNameKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') event.currentTarget.blur()
    else if (event.key === 'Escape') {
      setNameDraft(sticker.displayName)
      setIsRenaming(false)
    }
  }

  return (
    <div className="preview-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="preview" role="dialog" aria-modal="true" aria-label="Sticker preview">
        <button type="button" className="preview__close" title="Close" onClick={onClose}>
          <CloseIcon className="preview__close-icon" />
        </button>

        <div className="preview__image-pane">
          <img
            className="preview__image"
            src={`stickervault-media://originals/${sticker.filename}`}
            alt={sticker.displayName}
            draggable={false}
          />
        </div>

        <div className="preview__details">
          <div className="preview__header">
            {isRenaming ? (
              <input
                className="preview__name-input"
                value={nameDraft}
                autoFocus
                onChange={(event) => setNameDraft(event.target.value)}
                onKeyDown={handleNameKeyDown}
                onBlur={commitRename}
              />
            ) : (
              <h2 className="preview__name" onClick={() => setIsRenaming(true)} title="Click to rename">
                {sticker.displayName}
              </h2>
            )}

            <button
              type="button"
              className={`preview__favorite ${sticker.isFavorite ? 'preview__favorite--active' : ''}`}
              onClick={() => onToggleFavorite(sticker.id)}
              title={sticker.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <StarIcon className="preview__favorite-icon" filled={sticker.isFavorite} />
            </button>
          </div>

          <dl className="preview__meta">
            <div>
              <dt>Type</dt>
              <dd>{sticker.mimeType.replace('image/', '').toUpperCase()}</dd>
            </div>
            <div>
              <dt>Dimensions</dt>
              <dd>
                {sticker.width} × {sticker.height}
              </dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{formatBytes(sticker.fileSize)}</dd>
            </div>
            <div>
              <dt>Collection</dt>
              <dd>
                <select
                  className="preview__pack-select"
                  value={sticker.packId ?? ''}
                  onChange={(event) => onSetPack(sticker.id, event.target.value || null)}
                >
                  <option value="">None</option>
                  {packs.map((pack) => (
                    <option key={pack.id} value={pack.id}>
                      {pack.name}
                    </option>
                  ))}
                </select>
              </dd>
            </div>
          </dl>

          <div className="preview__actions">
            <button type="button" className="preview__copy" onClick={handleCopyClick}>
              {copyFeedback === 'copied' ? (
                <>
                  <CheckIcon className="preview__copy-icon" /> Copied
                </>
              ) : copyFeedback === 'failed' ? (
                'Copy failed'
              ) : (
                'Copy'
              )}
            </button>
            <button type="button" onClick={() => onOpen(sticker.id)}>
              Open
            </button>
            <button
              type="button"
              className="preview__delete"
              onClick={() => {
                onClose()
                onDelete(sticker.id)
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StickerPreview
