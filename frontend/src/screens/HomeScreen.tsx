import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type Session } from '../lib/api'
import { getTelegramUserId, getTelegramUser } from '../lib/tg'
import { useLang } from '../lib/LangContext'
import { SessionBadge } from '../components/SessionBadge'
import { LangSwitcher } from '../components/LangSwitcher'
import { Spinner } from '../components/Spinner'

export function HomeScreen() {
  const navigate = useNavigate()
  const { t } = useLang()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const user = getTelegramUser()

  useEffect(() => {
    api.listSessions(getTelegramUserId())
      .then(setSessions)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-tg-bg px-4 pb-8">
      {/* Header */}
      <div className="pt-6 pb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-tg-hint text-sm">{t('hello')}, {user.first_name} 👋</p>
          <LangSwitcher />
        </div>
        <h1 className="text-2xl font-bold text-tg-text">AnonymBox</h1>
        <p className="text-tg-hint text-sm mt-1">{t('appSubtitle')}</p>
      </div>

      {/* Create button */}
      <button
        onClick={() => navigate('/create')}
        className="w-full py-4 rounded-2xl bg-tg-button text-tg-button-text font-semibold text-base shadow-sm active:scale-95 transition-transform mb-6"
      >
        {t('createNew')}
      </button>

      {/* Recent sessions */}
      <h2 className="text-sm font-semibold text-tg-hint uppercase tracking-wide mb-3">
        {t('yourSessions')}
      </h2>

      {loading ? (
        <Spinner />
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 text-tg-hint">
          <p className="text-4xl mb-3">📭</p>
          <p>{t('noSessions')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => navigate(`/session/${s.id}/speaker`)}
              className="bg-tg-secondary rounded-2xl p-4 active:opacity-70 transition-opacity cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-tg-text flex-1 leading-snug">{s.title}</p>
                <SessionBadge session={s} />
              </div>
              <p className="text-xs text-tg-hint mt-2">
                {new Date(s.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
