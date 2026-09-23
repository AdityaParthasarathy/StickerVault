import { existsSync, readFileSync, writeFileSync } from 'fs'
import type { AppSettings, ThemePreference } from '../../shared/types'
import { paths } from './paths'

const DEFAULT_SETTINGS: AppSettings = { theme: 'system' }

export function getSettings(): AppSettings {
  if (!existsSync(paths.settingsFile)) return DEFAULT_SETTINGS
  try {
    const raw = JSON.parse(readFileSync(paths.settingsFile, 'utf-8'))
    return { ...DEFAULT_SETTINGS, ...raw }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function setTheme(theme: ThemePreference): AppSettings {
  const settings = { ...getSettings(), theme }
  writeFileSync(paths.settingsFile, JSON.stringify(settings, null, 2), 'utf-8')
  return settings
}
