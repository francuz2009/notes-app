<template>
  <div v-if="session && note" class="edit-page">
    <header class="edit-page__header">
      <BaseButton variant="ghost" @click="session.cancel()"
        >← К заметкам</BaseButton
      >
      <div class="edit-page__actions">
        <BaseButton
          variant="ghost"
          :disabled="!canUndo"
          title="Отменить (Ctrl+Z)"
          @click="session.undo()"
        >
          ↶ Отменить
        </BaseButton>
        <BaseButton
          variant="ghost"
          :disabled="!canRedo"
          title="Повторить (Shift+Ctrl+Z)"
          @click="session.redo()"
        >
          ↷ Повторить
        </BaseButton>
        <BaseButton variant="danger" @click="session.remove()"
          >Удалить</BaseButton
        >
        <BaseButton variant="secondary" @click="session.cancel()"
          >Отмена</BaseButton
        >
        <BaseButton :disabled="!canSave" @click="session.save()"
          >Сохранить</BaseButton
        >
      </div>
    </header>

    <main class="edit-page__body">
      <BaseInput
        label="Название заметки"
        :model-value="note.title"
        placeholder="Например, «Планы на неделю»"
        :maxlength="200"
        autofocus
        @input="onTitleInput"
        @blur="onTitleBlur"
      />

      <section class="edit-page__todos">
        <div class="edit-page__todos-header">
          <h2>Пункты</h2>
          <BaseButton size="sm" @click="session.addTodo()"
            >+ Добавить пункт</BaseButton
          >
        </div>

        <p v-if="!note.todos.length" class="edit-page__empty">
          Пунктов пока нет. Добавьте первый.
        </p>

        <ul v-else class="edit-page__todos-list">
          <li v-for="todo in note.todos" :key="todo.id">
            <TodoRowEdit :todo="todo" />
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useModal } from '~/composables/useModal'
import { useEditNoteSession } from '~/composables/useEditNoteSession'
import { useDebouncedField } from '~/composables/useDebouncedField'

const route = useRoute()
const router = useRouter()
const modal = useModal()

const noteId = route.params.id as string

useHead({ title: 'Редактирование заметки' })

const session = useEditNoteSession(noteId)

onMounted(async () => {
  if (session) return
  await modal.confirm({
    title: 'Заметка не найдена',
    text: 'Возможно, она была удалена или ссылка неверна.',
    confirmLabel: 'К заметкам',
    cancelLabel: 'К заметкам',
    variant: 'primary',
  })
  await router.replace('/')
})

if (session) {
  watch(session.isDeletedElsewhere, async (deleted) => {
    if (!deleted) return
    await modal.confirm({
      title: 'Заметка удалена',
      text: 'Эта заметка была удалена в другой вкладке. Сохранить изменения нельзя.',
      confirmLabel: 'Перейти к заметкам',
      cancelLabel: 'Перейти к заметкам',
      variant: 'primary',
    })
    await router.replace('/')
  })
}

const note = computed(() => session?.note.value ?? null)
const canSave = computed(() => session?.canSave.value ?? false)
const canUndo = computed(() => session?.canUndo.value ?? false)
const canRedo = computed(() => session?.canRedo.value ?? false)

const titleField = useDebouncedField({
  commit: (value) => session?.commitTitle(value),
  delay: 600,
})

const unregister = session?.registerFieldFlush(() => titleField.flush())
onBeforeUnmount(() => unregister?.())

function onTitleInput(value: string): void {
  titleField.onInput(value)
}

function onTitleBlur(): void {
  titleField.onBlur()
}
</script>

<style scoped lang="scss">
.edit-page {
  max-width: 760px;
  margin: 0 auto;
  padding: $space-5 $space-4 $space-6;

  &__header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: $space-3;
    margin-bottom: $space-5;
    padding-bottom: $space-4;
    border-bottom: 1px solid $color-border;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: $space-2;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: $space-5;
  }

  &__todos {
    display: flex;
    flex-direction: column;
    gap: $space-3;
    padding: $space-4;
    background: $color-surface;
    border: 1px solid $color-border;
    border-radius: $radius-lg;
  }

  &__todos-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h2 {
      margin: 0;
      font-size: $font-lg;
      font-weight: 600;
    }
  }

  &__empty {
    color: $color-muted;
    font-style: italic;
    margin: $space-2 0;
  }

  &__todos-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: $space-1;
  }
}

@media (max-width: $bp-mobile) {
  .edit-page__header {
    flex-direction: column;
    align-items: stretch;
  }
  .edit-page__actions {
    justify-content: space-around;
  }
}
</style>
