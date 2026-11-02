import {
  applyPatches,
  enablePatches,
  produceWithPatches,
  type Draft,
  type Patch,
} from 'immer'

enablePatches()

export interface HistoryEntry {
  label: string
  forward: Patch[]
  backward: Patch[]
  at: number
}

export interface CreatedEntry<T> {
  next: T
  entry: HistoryEntry
}

export function createEntry<T>(
  base: T,
  recipe: (draft: Draft<T>) => void,
  label = ''
): CreatedEntry<T> {
  const [next, forward, backward] = produceWithPatches(base, recipe)
  return {
    next: next as T,
    entry: { label, forward, backward, at: Date.now() },
  }
}

export function applyForward<T>(state: T, entry: HistoryEntry): T {
  return applyPatches(state as object, entry.forward) as T
}

export function applyBackward<T>(state: T, entry: HistoryEntry): T {
  return applyPatches(state as object, entry.backward) as T
}
