export const STORAGE_KEYS = {
  state: 'notes-app:state',
  draftPrefix: 'notes-app:draft:',
} as const

export const draftKey = (noteId: string): string =>
  `${STORAGE_KEYS.draftPrefix}${noteId}`
