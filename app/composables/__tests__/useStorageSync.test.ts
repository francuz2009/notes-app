import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { memoryStorage } from '~/utils/storage/adapter'
import { useStorageSync } from '../useStorageSync'

describe('useStorageSync', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  function setup(initial: { n: number } = { n: 0 }) {
    const state = ref(initial)
    const adapter = memoryStorage()
    const sync = useStorageSync({
      adapter,
      key: 'k',
      state: () => state.value,
      throttleMs: 400,
    })
    return { state, adapter, sync }
  }

  it('does not write before throttleMs elapses', async () => {
    const { state, adapter } = setup()
    state.value.n = 1
    await nextTick()
    expect(adapter.get('k')).toBeNull()
  })

  it('writes once after throttleMs with the latest value', async () => {
    const { state, adapter } = setup()
    state.value.n = 1
    await nextTick()
    vi.advanceTimersByTime(400)
    expect(JSON.parse(adapter.get('k')!)).toEqual({ n: 1 })
  })

  it('coalesces multiple mutations into a single write', async () => {
    const { state, adapter } = setup()
    state.value.n = 1
    await nextTick()
    state.value.n = 2
    await nextTick()
    state.value.n = 3
    await nextTick()
    vi.advanceTimersByTime(400)
    const raw = adapter.get('k')!
    expect(JSON.parse(raw)).toEqual({ n: 3 })
  })

  it('flush writes immediately', async () => {
    const { state, adapter, sync } = setup()
    state.value.n = 42
    await nextTick()
    sync.flush()
    expect(JSON.parse(adapter.get('k')!)).toEqual({ n: 42 })
  })

  it('dispose stops further writes', async () => {
    const { state, adapter, sync } = setup()
    state.value.n = 1
    await nextTick()
    sync.dispose()
    state.value.n = 2
    await nextTick()
    vi.advanceTimersByTime(400)

    expect(JSON.parse(adapter.get('k')!)).toEqual({ n: 1 })
  })

  it('does not throw when adapter.set fails (quota)', async () => {
    const adapter = memoryStorage()
    adapter.set = () => {
      throw new Error('QuotaExceededError')
    }
    const state = ref({ n: 0 })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    useStorageSync({
      adapter,
      key: 'k',
      state: () => state.value,
      throttleMs: 10,
    })
    state.value.n = 1
    await nextTick()
    expect(() => vi.advanceTimersByTime(10)).not.toThrow()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
