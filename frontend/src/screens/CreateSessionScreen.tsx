import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { getTelegramUserId, haptic } from '../lib/tg'
import { useLang } from '../lib/LangContext'

export function CreateSessionScreen() {
  const navigate = useNavigate()
  const { t } = useLang()
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(60)
  const [customDuration, setCustomDuration] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const DURATIONS = [
    { label: t('min30'), value: 30 },
    { label: t('hour1'), value: 60 },
    { label: t('hours2'), value: 120 },
  ]

  const effectiveDuration = isCustom ? Number(customDuration) : duration

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return setError(t('titleRequired'))
    if (!effectiveDuration || effectiveDuration < 1) return setError(t('invalidDuration'))

    setSubmitting(true)
    setError('')

    try {
      const session = await api.createSession({
        title: title.trim(),
        durationMinutes: effectiveDuration,
        telegramUserId: getTelegramUserId(),
      })
      haptic('success')
      navigate(`/session/${session.id}/share`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      haptic('error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-tg-bg px-4 pb-8">
      <div className="pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="text-tg-link text-sm mb-3 block">{t('back')}</button>
        <h1 className="text-2xl font-bold text-tg-text">{t('newSession')}</h1>
        <p className="text-tg-hint text-sm mt-1">{t('setupSession')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-tg-text mb-2">{t('sessionTitle')}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('titlePlaceholder')}
            maxLength={120}
            className="w-full px-4 py-3 rounded-xl bg-tg-secondary text-tg-text placeholder:text-tg-hint outline-none focus:ring-2 focus:ring-tg-button/30 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-tg-text mb-2">{t('duration')}</label>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => { setDuration(d.value); setIsCustom(false) }}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                  !isCustom && duration === d.value
                    ? 'bg-tg-button text-tg-button-text'
                    : 'bg-tg-secondary text-tg-text'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsCustom(true)}
            className={`w-full py-3 rounded-xl text-sm font-medium transition-all ${
              isCustom ? 'bg-tg-button text-tg-button-text' : 'bg-tg-secondary text-tg-text'
            }`}
          >
            {t('custom')}
          </button>

          {isCustom && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                placeholder="45"
                min={1}
                max={480}
                className="flex-1 px-4 py-3 rounded-xl bg-tg-secondary text-tg-text placeholder:text-tg-hint outline-none focus:ring-2 focus:ring-tg-button/30"
              />
              <span className="text-tg-hint text-sm">{t('minutes')}</span>
            </div>
          )}
        </div>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-2xl bg-tg-button text-tg-button-text font-semibold text-base shadow-sm disabled:opacity-60 active:scale-95 transition-transform"
        >
          {submitting ? t('creating') : t('createSession')}
        </button>
      </form>
    </div>
  )
}
