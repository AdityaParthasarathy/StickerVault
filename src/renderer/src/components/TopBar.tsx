import type { FC, KeyboardEvent } from 'react'
import './TopBar.css'

interface TopBarProps {
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  onImportClick: () => void
  isImporting: boolean
}

// The top bar doubles as the window's title bar (see `titleBarStyle: hidden`
// in the main process). Most of it is draggable so the user can move the
// window by its background, same as any native Windows app — only the
// actual controls (search box, buttons) opt back out of that with
// `.no-drag`, or clicks on them would just drag the window instead.
const TopBar: FC<TopBarProps> = ({
  searchQuery,
  onSearchQueryChange,
  onImportClick,
  isImporting
}) => {
  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Escape' && searchQuery) {
      event.stopPropagation()
      onSearchQueryChange('')
    }
  }

  return (
    <header className="top-bar">
      <div className="top-bar__brand">
        <span className="top-bar__logo" aria-hidden="true">
          🗂️
        </span>
        <span className="top-bar__title">StickerVault</span>
      </div>

      <div className="top-bar__search no-drag">
        <span className="top-bar__search-icon" aria-hidden="true">
          🔍
        </span>
        <input
          type="text"
          placeholder="Search stickers..."
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
      </div>

      <div className="top-bar__actions no-drag">
        <button
          type="button"
          className="top-bar__import"
          onClick={onImportClick}
          disabled={isImporting}
        >
          {isImporting ? (
            'Importing…'
          ) : (
            <>
              <span aria-hidden="true">+</span> Import
            </>
          )}
        </button>
      </div>
    </header>
  )
}

export default TopBar
