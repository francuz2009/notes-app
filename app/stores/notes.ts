import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Note } from '~/types'

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])
  const ready = ref(false)

  const byId = computed(() => {
    const map = new Map<string, Note>()
    for (const n of notes.value) map.set(n.id, n)
    return map
  })

  function getNote(id: string): Note | undefined {
    return byId.value.get(id)
  }

  function createNote(): Note {
    const now = Date.now()
    const note: Note = {
      id: crypto.randomUUID(),
      title: '',
      todos: [],
      createdAt: now,
      updatedAt: now,
    }
    notes.value.push(note)
    return note
  }

  function updateNote(
    id: string,
    patch: Partial<Pick<Note, 'title' | 'todos'>>
  ): void {
    const note = byId.value.get(id)
    if (!note) return
    Object.assign(note, patch, { updatedAt: Date.now() })
  }

  function deleteNote(id: string): void {
    const i = notes.value.findIndex((n) => n.id === id)
    if (i !== -1) notes.value.splice(i, 1)
  }

  function replaceAll(next: Note[]): void {
    notes.value = next
    ready.value = true
  }

  return {
    notes,
    ready,
    byId,
    getNote,
    createNote,
    updateNote,
    deleteNote,
    replaceAll,
  }
})
