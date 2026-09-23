import type { FC } from 'react'
import type { Sticker } from '@shared/types'
import StickerCard from './StickerCard'
import './StickerGrid.css'

interface StickerGridProps {
  stickers: Sticker[]
  selectedStickerId: string | null
  renamingStickerId: string | null
  onSelect: (id: string) => void
  onToggleFavorite: (id: string) => void
  onContextMenuRequest: (id: string, x: number, y: number) => void
  onRenameCommit: (id: string, displayName: string) => void
  onRenameCancel: () => void
}

const StickerGrid: FC<StickerGridProps> = ({
  stickers,
  selectedStickerId,
  renamingStickerId,
  onSelect,
  onToggleFavorite,
  onContextMenuRequest,
  onRenameCommit,
  onRenameCancel
}) => {
  return (
    <div className="sticker-grid">
      {stickers.map((sticker) => (
        <StickerCard
          key={sticker.id}
          sticker={sticker}
          isSelected={selectedStickerId === sticker.id}
          isRenaming={renamingStickerId === sticker.id}
          onSelect={onSelect}
          onToggleFavorite={onToggleFavorite}
          onContextMenuRequest={onContextMenuRequest}
          onRenameCommit={onRenameCommit}
          onRenameCancel={onRenameCancel}
        />
      ))}
    </div>
  )
}

export default StickerGrid
