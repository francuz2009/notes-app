import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import type { Note } from '~/types'
import { useNoteHistory } from '../useNoteHistory'

function makeNote(): Note {
  return {
    id: 'n1',
    title: '',
    todos: [],
    createdAt: 1,
    updatedAt: 1,
  }
}

describe('useNoteHistory', () => {
  let h: ReturnType<typeof useNoteHistory>

  beforeEach(() => {
    h = useNoteHistory({ initialState: ref(makeNote()) })
  })

  it('commit → undo → state reverts', () => {
    h.commit((d) => {
      d.title = 'Hello'
    })
    expect(h.state.value.title).toBe('Hello')
    expect(h.canUndo.value).toBe(true)
    h.undo()
    expect(h.state.value.title).toBe('')
    expect(h.canUndo.value).toBe(false)
    expect(h.canRedo.value).toBe(true)
  })

  it('undo → redo → state restored', () => {
    h.commit((d) => {
      d.title = 'A'
    })
    h.undo()
    h.redo()
    expect(h.state.value.title).toBe('A')
    expect(h.canRedo.value).toBe(false)
  })

  it('new commit after undo clears redo branch', () => {
    h.commit((d) => {
      d.title = 'A'
    })
    h.commit((d) => {
      d.title = 'B'
    })
    h.undo()
    expect(h.canRedo.value).toBe(true)
    h.commit((d) => {
      d.title = 'C'
    })
    expect(h.canRedo.value).toBe(false)
    expect(h.state.value.title).toBe('C')
  })

  it('respects the 50-step cap', () => {
    for (let i = 0; i < 60; i++) {
      h.commit((d) => {
        d.title = `t${i}`
      })
    }
    expect(h.undoSize.value).toBe(50)
    for (let i = 0; i < 50; i++) h.undo()
    expect(h.canUndo.value).toBe(false)
    expect(h.canRedo.value).toBe(true)
  })

  it('reset clears both stacks', () => {
    h.commit((d) => {
      d.title = 'A'
    })
    h.undo()
    expect(h.canRedo.value).toBe(true)
    h.reset()
    expect(h.canUndo.value).toBe(false)
    expect(h.canRedo.value).toBe(false)
  })

  it('empty commit does not touch history', () => {
    h.commit(() => {})
    expect(h.canUndo.value).toBe(false)
    expect(h.undoSize.value).toBe(0)
  })

  it('atomicity: two changes in one commit → one undo step', () => {
    h.commit((d) => {
      d.title = 'T'
      d.todos.push({ id: 'x', text: 'todo', done: false })
    })
    expect(h.undoSize.value).toBe(1)
    h.undo()
    expect(h.state.value.title).toBe('')
    expect(h.state.value.todos).toEqual([])
  })
})
