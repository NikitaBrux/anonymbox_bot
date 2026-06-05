const WS_BASE = (() => {
  const backend = import.meta.env.VITE_BACKEND_URL as string | undefined
  if (backend) return backend.replace(/^http/, 'ws')
  // Same origin, switch protocol
  return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api`
})()

export type WsMessage =
  | { type: 'connected'; sessionId: string }
  | { type: 'question_added'; question: import('./api').Question }
  | { type: 'question_updated'; question: import('./api').Question }

export function connectWs(
  sessionId: string,
  onMessage: (msg: WsMessage) => void,
): () => void {
  let ws: WebSocket | null = null
  let closed = false
  let retryTimeout: ReturnType<typeof setTimeout>

  function connect() {
    if (closed) return
    ws = new WebSocket(`${WS_BASE}/ws/${sessionId}`)

    ws.onmessage = (e) => {
      try {
        onMessage(JSON.parse(e.data))
      } catch {
        // ignore malformed
      }
    }

    ws.onclose = () => {
      if (!closed) retryTimeout = setTimeout(connect, 3000)
    }

    ws.onerror = () => ws?.close()
  }

  connect()

  return () => {
    closed = true
    clearTimeout(retryTimeout)
    ws?.close()
  }
}
