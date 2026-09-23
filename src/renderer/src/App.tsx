import { useEffect, useMemo, useState } from 'react'
import type { DragEvent, FC } from 'react'
import type { ImportResult, ImportSkip, Pack, Sticker } from '@shared/types'
import TopBar from './components/TopBar'
import Sidebar, { type LibraryView, libraryViewKey } from './components/Sidebar'
import EmptyState from './components/EmptyState'
import StickerGrid from './components/StickerGrid'
import ImportIssuesBanner from './components/ImportIssuesBanner'
import ContentHeader from './components/ContentHeader'
import StickerContextMenu from './components/StickerContextMenu'
import StickerPreview from './components/StickerPreview'
import ImportModal from './components/ImportModal'
import CommandPalette from './components/CommandPalette'
import Toast from './components/Toast'
import { useTheme } from './hooks/useTheme'
import { sortStickers, type SortOrder } from './lib/sortStickers'
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

function viewSubtitle(view: LibraryView): string {
  switch (view.kind) {
    case 'all':
      return 'Your complete sticker collection'
    case 'favorites':
      return 'Stickers you have starred'
    case 'recent':
      return 'Stickers you have copied recently'
    case 'pack':
      return 'A pack in your vault'
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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [sortOrder, setSortOrder] = useState<SortOrder>('name')
  const [previewStickerId, setPreviewStickerId] = useState<string | null>(null)
  const [contextMenuRequest, setContextMenuRequest] = useState<{
    stickerId: string
    x: number
    y: number
  } | null>(null)
  const [renamingStickerId, setRenamingStickerId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const { preference: themePreference, setPreference: setThemePreference } = useTheme()

  // Ctrl+K opens the command palette from anywhere in the app.
  useEffect(() => {
    const handleGlobalKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.ctrlKey && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsCommandPaletteOpen(true)
      }
    }
    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

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

  // Shared by every import entry point (the modal's browse/drop, and
  // dragging files onto the window directly) so there's exactly one place
  // that actually calls the import API and updates state.
  const runImport = async (filePaths: string[]): Promise<ImportResult> => {
    setIsImporting(true)
    try {
      const result = await window.api.importStickers(filePaths)
      if (result.imported.length > 0) {
        setStickers((current) => [...current, ...result.imported])
      }
      return result
    } finally {
      setIsImporting(false)
    }
  }

  const handleImportClick = (): void => {
    setIsImportModalOpen(true)
  }

  const handleWindowDrop = async (event: DragEvent<HTMLDivElement>): Promise<void> => {
    event.preventDefault()
    setIsDragActive(false)
    if (isImporting || isImportModalOpen) return

    const filePaths = Array.from(event.dataTransfer.files).map((file) =>
      window.api.getPathForFile(file)
    )
    if (filePaths.length === 0) return

    const result = await runImport(filePaths)
    setImportIssues(result.skipped)
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

  const handleCreateCollectionQuick = (): void => {
    handleCreatePack('New Collection')
  }

  const handleContextMenuCopy = async (id: string): Promise<void> => {
    const succeeded = await handleCopy(id)
    setToast(
      succeeded
        ? { message: 'Copied to clipboard', tone: 'success' }
        : { message: 'Copy failed', tone: 'error' }
    )
  }

  const handleCardRenameCommit = (id: string, displayName: string): void => {
    setRenamingStickerId(null)
    const trimmed = displayName.trim()
    const sticker = stickers.find((s) => s.id === id)
    if (trimmed && sticker && trimmed !== sticker.displayName) {
      handleRename(id, trimmed)
    }
  }

  const previewSticker = stickers.find((s) => s.id === previewStickerId) ?? null
  const contextMenuSticker = stickers.find((s) => s.id === contextMenuRequest?.stickerId) ?? null

  const visibleStickers = useMemo(() => {
    let result = stickers
    const isRecentView = activeView.kind === 'recent'

    if (activeView.kind === 'favorites') {
      result = result.filter((sticker) => sticker.isFavorite)
    } else if (isRecentView) {
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

    // Recent's whole point is "most recently used first" — a manual sort
    // control would just undo that, so it only applies elsewhere.
    return isRecentView ? result : sortStickers(result, sortOrder)
  }, [stickers, activeView, searchQuery, sortOrder])

  const packStickerCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const sticker of stickers) {
      if (sticker.packId) counts[sticker.packId] = (counts[sticker.packId] ?? 0) + 1
    }
    return counts
  }, [stickers])

  return (
    <div className="app">
      <TopBar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onImportClick={handleImportClick}
        isImporting={isImporting}
        themePreference={themePreference}
        onThemeChange={setThemePreference}
        isSettingsOpen={isSettingsOpen}
        onToggleSettings={() => setIsSettingsOpen((open) => !open)}
        onCloseSettings={() => setIsSettingsOpen(false)}
      />

      <div className="app__body">
        <Sidebar
          activeView={activeView}
          onViewChange={setActiveView}
          packs={packs}
          packStickerCounts={packStickerCounts}
          onCreatePack={handleCreatePack}
          onRenamePack={handleRenamePack}
          onDeletePack={handleDeletePack}
        />

        <main
          className={`app__content ${isDragActive ? 'app__content--drag-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleWindowDrop}
        >
          <ContentHeader
            title={viewTitle(activeView, packs)}
            subtitle={viewSubtitle(activeView)}
            count={visibleStickers.length}
            showSort={activeView.kind !== 'recent' && stickers.length > 0}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
          />

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
                selectedStickerId={previewStickerId}
                renamingStickerId={renamingStickerId}
                onSelect={setPreviewStickerId}
                onToggleFavorite={handleToggleFavorite}
                onContextMenuRequest={(stickerId, x, y) =>
                  setContextMenuRequest({ stickerId, x, y })
                }
                onRenameCommit={handleCardRenameCommit}
                onRenameCancel={() => setRenamingStickerId(null)}
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

      {contextMenuSticker && contextMenuRequest && (
        <StickerContextMenu
          sticker={contextMenuSticker}
          packs={packs}
          x={contextMenuRequest.x}
          y={contextMenuRequest.y}
          onClose={() => setContextMenuRequest(null)}
          onCopy={handleContextMenuCopy}
          onToggleFavorite={handleToggleFavorite}
          onOpen={handleOpen}
          onRequestRename={setRenamingStickerId}
          onSetPack={handleSetPack}
          onDelete={handleDelete}
        />
      )}

      {previewSticker && (
        <StickerPreview
          sticker={previewSticker}
          packs={packs}
          onClose={() => setPreviewStickerId(null)}
          onCopy={handleCopy}
          onToggleFavorite={handleToggleFavorite}
          onOpen={handleOpen}
          onRename={handleRename}
          onSetPack={handleSetPack}
          onDelete={handleDelete}
        />
      )}

      {isImportModalOpen && (
        <ImportModal
          isImporting={isImporting}
          onImport={runImport}
          onClose={() => setIsImportModalOpen(false)}
        />
      )}

      {isCommandPaletteOpen && (
        <CommandPalette
          stickers={stickers}
          onClose={() => setIsCommandPaletteOpen(false)}
          onOpenSticker={setPreviewStickerId}
          onImport={() => setIsImportModalOpen(true)}
          onViewAll={() => setActiveView({ kind: 'all' })}
          onViewFavorites={() => setActiveView({ kind: 'favorites' })}
          onViewRecent={() => setActiveView({ kind: 'recent' })}
          onCreateCollection={handleCreateCollectionQuick}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}
    </div>
  )
}

export default App
