export type CrossTabMessage =
  { type: 'note-updated'; id: string } | { type: 'note-deleted'; id: string }

const CHANNEL_NAME = 'notes-app'
const handlers = new Set<(msg: CrossTabMessage) => void>()
let channel: BroadcastChannel | null = null

function ensureChannel(): BroadcastChannel | null {
  if (channel) return channel
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
    return null
  }
  channel = new BroadcastChannel(CHANNEL_NAME)
  channel.onmessage = (e: MessageEvent<CrossTabMessage>) => {
    for (const h of handlers) h(e.data)
  }
  return channel
}

export function useCrossTab() {
  const ch = ensureChannel()

  function send(msg: CrossTabMessage): void {
    ch?.postMessage(msg)
  }

  function on(handler: (msg: CrossTabMessage) => void): () => void {
    handlers.add(handler)
    return () => {
      handlers.delete(handler)
    }
  }

  return { send, on }
}
