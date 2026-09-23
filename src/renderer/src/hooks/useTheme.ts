import { useEffect, useState } from 'react'
import type { ThemePreference } from '@shared/types'

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  return preference === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : preference
}

/** Loads the saved theme preference, applies it to <html data-theme>, keeps
 *  it in sync if the OS theme changes while "System" is selected, and
 *  exposes a setter that persists the choice. */
export function useTheme(): {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
} {
  const [preference, setPreferenceState] = useState<ThemePreference>('system')

  useEffect(() => {
    window.api.getSettings().then((settings) => setPreferenceState(settings.theme))
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = resolveTheme(preference)

    if (preference !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (): void => {
      document.documentElement.dataset.theme = resolveTheme('system')
    }
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [preference])

  const setPreference = (next: ThemePreference): void => {
    setPreferenceState(next)
    window.api.setTheme(next)
  }

  return { preference, setPreference }
}
