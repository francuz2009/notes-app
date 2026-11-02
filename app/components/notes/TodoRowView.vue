<template>
  <label class="todo-view">
    <input type="checkbox" :checked="todo.done" disabled />
    <span
      class="todo-view__text"
      :class="{ 'todo-view__text--done': todo.done }"
    >
      {{ todo.text || '—' }}
    </span>
  </label>
</template>

<script setup lang="ts">
import type { TodoItem } from '~/types'

defineProps<{ todo: TodoItem }>()
</script>

<style scoped lang="scss">
.todo-view {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: 2px 0;
  cursor: default;

  input {
    width: 16px;
    height: 16px;
    accent-color: $color-primary;
    flex-shrink: 0;
  }

  &__text {
    color: $color-text;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &--done {
      color: $color-muted;
      text-decoration: line-through;
    }
  }
}
</style>
