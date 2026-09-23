import { useEffect, useRef } from 'react'
import type { FC } from 'react'
import type { ThemePreference } from '@shared/types'
import './SettingsPanel.css'

interface SettingsPanelProps {
  themePreference: ThemePreference
  onThemeChange: (theme: ThemePreference) => void
  onClose: () => void
}

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' }
]

const SettingsPanel: FC<SettingsPanelProps> = ({ themePreference, onThemeChange, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (!panelRef.current?.contains(event.target as Node)) onClose()
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
    <div ref={panelRef} className="settings-panel" role="dialog" aria-label="Settings">
      <div className="settings-panel__section">
        <span className="settings-panel__label">Appearance</span>
        <div className="settings-panel__segmented">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={
                themePreference === option.value ? 'settings-panel__segment--active' : ''
              }
              onClick={() => onThemeChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-panel__section settings-panel__about">
        <span className="settings-panel__label">About</span>
        <p className="settings-panel__app-name">StickerVault</p>
        <p className="settings-panel__tagline">Your stickers. One beautiful vault.</p>
        <p className="settings-panel__version">Version 0.1.0</p>
      </div>
    </div>
  )
}

export default SettingsPanel
