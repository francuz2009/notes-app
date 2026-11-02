<template>
  <Transition name="modal-fade">
    <div
      v-if="open"
      class="modal-backdrop"
      @click="onBackdropClick"
      @mousedown.self.prevent
    >
      <div
        ref="dialogRef"
        class="modal"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        tabindex="-1"
      >
        <header v-if="title || $slots.title" class="modal__header">
          <h2 v-if="$slots.title" class="modal__title">
            <slot name="title" />
          </h2>
          <h2 v-else class="modal__title">{{ title }}</h2>
          <button
            type="button"
            class="modal__close"
            aria-label="Закрыть"
            @click="emit('close')"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div class="modal__body"><slot /></div>
        <footer v-if="$slots.footer" class="modal__footer">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    closeOnBackdrop?: boolean
    closeOnEsc?: boolean
    focusKey?: string | number
  }>(),
  { closeOnBackdrop: true, closeOnEsc: true }
)

const emit = defineEmits<{ close: [] }>()

const dialogRef = ref<HTMLElement | null>(null)
let previouslyFocused: HTMLElement | null = null

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',')

function getFocusable(): HTMLElement[] {
  if (!dialogRef.value) return []
  return Array.from(
    dialogRef.value.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter((el) => el.offsetParent !== null || el === document.activeElement)
}

function focusFirst(): void {
  const list = getFocusable()
  if (list.length > 0) list[0]!.focus()
  else dialogRef.value?.focus()
}

function onKeyDown(e: KeyboardEvent): void {
  if (!props.open) return

  if (e.key === 'Escape' && props.closeOnEsc) {
    e.preventDefault()
    e.stopPropagation()
    emit('close')
    return
  }

  if (e.key !== 'Tab') return

  const list = getFocusable()
  if (list.length === 0) {
    e.preventDefault()
    dialogRef.value?.focus()
    return
  }
  const first = list[0]!
  const last = list[list.length - 1]!
  const active = document.activeElement as HTMLElement | null
  const inside = !!dialogRef.value?.contains(active)

  if (e.shiftKey) {
    if (!inside || active === first) {
      e.preventDefault()
      last.focus()
    }
  } else if (!inside || active === last) {
    e.preventDefault()
    first.focus()
  }
}

function onBackdropClick(e: MouseEvent): void {
  if (!props.closeOnBackdrop) return
  if (e.target !== e.currentTarget) return
  emit('close')
}

watch(
  () => props.open,
  async (isOpen) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    if (isOpen) {
      previouslyFocused = (document.activeElement as HTMLElement | null) ?? null
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', onKeyDown, true)
      await nextTick()
      focusFirst()
    } else {
      window.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = ''
      if (previouslyFocused?.isConnected) previouslyFocused.focus()
      previouslyFocused = null
    }
  },
  { immediate: true }
)

watch(
  () => props.focusKey,
  async () => {
    if (typeof window === 'undefined') return
    if (!props.open) return
    await nextTick()
    focusFirst()
  }
)

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return
  window.removeEventListener('keydown', onKeyDown, true)
  document.body.style.overflow = ''
})
</script>

<style scoped lang="scss">
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
}

.modal {
  width: 100%;
  max-width: 520px;
  max-height: calc(100vh - #{$space-6});
  display: flex;
  flex-direction: column;
  background: $color-surface;
  border-radius: $radius-lg;
  box-shadow: $shadow-md;
  overflow: hidden;

  &:focus {
    outline: none;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: $space-3;
    padding: $space-4 $space-5;
    border-bottom: 1px solid $color-border;
  }

  &__title {
    margin: 0;
    font-size: $font-lg;
    font-weight: 600;
    flex: 1;
  }

  &__close {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    border-radius: $radius-sm;
    font-size: 22px;
    line-height: 1;
    color: $color-muted;
    &:hover {
      background: $color-bg;
    }
  }

  &__body {
    padding: $space-5;
    overflow-y: auto;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: $space-2;
    padding: $space-4 $space-5;
    border-top: 1px solid $color-border;
    background: $color-bg;
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.15s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

@media (max-width: $bp-mobile) {
  .modal-backdrop {
    padding: 0;
    align-items: flex-end;
  }
  .modal {
    border-radius: $radius-lg $radius-lg 0 0;
    max-height: 90vh;
  }
}
</style>
