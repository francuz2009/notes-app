import { describe, it, expect } from 'vitest'
import { migrate } from '../migrations'
import { SCHEMA_VERSION } from '~/types/storage'

describe('migrate', () => {
  it('passes through current version', () => {
    const data = { schemaVersion: SCHEMA_VERSION, notes: [] }
    expect(migrate(data)).toEqual(data)
  })

  it('returns null for future version', () => {
    expect(migrate({ schemaVersion: SCHEMA_VERSION + 1, notes: [] })).toBeNull()
  })

  it('returns null for broken input', () => {
    expect(migrate(null)).toBeNull()
    expect(migrate(42)).toBeNull()
    expect(migrate('string')).toBeNull()
  })

  it('returns null for unknown old version (no migration registered)', () => {
    expect(migrate({ schemaVersion: 0, notes: [] })).toBeNull()
  })
})
