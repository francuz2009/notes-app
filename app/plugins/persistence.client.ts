import { useNotesStore } from '~/stores/notes'
import { browserStorage } from '~/utils/storage/adapter'
import { migrate } from '~/utils/storage/migrations'
import { STORAGE_KEYS } from '~/utils/storage/schema'
import { SCHEMA_VERSION } from '~/types/storage'

export default defineNuxtPlugin(() => {
  const store = useNotesStore()
  const adapter = browserStorage()

  const raw = adapter.get(STORAGE_KEYS.state)
  if (raw) {
    try {
      const migrated = migrate(JSON.parse(raw))
      store.replaceAll(migrated?.notes ?? [])
    } catch {
      store.replaceAll([])
    }
  } else {
    store.replaceAll([])
  }

  useStorageSync({
    adapter,
    key: STORAGE_KEYS.state,
    state: () => ({ schemaVersion: SCHEMA_VERSION, notes: store.notes }),
    throttleMs: 400,
  })
})
