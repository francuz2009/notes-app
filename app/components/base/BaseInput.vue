<template>
  <label class="base-input">
    <span v-if="label" class="base-input__label">{{ label }}</span>
    <input
      ref="inputRef"
      class="base-input__control"
      :class="{ 'base-input__control--error': !!error }"
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :autofocus="autofocus"
      :maxlength="maxlength"
      v-bind="$attrs"
      @input="onInput"
      @blur="onBlur"
      @focus="onFocus"
    />
    <span v-if="error" class="base-input__error">{{ error }}</span>
    <span v-else-if="hint" class="base-input__hint">{{ hint }}</span>
  </label>
</template>

<script setup lang="ts">
import { ref } from 'vue'

withDefaults(
  defineProps<{
    modelValue?: string
    label?: string
    hint?: string
    error?: string
    type?: string
    placeholder?: string
    disabled?: boolean
    autofocus?: boolean
    maxlength?: number
  }>(),
  { type: 'text', disabled: false, autofocus: false }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  input: [value: string]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const inputRef = ref<HTMLInputElement | null>(null)

function onInput(e: Event): void {
  const value = (e.target as HTMLInputElement).value
  emit('update:modelValue', value)
  emit('input', value)
}

function onBlur(e: FocusEvent): void {
  emit('blur', e)
}
function onFocus(e: FocusEvent): void {
  emit('focus', e)
}

defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  el: inputRef,
})
</script>

<script lang="ts">
export default { inheritAttrs: false }
</script>

<style scoped lang="scss">
.base-input {
  display: flex;
  flex-direction: column;
  gap: $space-1;
  width: 100%;

  &__label {
    font-size: $font-sm;
    color: $color-muted;
    font-weight: 500;
  }

  &__control {
    width: 100%;
    padding: 8px $space-3;
    border: 1px solid $color-border;
    border-radius: $radius-md;
    background: $color-surface;
    color: $color-text;
    transition:
      border-color 0.15s,
      box-shadow 0.15s;

    &:focus {
      outline: none;
      border-color: $color-primary;
      box-shadow: 0 0 0 3px rgba($color-focus, 0.35);
    }

    &:disabled {
      background: $color-bg;
      cursor: not-allowed;
    }

    &--error {
      border-color: $color-danger;
      &:focus {
        box-shadow: 0 0 0 3px rgba($color-danger, 0.2);
      }
    }
  }

  &__hint {
    font-size: $font-sm;
    color: $color-muted;
  }
  &__error {
    font-size: $font-sm;
    color: $color-danger;
  }
}
</style>
