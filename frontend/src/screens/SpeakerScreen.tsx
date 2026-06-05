import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, type Session } from '../lib/api'
import { useQuestions } from '../hooks/useQuestions'
import { QuestionCard } from '../components/QuestionCard'
import { SessionBadge } from '../components/SessionBadge'
import { Spinner } from '../components/Spinner'
import { getTelegramUserId, haptic } from '../lib/tg'
import { useLang } from '../lib/LangContext'

export function SpeakerScreen() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { t } = useLang()
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  const { allQuestions, loading, markAnswered, hideQuestion } = useQuestions(sessionId!)
  const userId = getTelegramUserId()

  useEffect(() => {
    api.getSession(sessionId!).then(setSession).finally(() => setSessionLoading(false))
  }, [sessionId])

  useEffect(() => {
    if (session && session.created_by !== userId) {
      navigate(`/session/${sessionId}`, { replace: true })
    }
  }, [session, userId, sessionId, navigate])

  async function toggleSession() {
    if (!session) return
    setToggling(true)
    try {
      const updated = await api.toggleSession(session.id, {
        is_active: !session.is_active,
        telegramUserId: userId,
      })
      setSession(updated)
      haptic('medium')
    } finally {
      setToggling(false)
    }
  }

  if (sessionLoading) return <Spinner />

  const isClosed = session && (!session.is_active || new Date(session.closes_at) < new Date())
  const unanswered = allQuestions.filter((q) => !q.is_answered && !q.is_hidden)
  const answered = allQuestions.filter((q) => q.is_answered)

  return (
    <div className="min-h-screen bg-tg-bg flex flex-col">
      <div className="px-4 pt-6 pb-3 flex-shrink-0">
        <button onClick={() => navigate('/')} className="text-tg-link text-sm mb-3 block">{t('backHome')}</button>
        <div className="flex items-start gap-2 justify-between mb-3">
          <h1 className="text-xl font-bold text-tg-text flex-1 leading-snug">{session?.title}</h1>
          {session && <SessionBadge session={session} />}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/session/${sessionId}/share`)}
            className="flex-1 py-2.5 rounded-xl bg-tg-secondary text-tg-text text-sm font-medium"
          >
            {t('share')}
          </button>
          <button
            onClick={toggleSession}
            disabled={toggling}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isClosed ? 'bg-green-500 text-white' : 'bg-red-100 text-red-600'
            } disabled:opacity-50`}
          >
            {isClosed ? t('reopen') : t('close')}
          </button>
        </div>
      </div>

      <div className="px-4 pb-3 flex gap-3 flex-shrink-0">
        <div className="flex-1 bg-tg-secondary rounded-xl px-3 py-2 text-center">
          <p className="text-lg font-bold text-tg-text">{unanswered.length}</p>
          <p className="text-xs text-tg-hint">{t('pending')}</p>
        </div>
        <div className="flex-1 bg-tg-secondary rounded-xl px-3 py-2 text-center">
          <p className="text-lg font-bold text-tg-text">{answered.length}</p>
          <p className="text-xs text-tg-hint">{t('answered')}</p>
        </div>
        <div className="flex-1 bg-tg-secondary rounded-xl px-3 py-2 text-center">
          <p className="text-lg font-bold text-tg-text">{allQuestions.length}</p>
          <p className="text-xs text-tg-hint">{t('total')}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {loading ? (
          <Spinner />
        ) : allQuestions.length === 0 ? (
          <div className="text-center py-12 text-tg-hint">
            <p className="text-4xl mb-3">⏳</p>
            <p>{t('waitingQuestions')}</p>
            <p className="text-sm mt-1">{t('shareToJoin')}</p>
          </div>
        ) : (
          <>
            {unanswered.length > 0 && (
              <>
                <p className="text-xs font-semibold text-tg-hint uppercase tracking-wide mb-3">
                  {t('topQuestions')}
                </p>
                {unanswered.map((q) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    isSpeaker
                    onMarkAnswered={markAnswered}
                    onHide={hideQuestion}
                  />
                ))}
              </>
            )}
            {answered.length > 0 && (
              <>
                <p className="text-xs font-semibold text-tg-hint uppercase tracking-wide mb-3 mt-5">
                  {t('answered')}
                </p>
                {answered.map((q) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    isSpeaker
                    onMarkAnswered={markAnswered}
                    onHide={hideQuestion}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
