<template>
  <div class="todo-edit">
    <BaseCheckbox
      :model-value="todo.done"
      :aria-label="todo.done ? 'Снять отметку' : 'Отметить выполненным'"
      @change="session.toggleTodo(todo.id)"
    />
    <input
      ref="inputRef"
      class="todo-edit__input"
      :class="{ 'todo-edit__input--done': todo.done }"
      :value="localText"
      placeholder="Текст пункта"
      maxlength="500"
      @input="onInput"
      @blur="onBlur"
      @keydown.enter.prevent="
        field.flush()
        ;($event.target as HTMLInputElement).blur()
      "
    />
    <BaseButton
      variant="ghost"
      size="sm"
      aria-label="Удалить пункт"
      @click="session.removeTodo(todo.id)"
    >
      ×
    </BaseButton>
  </div>
</template>

<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { TodoItem } from '~/types'
import { EditSessionKey } from '~/composables/useEditNoteSession'
import { useDebouncedField } from '~/composables/useDebouncedField'

const props = defineProps<{ todo: TodoItem }>()

const session = inject(EditSessionKey)
if (!session) {
  throw new Error('TodoRowEdit must be used inside edit note session')
}

const localText = ref(props.todo.text)
const inputRef = ref<HTMLInputElement | null>(null)

const field = useDebouncedField({
  commit: (value) => session.commitTodoText(props.todo.id, value),
  delay: 600,
})

const unregister = session.registerFieldFlush(() => field.flush())

onMounted(() => {
  if (props.todo.text === '' && !props.todo.done) {
    // только что созданный пустой пункт — дадим фокус
    inputRef.value?.focus()
  }
})

onBeforeUnmount(() => {
  unregister()
})

watch(
  () => props.todo.text,
  (v) => {
    if (v !== localText.value) localText.value = v
  }
)

function onInput(e: Event): void {
  const value = (e.target as HTMLInputElement).value
  localText.value = value
  field.onInput(value)
}

function onBlur(): void {
  field.onBlur()
}
</script>

<style scoped lang="scss">
.todo-edit {
  display: flex;
  align-items: center;
  gap: $space-2;

  &__input {
    flex: 1;
    min-width: 0;
    border: 1px solid transparent;
    background: transparent;
    padding: 6px $space-2;
    border-radius: $radius-sm;
    color: $color-text;

    &:hover {
      border-color: $color-border;
    }
    &:focus {
      outline: none;
      border-color: $color-primary;
      background: $color-surface;
    }

    &--done {
      color: $color-muted;
      text-decoration: line-through;
    }
  }
}
</style>
