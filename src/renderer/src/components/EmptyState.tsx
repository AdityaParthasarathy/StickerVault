import type { FC } from 'react'
import './EmptyState.css'

interface EmptyStateProps {
  onImportClick: () => void
}

const EmptyState: FC<EmptyStateProps> = ({ onImportClick }) => {
  return (
    <div className="empty-state">
      <div className="empty-state__art" aria-hidden="true">
        <span className="empty-state__sticker empty-state__sticker--1">🗿</span>
        <span className="empty-state__sticker empty-state__sticker--2">😂</span>
        <span className="empty-state__sticker empty-state__sticker--3">🔥</span>
        <div className="empty-state__ring" />
      </div>

      <h1 className="empty-state__title">Your sticker collection starts here.</h1>
      <p className="empty-state__subtitle">
        Import stickers from your computer to build a library you can reuse anywhere.
      </p>

      <button type="button" className="empty-state__cta" onClick={onImportClick}>
        Import stickers
      </button>

      <div className="empty-state__dropzone">
        <span>or drag &amp; drop files here</span>
      </div>
    </div>
  )
}

export default EmptyState
