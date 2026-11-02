export interface UseDebouncedFieldOptions {
  commit: (value: string) => void
  delay?: number
}

export interface UseDebouncedField {
  onInput: (value: string) => void
  onBlur: () => void
  flush: () => void
  cancel: () => void
}

export function useDebouncedField({
  commit,
  delay = 600,
}: UseDebouncedFieldOptions): UseDebouncedField {
  let timer: ReturnType<typeof setTimeout> | null = null
  let buffer: string | null = null

  function flush(): void {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (buffer !== null) {
      const value = buffer
      buffer = null
      commit(value)
    }
  }

  function onInput(value: string): void {
    buffer = value
    if (timer) clearTimeout(timer)
    timer = setTimeout(flush, delay)
  }

  function onBlur(): void {
    flush()
  }

  function cancel(): void {
    if (timer) clearTimeout(timer)
    timer = null
    buffer = null
  }

  return { onInput, onBlur, flush, cancel }
}
