import type { FC } from 'react'
import type { Pack, Sticker } from '@shared/types'
import StickerCard from './StickerCard'
import './StickerGrid.css'

interface StickerGridProps {
  stickers: Sticker[]
  packs: Pack[]
  onCopy: (id: string) => Promise<boolean>
  onToggleFavorite: (id: string) => void
  onOpen: (id: string) => void
  onRename: (id: string, displayName: string) => void
  onSetPack: (id: string, packId: string | null) => void
  onDelete: (id: string) => void
}

const StickerGrid: FC<StickerGridProps> = ({
  stickers,
  packs,
  onCopy,
  onToggleFavorite,
  onOpen,
  onRename,
  onSetPack,
  onDelete
}) => {
  return (
    <div className="sticker-grid">
      {stickers.map((sticker) => (
        <StickerCard
          key={sticker.id}
          sticker={sticker}
          packs={packs}
          onCopy={onCopy}
          onToggleFavorite={onToggleFavorite}
          onOpen={onOpen}
          onRename={onRename}
          onSetPack={onSetPack}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

export default StickerGrid
