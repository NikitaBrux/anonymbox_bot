import type { WebSocket } from 'ws'

// sessionId -> Set of connected sockets
const sessions = new Map<string, Set<WebSocket>>()

export function subscribe(sessionId: string, ws: WebSocket) {
  if (!sessions.has(sessionId)) sessions.set(sessionId, new Set())
  sessions.get(sessionId)!.add(ws)
  ws.on('close', () => unsubscribe(sessionId, ws))
}

export function unsubscribe(sessionId: string, ws: WebSocket) {
  sessions.get(sessionId)?.delete(ws)
}

export function broadcast(sessionId: string, payload: unknown) {
  const sockets = sessions.get(sessionId)
  if (!sockets) return
  const msg = JSON.stringify(payload)
  for (const ws of sockets) {
    if (ws.readyState === 1 /* OPEN */) ws.send(msg)
  }
}
