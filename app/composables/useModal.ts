import { markRaw, ref, type Component } from 'vue'

export interface ModalConfirmOptions {
  title?: string
  text: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'primary' | 'danger'
}

export interface ModalComponentOptions {
  component: Component
  props?: Record<string, unknown>
  title?: string
  closeOnBackdrop?: boolean
  closeOnEsc?: boolean
}

export type ModalEntry =
  | {
      id: number
      kind: 'confirm'
      title?: string
      options: ModalConfirmOptions
      resolve: (ok: boolean) => void
    }
  | {
      id: number
      kind: 'component'
      title?: string
      component: Component
      props: Record<string, unknown>
      closeOnBackdrop: boolean
      closeOnEsc: boolean
      resolve: (ok: boolean) => void
    }

const stack = ref<ModalEntry[]>([])
let nextId = 1

export function useModal() {
  function top(): ModalEntry | null {
    return stack.value[stack.value.length - 1] ?? null
  }

  function confirm(options: ModalConfirmOptions): Promise<boolean> {
    if (import.meta.server) return Promise.resolve(false)
    return new Promise<boolean>((resolve) => {
      stack.value.push({
        id: nextId++,
        kind: 'confirm',
        title: options.title,
        options,
        resolve,
      })
    })
  }

  function openComponent(opts: ModalComponentOptions): {
    id: number
    result: Promise<boolean>
  } {
    if (import.meta.server) {
      return { id: -1, result: Promise.resolve(false) }
    }
    const id = nextId++
    const result = new Promise<boolean>((resolve) => {
      stack.value.push({
        id,
        kind: 'component',
        title: opts.title,
        component: markRaw(opts.component),
        props: opts.props ?? {},
        closeOnBackdrop: opts.closeOnBackdrop ?? true,
        closeOnEsc: opts.closeOnEsc ?? true,
        resolve,
      })
    })
    return { id, result }
  }

  function close(id?: number, result = false): void {
    const idx =
      id === undefined
        ? stack.value.length - 1
        : stack.value.findIndex((e) => e.id === id)
    if (idx < 0) return
    const [entry] = stack.value.splice(idx, 1)
    entry?.resolve(result)
  }

  function closeAll(): void {
    const entries = stack.value.splice(0)
    for (const e of entries) e.resolve(false)
  }

  return { top, stack, confirm, openComponent, close, closeAll }
}
