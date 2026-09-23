import { useRef } from 'react'
import type { FC, KeyboardEvent, MouseEvent } from 'react'
import type { Sticker } from '@shared/types'
import { StarIcon, MoreIcon } from './icons'
import './StickerCard.css'

interface StickerCardProps {
  sticker: Sticker
  isSelected: boolean
  isRenaming: boolean
  onSelect: (id: string) => void
  onToggleFavorite: (id: string) => void
  onContextMenuRequest: (id: string, x: number, y: number) => void
  onRenameCommit: (id: string, displayName: string) => void
  onRenameCancel: () => void
}

const StickerCard: FC<StickerCardProps> = ({
  sticker,
  isSelected,
  isRenaming,
  onSelect,
  onToggleFavorite,
  onContextMenuRequest,
  onRenameCommit,
  onRenameCancel
}) => {
  const moreButtonRef = useRef<HTMLButtonElement>(null)

  const handleContextMenu = (event: MouseEvent<HTMLDivElement>): void => {
    event.preventDefault()
    onContextMenuRequest(sticker.id, event.clientX, event.clientY)
  }

  const handleMoreClick = (event: MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation()
    const rect = moreButtonRef.current?.getBoundingClientRect()
    onContextMenuRequest(sticker.id, rect?.right ?? event.clientX, rect?.bottom ?? event.clientY)
  }

  const handleRenameKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') event.currentTarget.blur()
    else if (event.key === 'Escape') onRenameCancel()
  }

  return (
    <div
      className={`sticker-card ${isSelected ? 'sticker-card--selected' : ''}`}
      onClick={() => onSelect(sticker.id)}
      onContextMenu={handleContextMenu}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(sticker.id)
        }
      }}
    >
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
        ref={moreButtonRef}
        type="button"
        className="sticker-card__more"
        title="More actions"
        onClick={handleMoreClick}
      >
        <MoreIcon className="sticker-card__more-icon" />
      </button>

      <div className="sticker-card__image-wrap">
        <img
          className="sticker-card__image"
          src={`stickervault-media://thumbnails/${sticker.id}.png`}
          alt={sticker.displayName}
          draggable={false}
        />
      </div>

      {isRenaming ? (
        <input
          className="sticker-card__name-input"
          defaultValue={sticker.displayName}
          autoFocus
          onClick={(event) => event.stopPropagation()}
          onKeyDown={handleRenameKeyDown}
          onBlur={(event) => onRenameCommit(sticker.id, event.target.value)}
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
