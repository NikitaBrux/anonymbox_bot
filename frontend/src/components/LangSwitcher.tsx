import { useLang } from '../lib/LangContext'
import type { Lang } from '../lib/i18n'

const LANGS: { value: Lang; label: string; flag: string }[] = [
  { value: 'en', label: 'EN', flag: '🇬🇧' },
  { value: 'ru', label: 'RU', flag: '🇷🇺' },
  { value: 'zh', label: '中文', flag: '🇨🇳' },
]

export function LangSwitcher() {
  const { lang, setLang } = useLang()

  return (
    <div className="flex gap-1.5">
      {LANGS.map((l) => (
        <button
          key={l.value}
          onClick={() => setLang(l.value)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            lang === l.value
              ? 'bg-tg-button text-tg-button-text'
              : 'bg-tg-secondary text-tg-hint'
          }`}
        >
          <span>{l.flag}</span>
          <span>{l.label}</span>
        </button>
      ))}
    </div>
  )
}
