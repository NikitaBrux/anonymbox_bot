const BASE = import.meta.env.VITE_BACKEND_URL ?? '/api'

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? 'Request failed')
  }
  return res.json()
}

export interface Session {
  id: string
  title: string
  created_by: string
  closes_at: string
  is_active: boolean
  created_at: string
}

export interface Question {
  id: string
  session_id: string
  text: string
  votes_count: number
  is_hidden: boolean
  is_answered: boolean
  created_at: string
  user_voted?: boolean
}

export const api = {
  createSession: (body: { title: string; durationMinutes: number; telegramUserId: string }) =>
    request<Session>('POST', '/sessions', body),

  listSessions: (telegramUserId: string) =>
    request<Session[]>('GET', `/sessions?telegramUserId=${encodeURIComponent(telegramUserId)}`),

  getSession: (id: string) =>
    request<Session>('GET', `/sessions/${id}`),

  toggleSession: (id: string, body: { is_active: boolean; telegramUserId: string }) =>
    request<Session>('PATCH', `/sessions/${id}/toggle`, body),

  listQuestions: (sessionId: string, telegramUserId?: string) => {
    const qs = telegramUserId ? `?telegramUserId=${encodeURIComponent(telegramUserId)}` : ''
    return request<Question[]>('GET', `/sessions/${sessionId}/questions${qs}`)
  },

  submitQuestion: (sessionId: string, body: { text: string; telegramUserId: string }) =>
    request<Question>('POST', `/sessions/${sessionId}/questions`, body),

  vote: (sessionId: string, questionId: string, telegramUserId: string) =>
    request<Question>('POST', `/sessions/${sessionId}/questions/${questionId}/vote`, { telegramUserId }),

  markAnswered: (sessionId: string, questionId: string, body: { is_answered: boolean; telegramUserId: string }) =>
    request<Question>('PATCH', `/sessions/${sessionId}/questions/${questionId}/answered`, body),

  hideQuestion: (sessionId: string, questionId: string, body: { is_hidden: boolean; telegramUserId: string }) =>
    request<Question>('PATCH', `/sessions/${sessionId}/questions/${questionId}/hide`, body),
}
