import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, type Session } from '../lib/api'
import { useQuestions } from '../hooks/useQuestions'
import { QuestionCard } from '../components/QuestionCard'
import { SessionBadge } from '../components/SessionBadge'
import { Spinner } from '../components/Spinner'
import { haptic } from '../lib/tg'
import { useLang } from '../lib/LangContext'

export function AudienceScreen() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { t } = useLang()
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const { questions, loading, vote, submit } = useQuestions(sessionId!)

  useEffect(() => {
    api.getSession(sessionId!).then(setSession).finally(() => setSessionLoading(false))
  }, [sessionId])

  const isClosed = session && (!session.is_active || new Date(session.closes_at) < new Date())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || submitting) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await submit(text.trim())
      setText('')
      setSuccessMsg(t('questionSubmitted'))
      haptic('success')
      setTimeout(() => setSuccessMsg(''), 2500)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit')
      haptic('error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVote(id: string) {
    haptic('light')
    await vote(id)
  }

  if (sessionLoading) return <Spinner />

  return (
    <div className="min-h-screen bg-tg-bg flex flex-col">
      <div className="px-4 pt-6 pb-4 flex-shrink-0">
        <button onClick={() => navigate('/')} className="text-tg-link text-sm mb-3 block">{t('backHome')}</button>
        <div className="flex items-start gap-2 justify-between">
          <h1 className="text-xl font-bold text-tg-text flex-1 leading-snug">{session?.title}</h1>
          {session && <SessionBadge session={session} />}
        </div>
      </div>

      {!isClosed && (
        <div className="px-4 pb-4 flex-shrink-0">
          <form onSubmit={handleSubmit}>
            <div className="bg-tg-secondary rounded-2xl p-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('askAnon')}
                rows={3}
                maxLength={500}
                className="w-full bg-transparent text-tg-text placeholder:text-tg-hint resize-none outline-none text-sm leading-relaxed"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-tg-hint">{text.length}/500</span>
                <button
                  type="submit"
                  disabled={!text.trim() || submitting}
                  className="px-5 py-2 bg-tg-button text-tg-button-text rounded-xl text-sm font-semibold disabled:opacity-50 active:scale-95 transition-transform"
                >
                  {submitting ? t('submitting') : t('submit')}
                </button>
              </div>
            </div>
            {submitError && <p className="text-red-500 text-xs mt-2">{submitError}</p>}
            {successMsg && <p className="text-green-600 text-xs mt-2">✓ {successMsg}</p>}
          </form>
        </div>
      )}

      {isClosed && (
        <div className="mx-4 mb-4 bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-500 text-center">
          {t('sessionClosed')}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <p className="text-xs font-semibold text-tg-hint uppercase tracking-wide mb-3">
          {questions.length} {questions.length === 1 ? t('question') : t('questions')} · {t('sortedByVotes')}
        </p>

        {loading ? (
          <Spinner />
        ) : questions.length === 0 ? (
          <div className="text-center py-12 text-tg-hint">
            <p className="text-4xl mb-3">🙋</p>
            <p>{t('beFirst')}</p>
          </div>
        ) : (
          questions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              onVote={isClosed ? undefined : handleVote}
            />
          ))
        )}
      </div>
    </div>
  )
}
