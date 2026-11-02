<template>
  <article
    class="note-card"
    tabindex="0"
    role="button"
    :aria-label="`Открыть заметку ${displayTitle}`"
    @click="emit('edit', note.id)"
    @keydown.enter.prevent="emit('edit', note.id)"
    @keydown.space.prevent="emit('edit', note.id)"
  >
    <header class="note-card__header">
      <h3 class="note-card__title">{{ displayTitle }}</h3>
      <span class="note-card__stats">
        {{ doneCount }}/{{ note.todos.length }}
      </span>
    </header>

    <ul v-if="visibleTodos.length" class="note-card__todos">
      <li v-for="t in visibleTodos" :key="t.id">
        <TodoRowView :todo="t" />
      </li>
    </ul>
    <p v-else class="note-card__empty">Пунктов нет</p>

    <p v-if="hiddenCount" class="note-card__more">ещё {{ hiddenCount }}…</p>

    <footer class="note-card__actions" @click.stop>
      <BaseButton
        variant="ghost"
        size="sm"
        aria-label="Редактировать заметку"
        @click="emit('edit', note.id)"
      >
        Изменить
      </BaseButton>
      <BaseButton
        variant="ghost"
        size="sm"
        aria-label="Удалить заметку"
        @click="emit('remove', note.id)"
      >
        Удалить
      </BaseButton>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Note } from '~/types'

const props = defineProps<{
  note: Note
  previewLimit?: number
}>()

const emit = defineEmits<{
  edit: [id: string]
  remove: [id: string]
}>()

const limit = computed(() => props.previewLimit ?? 3)
const visibleTodos = computed(() => props.note.todos.slice(0, limit.value))
const hiddenCount = computed(() =>
  Math.max(0, props.note.todos.length - limit.value)
)
const doneCount = computed(() => props.note.todos.filter((t) => t.done).length)
const displayTitle = computed(() => props.note.title.trim() || 'Без названия')
</script>

<style scoped lang="scss">
.note-card {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding: $space-4;
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  cursor: pointer;
  transition:
    box-shadow 0.15s,
    border-color 0.15s;

  &:hover {
    box-shadow: $shadow-md;
    border-color: darken($color-border, 4%);
  }
  &:focus-visible {
    outline: 2px solid $color-focus;
    outline-offset: 2px;
  }

  &__header {
    display: flex;
    align-items: baseline;
    gap: $space-3;
  }

  &__title {
    margin: 0;
    font-size: $font-lg;
    font-weight: 600;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__stats {
    font-size: $font-sm;
    color: $color-muted;
    flex-shrink: 0;
  }

  &__todos {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__empty {
    margin: 0;
    color: $color-muted;
    font-size: $font-sm;
    font-style: italic;
  }

  &__more {
    margin: 0;
    color: $color-muted;
    font-size: $font-sm;
  }

  &__actions {
    display: flex;
    gap: $space-1;
    justify-content: flex-end;
    border-top: 1px solid $color-border;
    padding-top: $space-3;
    margin-top: auto;
  }
}
</style>
