// System fonts only — no font files to bundle or download, and every one
// of these ships with Windows by default. Picked for how distinct they
// look from each other, since that's what "a few font styles" is really
// asking for.
export interface StickerFont {
  label: string
  family: string
}

export const STICKER_FONTS: StickerFont[] = [
  { label: 'Bold Impact', family: 'Impact, "Arial Black", sans-serif' },
  { label: 'Clean Sans', family: '"Segoe UI", Arial, sans-serif' },
  { label: 'Playful', family: '"Comic Sans MS", "Comic Sans", cursive' },
  { label: 'Elegant Serif', family: 'Georgia, "Times New Roman", serif' },
  { label: 'Mono', family: 'Consolas, "Courier New", monospace' }
]
