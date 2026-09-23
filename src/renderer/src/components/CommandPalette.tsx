import { useEffect, useMemo, useRef, useState } from 'react'
import type { FC, KeyboardEvent } from 'react'
import type { Sticker } from '@shared/types'
import { SearchIcon } from './icons'
import './CommandPalette.css'

interface CommandPaletteProps {
  stickers: Sticker[]
  onClose: () => void
  onOpenSticker: (id: string) => void
  onImport: () => void
  onViewAll: () => void
  onViewFavorites: () => void
  onViewRecent: () => void
  onCreateCollection: () => void
  onOpenSettings: () => void
}

interface Entry {
  key: string
  label: string
  hint: string
  run: () => void
}

const CommandPalette: FC<CommandPaletteProps> = ({
  stickers,
  onClose,
  onOpenSticker,
  onImport,
  onViewAll,
  onViewFavorites,
  onViewRecent,
  onCreateCollection,
  onOpenSettings
}) => {
  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const runAndClose = (action: () => void): (() => void) => {
    return () => {
      action()
      onClose()
    }
  }

  const commandEntries: Entry[] = useMemo(
    () => [
      { key: 'import', label: 'Import stickers', hint: 'Command', run: runAndClose(onImport) },
      { key: 'all', label: 'View all stickers', hint: 'Command', run: runAndClose(onViewAll) },
      {
        key: 'favorites',
        label: 'View favorites',
        hint: 'Command',
        run: runAndClose(onViewFavorites)
      },
      { key: 'recent', label: 'View recent', hint: 'Command', run: runAndClose(onViewRecent) },
      {
        key: 'create-collection',
        label: 'Create collection',
        hint: 'Command',
        run: runAndClose(onCreateCollection)
      },
      { key: 'settings', label: 'Settings', hint: 'Command', run: runAndClose(onOpenSettings) }
    ],
    []
  )

  const trimmedQuery = query.trim().toLowerCase()

  const filteredCommands = trimmedQuery
    ? commandEntries.filter((entry) => entry.label.toLowerCase().includes(trimmedQuery))
    : commandEntries

  const matchingStickers: Entry[] = trimmedQuery
    ? stickers
        .filter((sticker) => sticker.displayName.toLowerCase().includes(trimmedQuery))
        .slice(0, 8)
        .map((sticker) => ({
          key: `sticker:${sticker.id}`,
          label: sticker.displayName,
          hint: 'Sticker',
          run: runAndClose(() => onOpenSticker(sticker.id))
        }))
    : []

  const allEntries = [...filteredCommands, ...matchingStickers]

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Escape') {
      onClose()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((index) => Math.min(index + 1, allEntries.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      allEntries[highlightedIndex]?.run()
    }
  }

  return (
    <div
      className="command-palette-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="command-palette__search">
          <SearchIcon className="command-palette__search-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search stickers or run a command…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setHighlightedIndex(0)
            }}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="command-palette__list">
          {filteredCommands.length > 0 && (
            <div className="command-palette__group">
              <span className="command-palette__group-label">Commands</span>
              {filteredCommands.map((entry) => {
                const index = allEntries.indexOf(entry)
                return (
                  <button
                    key={entry.key}
                    type="button"
                    className={
                      index === highlightedIndex ? 'command-palette__item--highlighted' : ''
                    }
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={entry.run}
                  >
                    {entry.label}
                  </button>
                )
              })}
            </div>
          )}

          {matchingStickers.length > 0 && (
            <div className="command-palette__group">
              <span className="command-palette__group-label">Stickers</span>
              {matchingStickers.map((entry) => {
                const index = allEntries.indexOf(entry)
                return (
                  <button
                    key={entry.key}
                    type="button"
                    className={
                      index === highlightedIndex ? 'command-palette__item--highlighted' : ''
                    }
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={entry.run}
                  >
                    {entry.label}
                  </button>
                )
              })}
            </div>
          )}

          {trimmedQuery && allEntries.length === 0 && (
            <p className="command-palette__empty">No matches for "{query}"</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default CommandPalette
