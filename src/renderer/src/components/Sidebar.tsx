import { useEffect, useRef, useState } from 'react'
import type { FC, KeyboardEvent } from 'react'
import type { Pack } from '@shared/types'
import { MoreIcon } from './icons'
import './Sidebar.css'

export type LibraryView =
  | { kind: 'all' }
  | { kind: 'favorites' }
  | { kind: 'recent' }
  | { kind: 'pack'; packId: string }

export function libraryViewKey(view: LibraryView): string {
  return view.kind === 'pack' ? `pack:${view.packId}` : view.kind
}

const LIBRARY_ITEMS: { view: LibraryView; label: string; icon: string }[] = [
  { view: { kind: 'all' }, label: 'All Stickers', icon: '🖼️' },
  { view: { kind: 'favorites' }, label: 'Favorites', icon: '⭐' },
  { view: { kind: 'recent' }, label: 'Recent', icon: '🕐' }
]

interface SidebarProps {
  activeView: LibraryView
  onViewChange: (view: LibraryView) => void
  packs: Pack[]
  onCreatePack: (name: string) => void
  onRenamePack: (id: string, name: string) => void
  onDeletePack: (id: string) => void
}

const Sidebar: FC<SidebarProps> = ({
  activeView,
  onViewChange,
  packs,
  onCreatePack,
  onRenamePack,
  onDeletePack
}) => {
  const [isAddingPack, setIsAddingPack] = useState(false)
  const [newPackName, setNewPackName] = useState('')
  const [menuOpenForPackId, setMenuOpenForPackId] = useState<string | null>(null)
  const [renamingPackId, setRenamingPackId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const navRef = useRef<HTMLElement>(null)

  const activeKey = libraryViewKey(activeView)

  useEffect(() => {
    if (!menuOpenForPackId) return
    const handleClickOutside = (event: MouseEvent): void => {
      if (!navRef.current?.contains(event.target as Node)) setMenuOpenForPackId(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpenForPackId])

  const commitNewPack = (): void => {
    const trimmed = newPackName.trim()
    setIsAddingPack(false)
    setNewPackName('')
    if (trimmed) onCreatePack(trimmed)
  }

  const handleNewPackKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') event.currentTarget.blur()
    else if (event.key === 'Escape') {
      setNewPackName('')
      setIsAddingPack(false)
    }
  }

  const startRenamingPack = (pack: Pack): void => {
    setRenamingPackId(pack.id)
    setRenameValue(pack.name)
    setMenuOpenForPackId(null)
  }

  const commitRenamePack = (packId: string): void => {
    setRenamingPackId(null)
    const trimmed = renameValue.trim()
    if (trimmed) onRenamePack(packId, trimmed)
  }

  const handleRenameKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') event.currentTarget.blur()
    else if (event.key === 'Escape') setRenamingPackId(null)
  }

  const handleNavKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key === 'Escape' && menuOpenForPackId) {
      event.stopPropagation()
      setMenuOpenForPackId(null)
    }
  }

  return (
    <nav className="sidebar" ref={navRef} onKeyDown={handleNavKeyDown}>
      <div className="sidebar__section">
        {LIBRARY_ITEMS.map((item) => (
          <button
            key={libraryViewKey(item.view)}
            type="button"
            className={`sidebar__item ${activeKey === libraryViewKey(item.view) ? 'sidebar__item--active' : ''}`}
            onClick={() => onViewChange(item.view)}
          >
            <span className="sidebar__item-icon" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </div>

      <div className="sidebar__section">
        <span className="sidebar__section-label">Packs</span>

        {packs.length === 0 && !isAddingPack && <p className="sidebar__empty-hint">No packs yet</p>}

        {packs.map((pack) => (
          <div key={pack.id} className="sidebar__pack-row">
            {renamingPackId === pack.id ? (
              <input
                className="sidebar__pack-rename-input"
                value={renameValue}
                autoFocus
                onChange={(event) => setRenameValue(event.target.value)}
                onKeyDown={handleRenameKeyDown}
                onBlur={() => commitRenamePack(pack.id)}
              />
            ) : (
              <button
                type="button"
                className={`sidebar__item ${activeKey === `pack:${pack.id}` ? 'sidebar__item--active' : ''}`}
                onClick={() => onViewChange({ kind: 'pack', packId: pack.id })}
              >
                <span className="sidebar__item-icon" aria-hidden="true">
                  📁
                </span>
                <span className="sidebar__pack-name">{pack.name}</span>
              </button>
            )}

            <button
              type="button"
              className="sidebar__pack-more"
              title="Pack options"
              onClick={(event) => {
                event.stopPropagation()
                setMenuOpenForPackId((current) => (current === pack.id ? null : pack.id))
              }}
            >
              <MoreIcon className="sidebar__pack-more-icon" />
            </button>

            {menuOpenForPackId === pack.id && (
              <div className="sidebar__pack-menu">
                <button type="button" onClick={() => startRenamingPack(pack)}>
                  Rename
                </button>
                <button
                  type="button"
                  className="sidebar__pack-menu-danger"
                  onClick={() => {
                    setMenuOpenForPackId(null)
                    onDeletePack(pack.id)
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}

        {isAddingPack ? (
          <input
            className="sidebar__pack-rename-input"
            placeholder="Pack name"
            value={newPackName}
            autoFocus
            onChange={(event) => setNewPackName(event.target.value)}
            onKeyDown={handleNewPackKeyDown}
            onBlur={commitNewPack}
          />
        ) : (
          <button type="button" className="sidebar__new-pack" onClick={() => setIsAddingPack(true)}>
            <span aria-hidden="true">+</span> New Pack
          </button>
        )}
      </div>
    </nav>
  )
}

export default Sidebar
