import type { DraftState } from '~/types/storage'
import { draftKey } from './schema'
import type { StorageAdapter } from './adapter'

export function readDraft(
  adapter: StorageAdapter,
  noteId: string
): DraftState | null {
  const raw = adapter.get(draftKey(noteId))
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as DraftState
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.schemaVersion === 1 &&
      parsed.note &&
      parsed.note.id === noteId
    ) {
      return parsed
    }
  } catch {
    console.log('error readDraft')
  }
  return null
}

export function writeDraft(adapter: StorageAdapter, draft: DraftState): void {
  try {
    adapter.set(draftKey(draft.noteId), JSON.stringify(draft))
  } catch (e) {
    console.warn('[drafts] write failed', e)
  }
}

export function clearDraft(adapter: StorageAdapter, noteId: string): void {
  adapter.remove(draftKey(noteId))
}
