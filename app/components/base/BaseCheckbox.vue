<template>
  <label class="base-checkbox" :class="{ 'base-checkbox--disabled': disabled }">
    <input
      class="base-checkbox__control"
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      :aria-label="ariaLabel"
      @change="onChange"
    />
    <span v-if="$slots.default" class="base-checkbox__label">
      <slot />
    </span>
  </label>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: boolean
    disabled?: boolean
    ariaLabel?: string
  }>(),
  { disabled: false }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  change: [value: boolean]
}>()

function onChange(e: Event): void {
  const checked = (e.target as HTMLInputElement).checked
  emit('update:modelValue', checked)
  emit('change', checked)
}
</script>

<style scoped lang="scss">
.base-checkbox {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  cursor: pointer;
  user-select: none;

  &--disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &__control {
    width: 18px;
    height: 18px;
    accent-color: $color-primary;
    cursor: inherit;
    flex-shrink: 0;

    &:focus-visible {
      outline: 2px solid $color-focus;
      outline-offset: 2px;
    }
  }

  &__label {
    line-height: 1.4;
  }
}
</style>
