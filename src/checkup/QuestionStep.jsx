import { useLanguage } from '../i18n/LanguageContext'

const SYMBOLS = { usd: '$', krw: '₩' }

/* One question — a quiet moment, not a form field. */
export default function QuestionStep({ question, value, onChange, currency }) {
  const { lang } = useLanguage()
  useLanguage() // keep hook usage explicit for lang-driven rerenders

  return (
    <div className="ck-q rise rise-1">
      <h2 className="serif ck-q__label">{question.label}</h2>
      {question.help && <p className="ck-q__help">{question.help}</p>}

      {question.type === 'number' ? (
        <label className="ck-num">
          <span className="ck-num__sym" aria-hidden="true">{SYMBOLS[currency] || '$'}</span>
          <input
            className="ck-num__input"
            type="number"
            inputMode="numeric"
            min="0"
            value={value === 'skipped' ? '' : (value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder="0"
            autoFocus
            aria-label={question.label}
          />
        </label>
      ) : (
        <div className="ck-choices" role="radiogroup" aria-label={question.label}>
          {question.options.map((opt) => {
            const on = value === opt.value
            return (
              <button
                key={String(opt.value)}
                type="button"
                role="radio"
                aria-checked={on}
                className={`ck-choice${on ? ' is-on' : ''}`}
                onClick={() => onChange(opt.value)}
              >
                <span className="ck-choice__mark" aria-hidden="true" />
                <span>{opt.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
