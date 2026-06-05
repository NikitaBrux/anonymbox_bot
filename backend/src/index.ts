import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import websocketPlugin from '@fastify/websocket'
import { migrate } from './db/migrate.js'
import { sessionsRoutes } from './routes/sessions.js'
import { questionsRoutes } from './routes/questions.js'
import { subscribe } from './ws/manager.js'

const app = Fastify({ logger: true })

await app.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
})

await app.register(websocketPlugin)

// WebSocket endpoint: /ws/:sessionId
app.get('/ws/:sessionId', { websocket: true }, (socket, req) => {
  const { sessionId } = req.params as { sessionId: string }
  subscribe(sessionId, socket)
  socket.send(JSON.stringify({ type: 'connected', sessionId }))
})

await app.register(sessionsRoutes)
await app.register(questionsRoutes)

app.get('/health', async () => ({ ok: true }))

// Run migration then start
await migrate()

const port = Number(process.env.PORT ?? 3001)
await app.listen({ port, host: '0.0.0.0' })
console.log(`Backend listening on :${port}`)
