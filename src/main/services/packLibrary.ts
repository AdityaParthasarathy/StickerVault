import { randomUUID } from 'crypto'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import type { Pack } from '../../shared/types'
import { paths } from './paths'

// Same simple "read the whole JSON array, edit it, write it back" approach
// as stickerLibrary.ts - packs are a short list, so there's no need for
// anything fancier.
function readPacks(): Pack[] {
  if (!existsSync(paths.packsFile)) return []
  try {
    const raw = readFileSync(paths.packsFile, 'utf-8')
    return JSON.parse(raw) as Pack[]
  } catch {
    return []
  }
}

function writePacks(packs: Pack[]): void {
  writeFileSync(paths.packsFile, JSON.stringify(packs, null, 2), 'utf-8')
}

export function getPacks(): Pack[] {
  return readPacks()
}

export function createPack(name: string): Pack | undefined {
  const trimmed = name.trim()
  if (!trimmed) return undefined

  const packs = readPacks()
  const pack: Pack = { id: randomUUID(), name: trimmed, createdAt: Date.now() }
  packs.push(pack)
  writePacks(packs)
  return pack
}

export function renamePack(id: string, name: string): Pack | undefined {
  const trimmed = name.trim()
  if (!trimmed) return undefined

  const packs = readPacks()
  const index = packs.findIndex((pack) => pack.id === id)
  if (index === -1) return undefined

  packs[index] = { ...packs[index], name: trimmed }
  writePacks(packs)
  return packs[index]
}

export function deletePack(id: string): boolean {
  const packs = readPacks()
  const index = packs.findIndex((pack) => pack.id === id)
  if (index === -1) return false

  packs.splice(index, 1)
  writePacks(packs)
  return true
}
