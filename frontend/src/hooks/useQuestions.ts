import { useEffect, useState, useCallback } from 'react'
import { api, type Question } from '../lib/api'
import { connectWs } from '../lib/ws'
import { getTelegramUserId } from '../lib/tg'

export function useQuestions(sessionId: string) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const userId = getTelegramUserId()

  const upsert = useCallback((q: Question) => {
    setQuestions((prev) => {
      const idx = prev.findIndex((x) => x.id === q.id)
      if (idx === -1) return [q, ...prev]
      const next = [...prev]
      next[idx] = q
      // Re-sort by votes desc
      return next.sort((a, b) => b.votes_count - a.votes_count || new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    })
  }, [])

  useEffect(() => {
    let alive = true

    api.listQuestions(sessionId, userId).then((qs) => {
      if (alive) {
        setQuestions(qs)
        setLoading(false)
      }
    }).catch(() => setLoading(false))

    const disconnect = connectWs(sessionId, (msg) => {
      if (!alive) return
      if (msg.type === 'question_added' || msg.type === 'question_updated') {
        upsert(msg.question)
      }
    })

    return () => {
      alive = false
      disconnect()
    }
  }, [sessionId, userId, upsert])

  const vote = useCallback(async (questionId: string) => {
    const updated = await api.vote(sessionId, questionId, userId)
    upsert(updated)
    return updated
  }, [sessionId, userId, upsert])

  const submit = useCallback(async (text: string) => {
    const q = await api.submitQuestion(sessionId, { text, telegramUserId: userId })
    upsert(q)
    return q
  }, [sessionId, userId, upsert])

  const markAnswered = useCallback(async (questionId: string, is_answered: boolean) => {
    const q = await api.markAnswered(sessionId, questionId, { is_answered, telegramUserId: userId })
    upsert(q)
  }, [sessionId, userId, upsert])

  const hideQuestion = useCallback(async (questionId: string, is_hidden: boolean) => {
    const q = await api.hideQuestion(sessionId, questionId, { is_hidden, telegramUserId: userId })
    upsert(q)
  }, [sessionId, userId, upsert])

  // Filter out hidden for audience, keep for speaker
  const visibleQuestions = questions.filter((q) => !q.is_hidden)

  return { questions: visibleQuestions, allQuestions: questions, loading, vote, submit, markAnswered, hideQuestion }
}
