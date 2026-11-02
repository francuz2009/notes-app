import { computed, ref, toRaw, type ComputedRef, type Ref } from 'vue'
import type { Draft } from 'immer'
import type { Note } from '~/types'
import {
  applyBackward,
  applyForward,
  createEntry,
  type HistoryEntry,
} from '~/utils/history/patches'

export interface UseNoteHistoryOptions {
  initialState: Ref<Note>
  maxSteps?: number
}

export interface UseNoteHistory {
  state: Ref<Note>
  canUndo: ComputedRef<boolean>
  canRedo: ComputedRef<boolean>
  undoSize: ComputedRef<number>
  redoSize: ComputedRef<number>
  commit: (recipe: (draft: Draft<Note>) => void, label?: string) => void
  undo: () => void
  redo: () => void
  reset: () => void
}

export function useNoteHistory({
  initialState,
  maxSteps = 50,
}: UseNoteHistoryOptions): UseNoteHistory {
  const undoStack = ref<HistoryEntry[]>([])
  const redoStack = ref<HistoryEntry[]>([])

  function commit(recipe: (draft: Draft<Note>) => void, label = ''): void {
    const { next, entry } = createEntry(
      toRaw(initialState.value),
      recipe,
      label
    )
    if (entry.forward.length === 0) return
    initialState.value = next
    undoStack.value.push(entry)
    if (undoStack.value.length > maxSteps) undoStack.value.shift()
    redoStack.value.length = 0
  }

  function undo(): void {
    const entry = undoStack.value.pop()
    if (!entry) return
    initialState.value = applyBackward(toRaw(initialState.value), entry)
    redoStack.value.push(entry)
  }

  function redo(): void {
    const entry = redoStack.value.pop()
    if (!entry) return
    initialState.value = applyForward(toRaw(initialState.value), entry)
    undoStack.value.push(entry)
    if (undoStack.value.length > maxSteps) undoStack.value.shift()
  }

  function reset(): void {
    undoStack.value = []
    redoStack.value = []
  }

  return {
    state: initialState,
    canUndo: computed(() => undoStack.value.length > 0),
    canRedo: computed(() => redoStack.value.length > 0),
    undoSize: computed(() => undoStack.value.length),
    redoSize: computed(() => redoStack.value.length),
    commit,
    undo,
    redo,
    reset,
  }
}
