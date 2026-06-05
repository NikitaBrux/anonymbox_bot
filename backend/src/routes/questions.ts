import type { FastifyInstance } from 'fastify'
import { pool } from '../db/pool.js'
import { makeFingerprint } from '../lib/fingerprint.js'
import { broadcast } from '../ws/manager.js'

export async function questionsRoutes(app: FastifyInstance) {
  // Submit question
  app.post<{
    Params: { sessionId: string }
    Body: { text: string; telegramUserId: string }
  }>('/sessions/:sessionId/questions', async (req, reply) => {
    const { text, telegramUserId } = req.body
    const { sessionId } = req.params

    if (!text?.trim() || !telegramUserId) {
      return reply.status(400).send({ error: 'Missing fields' })
    }

    const { rows: [session] } = await pool.query(
      `SELECT is_active, closes_at FROM sessions WHERE id = $1`,
      [sessionId],
    )
    if (!session) return reply.status(404).send({ error: 'Session not found' })
    if (!session.is_active || new Date(session.closes_at) < new Date()) {
      return reply.status(403).send({ error: 'Session is closed' })
    }

    const { rows } = await pool.query(
      `INSERT INTO questions (session_id, text) VALUES ($1, $2) RETURNING *`,
      [sessionId, text.trim()],
    )
    const question = rows[0]

    broadcast(sessionId, { type: 'question_added', question })
    return question
  })

  // List questions in session
  app.get<{
    Params: { sessionId: string }
    Querystring: { telegramUserId?: string }
  }>('/sessions/:sessionId/questions', async (req, reply) => {
    const { sessionId } = req.params
    const { telegramUserId } = req.query

    const { rows } = await pool.query(
      `SELECT * FROM questions WHERE session_id = $1 AND is_hidden = false ORDER BY votes_count DESC, created_at ASC`,
      [sessionId],
    )

    if (telegramUserId) {
      const fp = makeFingerprint(String(telegramUserId), sessionId)
      const { rows: voted } = await pool.query(
        `SELECT question_id FROM votes WHERE voter_fingerprint = $1`,
        [fp],
      )
      const votedSet = new Set(voted.map((v: { question_id: string }) => v.question_id))
      return rows.map((q: Record<string, unknown>) => ({ ...q, user_voted: votedSet.has(q.id as string) }))
    }

    return rows
  })

  // Upvote question
  app.post<{
    Params: { sessionId: string; questionId: string }
    Body: { telegramUserId: string }
  }>('/sessions/:sessionId/questions/:questionId/vote', async (req, reply) => {
    const { sessionId, questionId } = req.params
    const { telegramUserId } = req.body

    if (!telegramUserId) return reply.status(400).send({ error: 'Missing telegramUserId' })

    const fp = makeFingerprint(String(telegramUserId), sessionId)

    try {
      await pool.query(
        `INSERT INTO votes (question_id, voter_fingerprint) VALUES ($1, $2)`,
        [questionId, fp],
      )
    } catch (e: unknown) {
      const err = e as { code?: string }
      if (err.code === '23505') {
        // unique violation — already voted, allow unvote
        await pool.query(
          `DELETE FROM votes WHERE question_id = $1 AND voter_fingerprint = $2`,
          [questionId, fp],
        )
        const { rows } = await pool.query(
          `UPDATE questions SET votes_count = votes_count - 1 WHERE id = $1 RETURNING *`,
          [questionId],
        )
        broadcast(sessionId, { type: 'question_updated', question: rows[0] })
        return { ...rows[0], user_voted: false }
      }
      throw e
    }

    const { rows } = await pool.query(
      `UPDATE questions SET votes_count = votes_count + 1 WHERE id = $1 RETURNING *`,
      [questionId],
    )
    broadcast(sessionId, { type: 'question_updated', question: rows[0] })
    return { ...rows[0], user_voted: true }
  })

  // Mark answered (organizer only)
  app.patch<{
    Params: { sessionId: string; questionId: string }
    Body: { is_answered: boolean; telegramUserId: string }
  }>('/sessions/:sessionId/questions/:questionId/answered', async (req, reply) => {
    const { sessionId, questionId } = req.params
    const { is_answered, telegramUserId } = req.body

    const { rows: [session] } = await pool.query(
      `SELECT created_by FROM sessions WHERE id = $1`,
      [sessionId],
    )
    if (!session) return reply.status(404).send({ error: 'Session not found' })
    if (session.created_by !== String(telegramUserId)) {
      return reply.status(403).send({ error: 'Forbidden' })
    }

    const { rows } = await pool.query(
      `UPDATE questions SET is_answered = $1 WHERE id = $2 RETURNING *`,
      [is_answered, questionId],
    )
    broadcast(sessionId, { type: 'question_updated', question: rows[0] })
    return rows[0]
  })

  // Hide question (organizer only)
  app.patch<{
    Params: { sessionId: string; questionId: string }
    Body: { is_hidden: boolean; telegramUserId: string }
  }>('/sessions/:sessionId/questions/:questionId/hide', async (req, reply) => {
    const { sessionId, questionId } = req.params
    const { is_hidden, telegramUserId } = req.body

    const { rows: [session] } = await pool.query(
      `SELECT created_by FROM sessions WHERE id = $1`,
      [sessionId],
    )
    if (!session) return reply.status(404).send({ error: 'Session not found' })
    if (session.created_by !== String(telegramUserId)) {
      return reply.status(403).send({ error: 'Forbidden' })
    }

    const { rows } = await pool.query(
      `UPDATE questions SET is_hidden = $1 WHERE id = $2 RETURNING *`,
      [is_hidden, questionId],
    )
    broadcast(sessionId, { type: 'question_updated', question: rows[0] })
    return rows[0]
  })
}
