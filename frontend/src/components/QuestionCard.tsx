import type { Question } from '../lib/api'
import { useLang } from '../lib/LangContext'

interface Props {
  question: Question
  onVote?: (id: string) => void
  onMarkAnswered?: (id: string, val: boolean) => void
  onHide?: (id: string, val: boolean) => void
  isSpeaker?: boolean
}

export function QuestionCard({ question, onVote, onMarkAnswered, onHide, isSpeaker }: Props) {
  const { t } = useLang()
  const answered = question.is_answered

  return (
    <div
      className={`rounded-xl p-4 mb-3 shadow-sm border transition-opacity ${
        answered ? 'opacity-50 border-gray-200 bg-tg-secondary' : 'border-transparent bg-tg-secondary'
      }`}
    >
      <p className={`text-sm leading-relaxed mb-3 ${answered ? 'line-through text-tg-hint' : 'text-tg-text'}`}>
        {question.text}
      </p>

      <div className="flex items-center gap-2">
        {onVote && (
          <button
            onClick={() => onVote(question.id)}
            disabled={answered}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              question.user_voted
                ? 'bg-tg-button text-tg-button-text'
                : 'bg-white/50 text-tg-hint border border-gray-200 hover:bg-gray-100'
            } disabled:cursor-not-allowed`}
          >
            <span>▲</span>
            <span>{question.votes_count}</span>
          </button>
        )}

        {!onVote && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-tg-button/10 text-tg-button">
            ▲ {question.votes_count}
          </span>
        )}

        {isSpeaker && (
          <>
            <button
              onClick={() => onMarkAnswered?.(question.id, !answered)}
              className={`ml-auto text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                answered ? 'bg-green-100 text-green-700' : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {answered ? `✓ ${t('answered')}` : t('markAnswered')}
            </button>
            <button
              onClick={() => onHide?.(question.id, !question.is_hidden)}
              className="text-xs px-3 py-1.5 rounded-full font-medium bg-gray-100 text-gray-500 hover:bg-gray-200"
            >
              {question.is_hidden ? t('show') : t('hide')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
