// A small curated palette (not a full rainbow) so packs get some visual
// identity without the sidebar turning chaotic. Picked to sit comfortably
// alongside the violet accent in both themes.
const PACK_COLORS = ['#7c6cf6', '#f0709a', '#f5a623', '#4ade80', '#38bdf8', '#f2545b']

export function packColor(packId: string): string {
  let hash = 0
  for (let i = 0; i < packId.length; i++) {
    hash = (hash * 31 + packId.charCodeAt(i)) >>> 0
  }
  return PACK_COLORS[hash % PACK_COLORS.length]
}

export function packInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}
