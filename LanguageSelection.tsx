import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import type { Language } from '../lib/i18n'

export default function LanguageSelection() {
  const { setLanguage, t } = useLanguage()
  const [selected, setSelected] = useState<Language | null>(null)

  const languages: { code: Language; label: string; native: string; flag: string }[] = [
    { code: 'en', label: t('english'), native: 'English', flag: 'EN' },
    { code: 'ta', label: t('tamil'), native: 'தமிழ்', flag: 'TA' },
    { code: 'hi', label: t('hindi'), native: 'हिन्दी', flag: 'HI' },
  ]

  const handleContinue = () => {
    if (selected) {
      setLanguage(selected)
    }
  }

  return (
    <div className="lang-container">
      <div className="lang-card">
        <h1>{t('appName')}</h1>
        <p>{t('selectLanguage')}</p>
        <div className="lang-options">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`lang-option ${selected === lang.code ? 'selected' : ''}`}
              onClick={() => setSelected(lang.code)}
            >
              <span style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: selected === lang.code ? 'var(--color-primary-600)' : 'var(--color-neutral-200)',
                color: selected === lang.code ? 'white' : 'var(--color-neutral-600)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '700', fontSize: '14px', flexShrink: 0,
              }}>
                {lang.flag}
              </span>
              {lang.native}
            </button>
          ))}
        </div>
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '24px', padding: '14px' }}
          disabled={!selected}
          onClick={handleContinue}
        >
          {t('continue')}
        </button>
      </div>
    </div>
  )
}
