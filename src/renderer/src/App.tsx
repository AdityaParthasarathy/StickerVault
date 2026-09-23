import { useEffect, useMemo, useState } from 'react'
import type { DragEvent, FC } from 'react'
import type { ImportSkip, Pack, Sticker } from '@shared/types'
import TopBar from './components/TopBar'
import Sidebar, { type LibraryView, libraryViewKey } from './components/Sidebar'
import EmptyState from './components/EmptyState'
import StickerGrid from './components/StickerGrid'
import ImportIssuesBanner from './components/ImportIssuesBanner'
import './App.css'

function viewTitle(view: LibraryView, packs: Pack[]): string {
  switch (view.kind) {
    case 'all':
      return 'All Stickers'
    case 'favorites':
      return 'Favorites'
    case 'recent':
      return 'Recent'
    case 'pack':
      return packs.find((pack) => pack.id === view.packId)?.name ?? 'Pack'
  }
}

function noResultsMessage(view: LibraryView, hasSearch: boolean): string {
  if (hasSearch) return 'No stickers match your search.'
  switch (view.kind) {
    case 'favorites':
      return 'No favorites yet — click the star on a sticker to add one.'
    case 'recent':
      return "Stickers you copy will show up here."
    case 'pack':
      return 'No stickers in this pack yet.'
    default:
      return 'No stickers here yet.'
  }
}

const App: FC = () => {
  const [stickers, setStickers] = useState<Sticker[]>([])
  const [packs, setPacks] = useState<Pack[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [activeView, setActiveView] = useState<LibraryView>({ kind: 'all' })
  const [searchQuery, setSearchQuery] = useState('')
  const [importIssues, setImportIssues] = useState<ImportSkip[]>([])
  const [isDragActive, setIsDragActive] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  // Load whatever was already imported/created in a previous session as
  // soon as the window opens.
  const loadLibrary = (): void => {
    setIsLoading(true)
    setLoadError(false)
    Promise.all([window.api.getLibrary(), window.api.getPacks()])
      .then(([library, loadedPacks]) => {
        setStickers(library)
        setPacks(loadedPacks)
      })
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false))
  }

  useEffect(loadLibrary, [])

  const applyImportResult = (imported: Sticker[], skipped: ImportSkip[]): void => {
    if (imported.length > 0) {
      setStickers((current) => [...current, ...imported])
    }
    setImportIssues(skipped)
  }

  const handleImportClick = async (): Promise<void> => {
    if (isImporting) return
    const filePaths = await window.api.selectStickerFiles()
    if (filePaths.length === 0) return

    setIsImporting(true)
    try {
      const result = await window.api.importStickers(filePaths)
      applyImportResult(result.imported, result.skipped)
    } finally {
      setIsImporting(false)
    }
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>): Promise<void> => {
    event.preventDefault()
    setIsDragActive(false)
    if (isImporting) return

    const filePaths = Array.from(event.dataTransfer.files).map((file) =>
      window.api.getPathForFile(file)
    )
    if (filePaths.length === 0) return

    setIsImporting(true)
    try {
      const result = await window.api.importStickers(filePaths)
      applyImportResult(result.imported, result.skipped)
    } finally {
      setIsImporting(false)
    }
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault()
    setIsDragActive(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>): void => {
    if (event.currentTarget.contains(event.relatedTarget as Node)) return
    setIsDragActive(false)
  }

  const handleCopy = async (id: string): Promise<boolean> => {
    const result = await window.api.copySticker(id)
    if (result.ok) {
      setStickers((current) => current.map((s) => (s.id === id ? result.sticker : s)))
      return true
    }
    return false
  }

  const handleToggleFavorite = async (id: string): Promise<void> => {
    const updated = await window.api.toggleFavorite(id)
    if (!updated) return
    setStickers((current) => current.map((s) => (s.id === id ? updated : s)))
  }

  const handleOpen = (id: string): void => {
    window.api.openSticker(id)
  }

  const handleRename = async (id: string, displayName: string): Promise<void> => {
    const updated = await window.api.renameSticker(id, displayName)
    if (!updated) return
    setStickers((current) => current.map((s) => (s.id === id ? updated : s)))
  }

  const handleSetPack = async (id: string, packId: string | null): Promise<void> => {
    const updated = await window.api.setStickerPack(id, packId)
    if (!updated) return
    setStickers((current) => current.map((s) => (s.id === id ? updated : s)))
  }

  const handleDelete = async (id: string): Promise<void> => {
    const wasDeleted = await window.api.deleteSticker(id)
    if (!wasDeleted) return
    setStickers((current) => current.filter((s) => s.id !== id))
  }

  const handleCreatePack = async (name: string): Promise<void> => {
    const pack = await window.api.createPack(name)
    if (pack) setPacks((current) => [...current, pack])
  }

  const handleRenamePack = async (id: string, name: string): Promise<void> => {
    const updated = await window.api.renamePack(id, name)
    if (!updated) return
    setPacks((current) => current.map((p) => (p.id === id ? updated : p)))
  }

  const handleDeletePack = async (id: string): Promise<void> => {
    const wasDeleted = await window.api.deletePack(id)
    if (!wasDeleted) return
    setPacks((current) => current.filter((p) => p.id !== id))
    setStickers((current) => current.map((s) => (s.packId === id ? { ...s, packId: null } : s)))
    setActiveView((current) =>
      current.kind === 'pack' && current.packId === id ? { kind: 'all' } : current
    )
  }

  const visibleStickers = useMemo(() => {
    let result = stickers

    if (activeView.kind === 'favorites') {
      result = result.filter((sticker) => sticker.isFavorite)
    } else if (activeView.kind === 'recent') {
      result = result
        .filter((sticker) => sticker.lastUsedAt !== null)
        .sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0))
    } else if (activeView.kind === 'pack') {
      result = result.filter((sticker) => sticker.packId === activeView.packId)
    }

    const query = searchQuery.trim().toLowerCase()
    if (query) {
      result = result.filter((sticker) => sticker.displayName.toLowerCase().includes(query))
    }

    return result
  }, [stickers, activeView, searchQuery])

  return (
    <div className="app">
      <TopBar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onImportClick={handleImportClick}
        isImporting={isImporting}
      />

      <div className="app__body">
        <Sidebar
          activeView={activeView}
          onViewChange={setActiveView}
          packs={packs}
          onCreatePack={handleCreatePack}
          onRenamePack={handleRenamePack}
          onDeletePack={handleDeletePack}
        />

        <main
          className={`app__content ${isDragActive ? 'app__content--drag-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <h2 className="app__content-title">{viewTitle(activeView, packs)}</h2>

          {importIssues.length > 0 && (
            <ImportIssuesBanner issues={importIssues} onDismiss={() => setImportIssues([])} />
          )}

          <div className="app__content-area" key={libraryViewKey(activeView)}>
            {isLoading ? (
              <p className="app__status-message">Loading your stickers…</p>
            ) : loadError ? (
              <div className="app__status-message app__status-message--error">
                <p>Couldn&apos;t load your sticker library.</p>
                <button type="button" onClick={loadLibrary}>
                  Try again
                </button>
              </div>
            ) : stickers.length === 0 ? (
              <EmptyState onImportClick={handleImportClick} />
            ) : visibleStickers.length === 0 ? (
              <p className="app__no-results">
                {noResultsMessage(activeView, searchQuery.trim().length > 0)}
              </p>
            ) : (
              <StickerGrid
                stickers={visibleStickers}
                packs={packs}
                onCopy={handleCopy}
                onToggleFavorite={handleToggleFavorite}
                onOpen={handleOpen}
                onRename={handleRename}
                onSetPack={handleSetPack}
                onDelete={handleDelete}
              />
            )}
          </div>

          {isDragActive && (
            <div className="app__drag-overlay">
              <span>Drop to import</span>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
