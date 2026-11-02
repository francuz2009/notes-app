import type { PersistedState } from '~/types/storage'
import { SCHEMA_VERSION } from '~/types/storage'

type RawState = Record<string, unknown>
type Migration = (raw: RawState) => RawState

const migrations: Record<number, Migration> = {}

export function migrate(raw: unknown): PersistedState | null {
  if (!raw || typeof raw !== 'object') return null

  let data = raw as RawState
  let version = typeof data.schemaVersion === 'number' ? data.schemaVersion : 0

  while (version < SCHEMA_VERSION) {
    const m = migrations[version]
    if (!m) return null
    data = m(data)
    version++
  }

  return data.schemaVersion === SCHEMA_VERSION
    ? (data as unknown as PersistedState)
    : null
}
