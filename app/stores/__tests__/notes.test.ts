import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotesStore } from '../notes'

describe('notes store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('createNote adds a note with unique id', () => {
    const s = useNotesStore()
    const a = s.createNote()
    const b = s.createNote()
    expect(s.notes).toHaveLength(2)
    expect(a.id).not.toBe(b.id)
  })

  it('updateNote mutates fields and bumps updatedAt', async () => {
    const s = useNotesStore()
    const n = s.createNote()
    const before = n.updatedAt
    await new Promise((r) => setTimeout(r, 2))
    s.updateNote(n.id, { title: 'Hello' })
    expect(n.title).toBe('Hello')
    expect(n.updatedAt).toBeGreaterThan(before)
  })

  it('updateNote is a no-op for unknown id', () => {
    const s = useNotesStore()
    s.createNote()
    expect(() => s.updateNote('nope', { title: 'x' })).not.toThrow()
    expect(s.notes).toHaveLength(1)
  })

  it('deleteNote removes the target only', () => {
    const s = useNotesStore()
    const a = s.createNote()
    const b = s.createNote()
    s.deleteNote(a.id)
    expect(s.notes.map((n) => n.id)).toEqual([b.id])
  })

  it('getNote and byId reflect mutations', () => {
    const s = useNotesStore()
    const n = s.createNote()
    s.updateNote(n.id, { title: 'T' })
    expect(s.getNote(n.id)?.title).toBe('T')
    expect(s.byId.get(n.id)?.title).toBe('T')
  })

  it('replaceAll hydrates and sets ready', () => {
    const s = useNotesStore()
    expect(s.ready).toBe(false)
    const note = {
      id: '1',
      title: 'A',
      todos: [],
      createdAt: 1,
      updatedAt: 1,
    }
    s.replaceAll([note])
    expect(s.notes).toEqual([note])
    expect(s.ready).toBe(true)
  })
})
