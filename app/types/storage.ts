import type { Note } from './index'

export const SCHEMA_VERSION = 1 as const

export interface PersistedState {
  schemaVersion: typeof SCHEMA_VERSION
  notes: Note[]
}

export interface DraftState {
  schemaVersion: typeof SCHEMA_VERSION
  noteId: string
  baseUpdatedAt: number
  note: Note
  savedAt: number
}
