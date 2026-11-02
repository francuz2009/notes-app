import { watch, type WatchStopHandle } from 'vue'
import type { StorageAdapter } from '~/utils/storage/adapter'

export interface UseStorageSyncOptions {
  adapter: StorageAdapter
  key: string
  state: () => unknown
  throttleMs?: number
}

export interface UseStorageSync {
  flush: () => void
  dispose: () => void
}

export function useStorageSync(opts: UseStorageSyncOptions): UseStorageSync {
  const { adapter, key, state, throttleMs = 400 } = opts

  let timer: ReturnType<typeof setTimeout> | null = null
  let pending = false
  let disposed = false

  function write(): void {
    if (disposed) return
    timer = null
    pending = false
    try {
      adapter.set(key, JSON.stringify(state()))
    } catch (e) {
      console.warn('[useStorageSync] write failed', e)
    }
  }

  function schedule(): void {
    if (disposed) return
    pending = true
    if (timer) return
    timer = setTimeout(write, throttleMs)
  }

  function flush(): void {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (pending) write()
  }

  const stopWatch: WatchStopHandle = watch(state, schedule, { deep: true })

  let removeListeners = (): void => {}

  if (typeof window !== 'undefined') {
    const onVisibility = (): void => {
      if (document.visibilityState === 'hidden') flush()
    }
    const onUnload = (): void => flush()
    window.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('beforeunload', onUnload)
    removeListeners = () => {
      window.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('beforeunload', onUnload)
    }
  }

  function dispose(): void {
    flush()
    disposed = true
    stopWatch()
    removeListeners()
  }

  return { flush, dispose }
}
