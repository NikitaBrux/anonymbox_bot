import type { FastifyInstance } from 'fastify'
import { pool } from '../db/pool.js'

export async function sessionsRoutes(app: FastifyInstance) {
  // Create session
  app.post<{
    Body: { title: string; durationMinutes: number; telegramUserId: string }
  }>('/sessions', async (req, reply) => {
    const { title, durationMinutes, telegramUserId } = req.body
    if (!title || !durationMinutes || !telegramUserId) {
      return reply.status(400).send({ error: 'Missing fields' })
    }
    const closesAt = new Date(Date.now() + durationMinutes * 60_000)
    const { rows } = await pool.query(
      `INSERT INTO sessions (title, created_by, closes_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title, String(telegramUserId), closesAt],
    )
    return rows[0]
  })

  // List sessions by user
  app.get<{ Querystring: { telegramUserId: string } }>(
    '/sessions',
    async (req, reply) => {
      const { telegramUserId } = req.query
      if (!telegramUserId) return reply.status(400).send({ error: 'Missing telegramUserId' })
      const { rows } = await pool.query(
        `SELECT * FROM sessions WHERE created_by = $1 ORDER BY created_at DESC LIMIT 20`,
        [String(telegramUserId)],
      )
      return rows
    },
  )

  // Get single session
  app.get<{ Params: { id: string } }>('/sessions/:id', async (req, reply) => {
    const { rows } = await pool.query(`SELECT * FROM sessions WHERE id = $1`, [req.params.id])
    if (!rows[0]) return reply.status(404).send({ error: 'Not found' })

    // Auto-close if past closes_at
    const session = rows[0]
    if (session.is_active && new Date(session.closes_at) < new Date()) {
      await pool.query(`UPDATE sessions SET is_active = false WHERE id = $1`, [session.id])
      session.is_active = false
    }
    return session
  })

  // Toggle active (organizer only)
  app.patch<{
    Params: { id: string }
    Body: { is_active: boolean; telegramUserId: string }
  }>('/sessions/:id/toggle', async (req, reply) => {
    const { is_active, telegramUserId } = req.body
    const { rows: check } = await pool.query(
      `SELECT created_by FROM sessions WHERE id = $1`,
      [req.params.id],
    )
    if (!check[0]) return reply.status(404).send({ error: 'Not found' })
    if (check[0].created_by !== String(telegramUserId)) {
      return reply.status(403).send({ error: 'Forbidden' })
    }
    const { rows } = await pool.query(
      `UPDATE sessions SET is_active = $1 WHERE id = $2 RETURNING *`,
      [is_active, req.params.id],
    )
    return rows[0]
  })
}
