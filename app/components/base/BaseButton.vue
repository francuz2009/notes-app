<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      'base-btn',
      `base-btn--${variant}`,
      `base-btn--${size}`,
      { 'base-btn--full': fullWidth },
    ]"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md'
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    fullWidth?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
    fullWidth: false,
  }
)
</script>

<style scoped lang="scss">
.base-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  border: 1px solid transparent;
  border-radius: $radius-md;
  font-weight: 500;
  transition:
    background-color 0.15s,
    border-color 0.15s,
    color 0.15s,
    box-shadow 0.15s;
  white-space: nowrap;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--full {
    width: 100%;
  }

  &--md {
    padding: 0 $space-4;
    height: 38px;
    font-size: $font-md;
  }
  &--sm {
    padding: 0 $space-3;
    height: 30px;
    font-size: $font-sm;
  }

  &--primary {
    background: $color-primary;
    color: #fff;
    &:not(:disabled):hover {
      background: $color-primary-hover;
    }
  }

  &--secondary {
    background: $color-surface;
    color: $color-text;
    border-color: $color-border;
    &:not(:disabled):hover {
      background: $color-bg;
    }
  }

  &--ghost {
    background: transparent;
    color: $color-text;
    &:not(:disabled):hover {
      background: rgba(0, 0, 0, 0.05);
    }
  }

  &--danger {
    background: $color-danger;
    color: #fff;
    &:not(:disabled):hover {
      filter: brightness(0.92);
    }
  }
}
</style>
