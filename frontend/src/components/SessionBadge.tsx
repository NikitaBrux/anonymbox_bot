import type { Session } from '../lib/api'
import { useLang } from '../lib/LangContext'

export function SessionBadge({ session }: { session: Session }) {
  const { t } = useLang()
  const closed = !session.is_active || new Date(session.closes_at) < new Date()
  const timeLeft = Math.max(0, new Date(session.closes_at).getTime() - Date.now())
  const minutesLeft = Math.floor(timeLeft / 60_000)

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
        closed ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${closed ? 'bg-gray-400' : 'bg-green-500 animate-pulse'}`} />
      {closed ? t('closed') : `${t('live')} · ${minutesLeft}м ${t('left')}`}
    </span>
  )
}
