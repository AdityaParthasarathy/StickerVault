import type { Sticker } from '@shared/types'

export type SortOrder = 'name' | 'newest'

export function sortStickers(stickers: Sticker[], order: SortOrder): Sticker[] {
  const sorted = [...stickers]
  if (order === 'name') {
    sorted.sort((a, b) => a.displayName.localeCompare(b.displayName))
  } else {
    sorted.sort((a, b) => b.createdAt - a.createdAt)
  }
  return sorted
}
