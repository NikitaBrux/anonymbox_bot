import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { api, type Session } from '../lib/api'
import { Spinner } from '../components/Spinner'
import { haptic } from '../lib/tg'
import { useLang } from '../lib/LangContext'

export function ShareScreen() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { t } = useLang()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.getSession(sessionId!).then(setSession).finally(() => setLoading(false))
  }, [sessionId])

  const botUsername = import.meta.env.VITE_BOT_USERNAME ?? 'AnonymBoxBot'
  const deepLink = `https://t.me/${botUsername}?start=session_${sessionId}`
  const audienceUrl = `${location.origin}/session/${sessionId}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(deepLink)
      setCopied(true)
      haptic('success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="min-h-screen bg-tg-bg px-4 pb-8">
      <div className="pt-6 pb-4">
        <button
          onClick={() => navigate(`/session/${sessionId}/speaker`)}
          className="text-tg-link text-sm mb-3 block"
        >
          {t('backToSession')}
        </button>
        <h1 className="text-2xl font-bold text-tg-text">{t('shareSession')}</h1>
        <p className="text-tg-text font-medium mt-1">{session?.title}</p>
      </div>

      <div className="flex flex-col items-center py-6 bg-tg-secondary rounded-2xl mb-5">
        <div className="bg-white p-4 rounded-xl shadow-sm mb-3">
          <QRCodeSVG value={deepLink} size={180} fgColor="#000000" bgColor="#ffffff" level="M" />
        </div>
        <p className="text-xs text-tg-hint text-center px-4">{t('scanQr')}</p>
      </div>

      <div className="mb-4">
        <p className="text-xs font-semibold text-tg-hint uppercase tracking-wide mb-2">{t('telegramLink')}</p>
        <div className="flex gap-2">
          <div className="flex-1 bg-tg-secondary rounded-xl px-4 py-3 text-sm text-tg-text overflow-hidden">
            <p className="truncate">{deepLink}</p>
          </div>
          <button
            onClick={copyLink}
            className={`px-4 py-3 rounded-xl text-sm font-medium shrink-0 transition-all ${
              copied ? 'bg-green-500 text-white' : 'bg-tg-button text-tg-button-text'
            }`}
          >
            {copied ? '✓' : t('copy')}
          </button>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs font-semibold text-tg-hint uppercase tracking-wide mb-2">{t('directLink')}</p>
        <div className="flex gap-2">
          <div className="flex-1 bg-tg-secondary rounded-xl px-4 py-3 text-sm text-tg-text overflow-hidden">
            <p className="truncate">{audienceUrl}</p>
          </div>
          <button
            onClick={async () => { await navigator.clipboard.writeText(audienceUrl); haptic('light') }}
            className="px-4 py-3 rounded-xl text-sm font-medium shrink-0 bg-tg-secondary text-tg-text border border-gray-200"
          >
            {t('copy')}
          </button>
        </div>
      </div>

      <button
        onClick={() => navigate(`/session/${sessionId}/speaker`)}
        className="w-full py-4 rounded-2xl bg-tg-button text-tg-button-text font-semibold text-base shadow-sm active:scale-95 transition-transform"
      >
        {t('speakerView')}
      </button>
    </div>
  )
}
