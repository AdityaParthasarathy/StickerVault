import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { FC } from 'react'
import type { Pack, Sticker } from '@shared/types'
import './StickerContextMenu.css'

interface StickerContextMenuProps {
  sticker: Sticker
  packs: Pack[]
  x: number
  y: number
  onClose: () => void
  onCopy: (id: string) => void
  onToggleFavorite: (id: string) => void
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  onRequestRename: (id: string) => void
  onSetPack: (id: string, packId: string | null) => void
  onDelete: (id: string) => void
}

type MenuView = 'main' | 'move'

const StickerContextMenu: FC<StickerContextMenuProps> = ({
  sticker,
  packs,
  x,
  y,
  onClose,
  onCopy,
  onToggleFavorite,
  onOpen,
  onEdit,
  onRequestRename,
  onSetPack,
  onDelete
}) => {
  const [view, setView] = useState<MenuView>('main')
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ left: x, top: y })

  // Keep the menu fully on-screen even if it was opened near a window edge.
  useLayoutEffect(() => {
    const el = menuRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const maxLeft = window.innerWidth - rect.width - 8
    const maxTop = window.innerHeight - rect.height - 8
    setPosition({ left: Math.min(x, Math.max(8, maxLeft)), top: Math.min(y, Math.max(8, maxTop)) })
  }, [x, y, view])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (!menuRef.current?.contains(event.target as Node)) onClose()
    }
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: position.left, top: position.top }}
      role="menu"
    >
      {view === 'main' ? (
        <>
          <button
            type="button"
            onClick={() => {
              onClose()
              onCopy(sticker.id)
            }}
          >
            Copy
          </button>
          <button
            type="button"
            onClick={() => {
              onClose()
              onToggleFavorite(sticker.id)
            }}
          >
            {sticker.isFavorite ? 'Unfavorite' : 'Favorite'}
          </button>
          <button
            type="button"
            onClick={() => {
              onClose()
              onOpen(sticker.id)
            }}
          >
            Open
          </button>
          <button
            type="button"
            onClick={() => {
              onClose()
              onEdit(sticker.id)
            }}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => {
              onRequestRename(sticker.id)
              onClose()
            }}
          >
            Rename
          </button>
          <button type="button" onClick={() => setView('move')}>
            Move to collection
          </button>
          <div className="context-menu__divider" />
          <button
            type="button"
            className="context-menu__danger"
            onClick={() => {
              onClose()
              onDelete(sticker.id)
            }}
          >
            Delete
          </button>
        </>
      ) : (
        <>
          <button type="button" className="context-menu__back" onClick={() => setView('main')}>
            ← Back
          </button>
          <button
            type="button"
            className={sticker.packId === null ? 'context-menu__selected' : ''}
            onClick={() => {
              onClose()
              onSetPack(sticker.id, null)
            }}
          >
            No collection
          </button>
          {packs.map((pack) => (
            <button
              key={pack.id}
              type="button"
              className={sticker.packId === pack.id ? 'context-menu__selected' : ''}
              onClick={() => {
                onClose()
                onSetPack(sticker.id, pack.id)
              }}
            >
              {pack.name}
            </button>
          ))}
        </>
      )}
    </div>
  )
}

export default StickerContextMenu
