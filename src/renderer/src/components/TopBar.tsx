import type { FC, KeyboardEvent } from 'react'
import type { ThemePreference } from '@shared/types'
import { GearIcon, SearchIcon, VaultMarkIcon } from './icons'
import SettingsPanel from './SettingsPanel'
import './TopBar.css'

interface TopBarProps {
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  onImportClick: () => void
  isImporting: boolean
  themePreference: ThemePreference
  onThemeChange: (theme: ThemePreference) => void
  isSettingsOpen: boolean
  onToggleSettings: () => void
  onCloseSettings: () => void
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
  isImporting,
  themePreference,
  onThemeChange,
  isSettingsOpen,
  onToggleSettings,
  onCloseSettings
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
        <VaultMarkIcon className="top-bar__logo" />
        <span className="top-bar__title">StickerVault</span>
      </div>

      <div className="top-bar__search no-drag">
        <SearchIcon className="top-bar__search-icon" />
        <input
          id="sticker-search-input"
          type="text"
          placeholder="Search stickers..."
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
        <kbd className="top-bar__search-hint">Ctrl K</kbd>
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

        <div className="top-bar__settings-anchor">
          <button
            type="button"
            className="top-bar__icon-button"
            title="Settings"
            onClick={onToggleSettings}
          >
            <GearIcon className="top-bar__icon-button-icon" />
          </button>

          {isSettingsOpen && (
            <SettingsPanel
              themePreference={themePreference}
              onThemeChange={onThemeChange}
              onClose={onCloseSettings}
            />
          )}
        </div>
      </div>
    </header>
  )
}

export default TopBar
