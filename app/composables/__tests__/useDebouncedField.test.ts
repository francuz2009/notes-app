import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useDebouncedField } from '../useDebouncedField'

describe('useDebouncedField', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  function setup(delay = 600) {
    const commits: string[] = []
    const f = useDebouncedField({
      commit: (v) => commits.push(v),
      delay,
    })
    return { f, commits }
  }

  it('coalesces consecutive inputs into one commit (last value)', () => {
    const { f, commits } = setup()
    f.onInput('a')
    vi.advanceTimersByTime(200)
    f.onInput('ab')
    vi.advanceTimersByTime(200)
    f.onInput('abc')
    vi.advanceTimersByTime(600)
    expect(commits).toEqual(['abc'])
  })

  it('blur commits immediately and cancels the timer', () => {
    const { f, commits } = setup()
    f.onInput('hello')
    f.onBlur()
    expect(commits).toEqual(['hello'])
    vi.advanceTimersByTime(600)
    expect(commits).toEqual(['hello'])
  })

  it('flush forces commit', () => {
    const { f, commits } = setup()
    f.onInput('x')
    f.flush()
    expect(commits).toEqual(['x'])
    vi.advanceTimersByTime(600)
    expect(commits).toEqual(['x'])
  })

  it('blur without any input does not commit', () => {
    const { f, commits } = setup()
    f.onBlur()
    expect(commits).toEqual([])
  })

  it('cancel drops pending buffer', () => {
    const { f, commits } = setup()
    f.onInput('tmp')
    f.cancel()
    vi.advanceTimersByTime(600)
    f.onBlur()
    expect(commits).toEqual([])
  })
})
