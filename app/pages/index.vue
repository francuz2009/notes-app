<template>
  <div class="page">
    <header class="page__header">
      <h1 class="page__title">Заметки</h1>
      <BaseButton @click="createNote">+ Новая заметка</BaseButton>
    </header>

    <p v-if="!notes.length" class="page__empty">
      Пока нет ни одной заметки. Создайте первую — и добавьте в неё todo-список.
    </p>

    <ul v-else class="notes-grid">
      <li v-for="note in notes" :key="note.id">
        <NoteCard :note="note" @edit="editNote" @remove="removeNote" />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNotesStore } from '~/stores/notes'
import { useModal } from '~/composables/useModal'

useHead({ title: 'Все заметки' })

const store = useNotesStore()
const router = useRouter()
const modal = useModal()

const notes = computed(() =>
  [...store.notes].sort((a, b) => b.updatedAt - a.updatedAt)
)

function createNote(): void {
  const note = store.createNote()
  router.push(`/notes/${note.id}/edit`)
}

function editNote(id: string): void {
  router.push(`/notes/${id}/edit`)
}

async function removeNote(id: string): Promise<void> {
  const note = store.getNote(id)
  if (!note) return
  const ok = await modal.confirm({
    title: 'Удалить заметку?',
    text: `Заметка «${note.title.trim() || 'Без названия'}» будет удалена без возможности восстановления.`,
    confirmLabel: 'Удалить',
    cancelLabel: 'Отмена',
    variant: 'danger',
  })
  if (ok) store.deleteNote(id)
}
</script>

<style scoped lang="scss">
.page {
  max-width: 960px;
  margin: 0 auto;
  padding: $space-6 $space-4;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: $space-4;
    margin-bottom: $space-5;
  }

  &__title {
    margin: 0;
    font-size: $font-xl;
    font-weight: 700;
  }

  &__empty {
    margin: $space-6 0;
    padding: $space-6;
    text-align: center;
    color: $color-muted;
    background: $color-surface;
    border: 1px dashed $color-border;
    border-radius: $radius-lg;
  }
}

.notes-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: $space-4;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}
</style>
