import {
  computed,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  type ComputedRef,
  type InjectionKey,
  type Ref,
} from 'vue'
import type { Note } from '~/types'
import { SCHEMA_VERSION } from '~/types/storage'
import { useNotesStore } from '~/stores/notes'
import { useNoteHistory } from './useNoteHistory'
import { useStorageSync } from './useStorageSync'
import { useModal } from './useModal'
import { useCrossTab } from './useCrossTab'
import { browserStorage } from '~/utils/storage/adapter'
import { clearDraft, readDraft } from '~/utils/storage/drafts'
import { draftKey } from '~/utils/storage/schema'

export interface EditSession {
  note: Ref<Note>
  canUndo: ComputedRef<boolean>
  canRedo: ComputedRef<boolean>
  titleError: ComputedRef<string | null>
  canSave: ComputedRef<boolean>
  isDeletedElsewhere: Ref<boolean>

  undo: () => void
  redo: () => void

  commitTitle: (value: string) => void
  commitTodoText: (id: string, value: string) => void
  toggleTodo: (id: string) => void
  addTodo: () => void
  removeTodo: (id: string) => void

  registerFieldFlush: (fn: () => void) => () => void
  flushAll: () => void

  save: () => Promise<void>
  cancel: () => Promise<void>
  remove: () => Promise<void>
}

export const EditSessionKey: InjectionKey<EditSession> = Symbol('editSession')

function cloneNote(n: Note): Note {
  return {
    id: n.id,
    title: n.title,
    todos: n.todos.map((t) => ({ id: t.id, text: t.text, done: t.done })),
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  }
}

export function useEditNoteSession(noteId: string): EditSession | null {
  const store = useNotesStore()
  if (!store.ready) return null
  const stored = store.getNote(noteId)
  if (!stored) return null

  const router = useRouter()
  const modal = useModal()
  const crossTab = useCrossTab()
  const adapter = browserStorage()

  const initialState = ref<Note>(cloneNote(stored))
  const { state, canUndo, canRedo, commit, undo, redo, reset } = useNoteHistory(
    { initialState }
  )

  useStorageSync({
    adapter,
    key: draftKey(noteId),
    state: () => ({
      schemaVersion: SCHEMA_VERSION,
      noteId,
      baseUpdatedAt: stored.updatedAt,
      note: state.value,
      savedAt: Date.now(),
    }),
    throttleMs: 800,
  })

  const flushers = new Set<() => void>()
  function registerFieldFlush(fn: () => void): () => void {
    flushers.add(fn)
    return () => {
      flushers.delete(fn)
    }
  }
  function flushAll(): void {
    for (const fn of flushers) fn()
  }

  function commitTitle(value: string): void {
    if (state.value.title === value) return
    commit((d) => {
      d.title = value
    }, 'title')
  }

  function commitTodoText(id: string, value: string): void {
    const target = state.value.todos.find((t) => t.id === id)
    if (!target || target.text === value) return
    commit((d) => {
      const t = d.todos.find((x) => x.id === id)
      if (t) t.text = value
    }, 'todo-text')
  }

  function toggleTodo(id: string): void {
    commit((d) => {
      const t = d.todos.find((x) => x.id === id)
      if (t) t.done = !t.done
    }, 'todo-toggle')
  }

  function addTodo(): void {
    commit((d) => {
      d.todos.push({ id: crypto.randomUUID(), text: '', done: false })
    }, 'todo-add')
  }

  function removeTodo(id: string): void {
    commit((d) => {
      const i = d.todos.findIndex((t) => t.id === id)
      if (i !== -1) d.todos.splice(i, 1)
    }, 'todo-remove')
  }

  const titleError = computed<string | null>(() =>
    state.value.title.trim() === '' ? 'Название не может быть пустым' : null
  )
  const canSave = computed(() => titleError.value === null)

  const isDeletedElsewhere = ref(false)
  const offCrossTab = crossTab.on((msg) => {
    if (msg.type === 'note-deleted' && msg.id === noteId) {
      isDeletedElsewhere.value = true
    }
  })
  onBeforeUnmount(offCrossTab)

  function onGlobalKey(e: KeyboardEvent): void {
    const mod = e.ctrlKey || e.metaKey
    if (!mod || e.key.toLowerCase() !== 'z') return
    e.preventDefault()
    e.stopPropagation()
    flushAll()
    if (e.shiftKey) redo()
    else undo()
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onGlobalKey, true)
    onBeforeUnmount(() => {
      window.removeEventListener('keydown', onGlobalKey, true)
    })
  }

  onMounted(async () => {
    const draft = readDraft(adapter, noteId)
    if (!draft) return
    if (draft.baseUpdatedAt !== stored.updatedAt) {
      clearDraft(adapter, noteId)
      return
    }
    const restore = await modal.confirm({
      title: 'Восстановить черновик?',
      text: 'Найдены несохранённые изменения с прошлой сессии. Восстановить их?',
      confirmLabel: 'Восстановить',
      cancelLabel: 'Начать заново',
      variant: 'primary',
    })
    if (!restore) {
      clearDraft(adapter, noteId)
      return
    }
    commit((d) => {
      d.title = draft.note.title
      d.todos = draft.note.todos.map((t) => ({ ...t }))
    }, 'restore-draft')
  })

  async function save(): Promise<void> {
    flushAll()
    if (!canSave.value) return
    const cleanTodos = state.value.todos
      .filter((t) => t.text.trim() !== '')
      .map((t) => ({ ...t, text: t.text.trim() }))
    store.updateNote(noteId, {
      title: state.value.title.trim(),
      todos: cleanTodos,
    })
    crossTab.send({ type: 'note-updated', id: noteId })
    clearDraft(adapter, noteId)
    reset()
    await router.push('/')
  }

  async function cancel(): Promise<void> {
    const ok = await modal.confirm({
      title: 'Отменить редактирование?',
      text: 'Несохранённые изменения будут потеряны.',
      confirmLabel: 'Отменить',
      cancelLabel: 'Продолжить редактирование',
      variant: 'danger',
    })
    if (!ok) return
    clearDraft(adapter, noteId)
    await router.push('/')
  }

  async function remove(): Promise<void> {
    const ok = await modal.confirm({
      title: 'Удалить заметку?',
      text: 'Действие нельзя отменить. Заметка и все её пункты будут удалены.',
      confirmLabel: 'Удалить',
      cancelLabel: 'Отмена',
      variant: 'danger',
    })
    if (!ok) return
    store.deleteNote(noteId)
    crossTab.send({ type: 'note-deleted', id: noteId })
    clearDraft(adapter, noteId)
    await router.push('/')
  }

  const session: EditSession = {
    note: state,
    canUndo,
    canRedo,
    titleError,
    canSave,
    isDeletedElsewhere,
    undo,
    redo,
    commitTitle,
    commitTodoText,
    toggleTodo,
    addTodo,
    removeTodo,
    registerFieldFlush,
    flushAll,
    save,
    cancel,
    remove,
  }

  provide(EditSessionKey, session)
  return session
}
