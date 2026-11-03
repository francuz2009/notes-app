# Notes App — SPA на Nuxt 4 + Pinia + TypeScript

Небольшое SPA для заметок с todo-списками: undo/redo, черновики, кросс-вкладочная
синхронизация, ручная персистентность в localStorage.

## Быстрый запуск

```bash
docker compose up --build
```

### Локально (без Docker)

```bash
npm ci
npm run dev          # http://localhost:3000
npm run test         # vitest
npm run typecheck    # vue-tsc
npm run lint         # eslint
```

Node ≥ 22.22.

## Что умеет

**Главная (`/`)**

- список всех заметок, сортировка по `updatedAt` (свежие сверху);
- превью первых 3 пунктов Todo (read-only);
- создать новую, открыть на редактирование, удалить (с подтверждением).

**Редактор (`/notes/[id]/edit`)**

- заголовок и todo: добавить / удалить / править текст / отметить выполненным;
- сохранить, отменить редактирование (с подтверждением), удалить (с подтверждением);
- **Ctrl+Z / Shift+Ctrl+Z** глобально на странице, работают как undo/redo;
- восстановление черновика при повторном заходе после перезагрузки;
- если заметку удалили во второй вкладке — показывается модалка, редирект на `/`.

## Ключевые технические решения

### История изменений — immer-патчи, а не копии

`useNoteHistory` на каждый `commit` создаёт пару `forward` / `backward` **патчей**
через `produceWithPatches`. Стек — до 50 шагов. Память растёт от **числа правок**,
а не от размера заметки: правка заголовка — это одна запись `{ op: 'replace',
path: ['title'], value: '...' }`, добавление todo — один объект, а не полная `Note`.

- Новый `commit` после `undo` **очищает** redo-ветку (стандартное поведение).
- Пустой `commit` (recipe ничего не меняет) в историю не попадает.
- Один `commit` = одна атомарная запись: два изменения в одном recipe — один undo.

### Дебаунс текстовых полей

`useDebouncedField` объединяет непрерывный ввод в **одну** запись истории:

- пауза 600 мс или `blur` — коммит;
- серия `onInput` за это время даёт один `commit` со **значением последнего** ввода.

Перед `undo` / `save` edit-страница вызывает `session.flushAll()`, что «дожимает»
незакоммиченный ввод в историю. Это гарантирует:

- Ctrl+Z всегда откатывает **цельную** правку, а не «половину буквы»;
- нативный undo внутри `<input>` не срабатывает — глобальный `keydown` на capture-фазе
  с `preventDefault` его глушит.

### Персистентность — вручную, с версией схемы

`useStorageSync` смотрит на состояние через `watch(deep)` и пишет в `localStorage`
не чаще раза в 400 мс. `flush()` вызывается на `visibilitychange`/`beforeunload`.

Хранимое — `{ schemaVersion: 1, notes: [...] }`. При загрузке `migrate()`
прогоняет старые версии через `migrations`, неизвестные будущие — отбрасывает и
стартует с пустого состояния. Схема покрыта юнит-тестами.

### Черновики

При редактировании в `localStorage` пишется `draft:<noteId>` с полями:

- сама `note` (текущее состояние сессии);
- `baseUpdatedAt` — `updatedAt` заметки на момент входа.

При возврате:

- если `baseUpdatedAt !== current.updatedAt` — черновик устарел, предлагать не будем;
- иначе — модалка «Восстановить / Начать заново». Восстановление — **один commit
  в историю**, отменяемый Ctrl+Z.

### Кросс-вкладочность

`useCrossTab` — синглтон на `BroadcastChannel`:

- `save` / `delete` на одной вкладке отправляет `{ type, id }`;
- edit-страница на другой вкладке ловит `note-deleted` и показывает модалку.

Конкурентные правки не мержим — это за рамками задания; при сохранении «последний
победил».

### Модальная система

`BaseModal` — единственный компонент, содержащий focus-trap, Escape, scroll-lock
и возврат фокуса. Один на приложение, рендерится в `BaseModalHost`, реагирует на
top-of-stack из `useModal`.

Вызов — программный:

```ts
const ok = await useModal().confirm({
  title: 'Удалить?',
  text: 'Действие необратимо.',
  confirmLabel: 'Удалить',
  variant: 'danger',
})
if (ok) store.deleteNote(id)
```

Стек модалок поддерживается: confirm поверх кастомной модалки закрывает только
confirm.

### SPA-режим

`ssr: false` — соответствует требованию ТЗ («SPA-приложение»). Побочно снимает
класс ошибок hydration-mismatch, `window is not defined` и т.п.

## Структура

```
app/
  components/
    base/            BaseButton, BaseInput, BaseCheckbox, BaseModal, BaseModalHost
    notes/           NoteCard, TodoRowView, TodoRowEdit
  composables/       useStorageSync, useNoteHistory, useDebouncedField,
                     useEditNoteSession, useCrossTab, useModal
  pages/             index.vue, notes/[id]/edit.vue
  stores/            notes.ts
  types/             index.ts, storage.ts
  utils/
    history/         patches.ts
    storage/         adapter.ts, schema.ts, migrations.ts, drafts.ts
  plugins/           persistence.client.ts
  assets/scss/       _tokens.scss, main.scss
```

## Тесты

```bash
npm run test        # 31 тест, ~0.5 s
```

Покрыто:

- **история** — undo/redo, лимит 50, очистка redo, атомарность, пустые коммиты;
- **patches** — round-trip forward/backward для title и todo add/remove;
- **store** — CRUD, `byId`, `replaceAll`, `updateNote` бампает `updatedAt`;
- **storageSync** — throttle, `flush`, `dispose`, отказ `QuotaExceededError`;
- **migrations** — пасс-сквозь, отказ будущим/битым версиям;
- **debouncedField** — коалесценция, blur, flush, cancel.

Компонентные тесты не пишем — ТЗ их не требует.

## Что осознанно не делаем

- **UI-библиотеки и undo-библиотеки** — запрещены ТЗ.
- **`pinia-plugin-persistedstate`** — синк с `localStorage` реализован вручную.
- **Серверный API / авторизация** — вне рамок задания.
- **Конкурентное слияние правок между вкладками** — последний `save` побеждает.
- **Компонентные тесты** — не требуются, бюджет вложен в юнит-тесты ядра.
