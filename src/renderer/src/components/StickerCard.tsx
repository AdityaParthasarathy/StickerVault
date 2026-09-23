import { useEffect, useRef, useState } from 'react'
import type { FC, KeyboardEvent } from 'react'
import type { Pack, Sticker } from '@shared/types'
import { StarIcon, MoreIcon, CheckIcon } from './icons'
import './StickerCard.css'

interface StickerCardProps {
  sticker: Sticker
  packs: Pack[]
  onCopy: (id: string) => Promise<boolean>
  onToggleFavorite: (id: string) => void
  onOpen: (id: string) => void
  onRename: (id: string, displayName: string) => void
  onSetPack: (id: string, packId: string | null) => void
  onDelete: (id: string) => void
}

type MenuView = 'closed' | 'main' | 'move'

const StickerCard: FC<StickerCardProps> = ({
  sticker,
  packs,
  onCopy,
  onToggleFavorite,
  onOpen,
  onRename,
  onSetPack,
  onDelete
}) => {
  const [menuView, setMenuView] = useState<MenuView>('closed')
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(sticker.displayName)
  const [copyFeedback, setCopyFeedback] = useState<'copied' | 'failed' | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // Close the "..." menu on any click outside the card, same as a native
  // context menu would.
  useEffect(() => {
    if (menuView === 'closed') return
    const handleClickOutside = (event: MouseEvent): void => {
      if (!cardRef.current?.contains(event.target as Node)) setMenuView('closed')
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuView])

  const handleCopyClick = async (): Promise<void> => {
    const succeeded = await onCopy(sticker.id)
    setCopyFeedback(succeeded ? 'copied' : 'failed')
    setTimeout(() => setCopyFeedback(null), 1200)
  }

  const startRenaming = (): void => {
    setRenameValue(sticker.displayName)
    setIsRenaming(true)
    setMenuView('closed')
  }

  const commitRename = (): void => {
    setIsRenaming(false)
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== sticker.displayName) {
      onRename(sticker.id, trimmed)
    }
  }

  const handleRenameKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.currentTarget.blur()
    } else if (event.key === 'Escape') {
      setRenameValue(sticker.displayName)
      setIsRenaming(false)
    }
  }

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape' && menuView !== 'closed') {
      event.stopPropagation()
      setMenuView('closed')
    }
  }

  return (
    <div ref={cardRef} className="sticker-card" onKeyDown={handleCardKeyDown}>
      <button
        type="button"
        className="sticker-card__favorite"
        aria-pressed={sticker.isFavorite}
        title={sticker.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        onClick={(event) => {
          event.stopPropagation()
          onToggleFavorite(sticker.id)
        }}
      >
        <StarIcon className="sticker-card__favorite-icon" filled={sticker.isFavorite} />
      </button>

      <button
        type="button"
        className="sticker-card__more"
        title="More actions"
        onClick={(event) => {
          event.stopPropagation()
          setMenuView((current) => (current === 'closed' ? 'main' : 'closed'))
        }}
      >
        <MoreIcon className="sticker-card__more-icon" />
      </button>

      {menuView === 'main' && (
        <div className="sticker-card__menu">
          <button type="button" onClick={() => onOpen(sticker.id)}>
            Open
          </button>
          <button type="button" onClick={startRenaming}>
            Rename
          </button>
          <button type="button" onClick={() => setMenuView('move')}>
            Move to pack
          </button>
          <button
            type="button"
            className="sticker-card__menu-danger"
            onClick={() => {
              setMenuView('closed')
              onDelete(sticker.id)
            }}
          >
            Delete
          </button>
        </div>
      )}

      {menuView === 'move' && (
        <div className="sticker-card__menu">
          <button type="button" className="sticker-card__menu-back" onClick={() => setMenuView('main')}>
            ← Back
          </button>
          <button
            type="button"
            className={sticker.packId === null ? 'sticker-card__menu-selected' : ''}
            onClick={() => {
              setMenuView('closed')
              onSetPack(sticker.id, null)
            }}
          >
            No pack
          </button>
          {packs.map((pack) => (
            <button
              key={pack.id}
              type="button"
              className={sticker.packId === pack.id ? 'sticker-card__menu-selected' : ''}
              onClick={() => {
                setMenuView('closed')
                onSetPack(sticker.id, pack.id)
              }}
            >
              {pack.name}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        className="sticker-card__image-button"
        title="Click to copy"
        onClick={handleCopyClick}
      >
        <img
          className="sticker-card__image"
          src={`stickervault-media://thumbnails/${sticker.id}.png`}
          alt={sticker.displayName}
          draggable={false}
        />

        {copyFeedback && (
          <span className={`sticker-card__feedback sticker-card__feedback--${copyFeedback}`}>
            {copyFeedback === 'copied' ? (
              <>
                <CheckIcon className="sticker-card__feedback-icon" /> Copied
              </>
            ) : (
              'Copy failed'
            )}
          </span>
        )}
      </button>

      {isRenaming ? (
        <input
          className="sticker-card__name-input"
          value={renameValue}
          autoFocus
          onChange={(event) => setRenameValue(event.target.value)}
          onKeyDown={handleRenameKeyDown}
          onBlur={commitRename}
          onClick={(event) => event.stopPropagation()}
        />
      ) : (
        <span className="sticker-card__name" title={sticker.displayName}>
          {sticker.displayName}
        </span>
      )}
    </div>
  )
}

export default StickerCard
