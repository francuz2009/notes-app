import { describe, it, expect } from 'vitest'
import type { Note } from '~/types'
import { applyBackward, applyForward, createEntry } from '../patches'

function makeNote(): Note {
  return {
    id: 'n1',
    title: 'Original',
    todos: [
      { id: 't1', text: 'one', done: false },
      { id: 't2', text: 'two', done: true },
    ],
    createdAt: 1,
    updatedAt: 1,
  }
}

describe('patches', () => {
  it('title change round-trips via forward/backward', () => {
    const base = makeNote()
    const { next, entry } = createEntry(base, (d) => {
      d.title = 'Renamed'
    })
    expect(next.title).toBe('Renamed')
    expect(entry.forward.length).toBeGreaterThan(0)
    expect(entry.backward.length).toBeGreaterThan(0)

    const undone = applyBackward(next, entry)
    expect(undone.title).toBe('Original')

    const redone = applyForward(undone, entry)
    expect(redone.title).toBe('Renamed')
  })

  it('todo add/remove round-trips', () => {
    const base = makeNote()
    const added = createEntry(base, (d) => {
      d.todos.push({ id: 't3', text: 'three', done: false })
    })
    expect(added.next.todos).toHaveLength(3)
    expect(applyBackward(added.next, added.entry).todos).toHaveLength(2)

    const removed = createEntry(added.next, (d) => {
      d.todos.splice(0, 1)
    })
    expect(removed.next.todos[0]?.id).toBe('t2')
    expect(applyBackward(removed.next, removed.entry).todos[0]?.id).toBe('t1')
  })

  it('empty recipe produces no patches', () => {
    const base = makeNote()
    const { entry } = createEntry(base, () => {})
    expect(entry.forward).toEqual([])
    expect(entry.backward).toEqual([])
  })
})
