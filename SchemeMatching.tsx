import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { schemesService, applicationsService, notificationsService } from '../lib/services'
import { useNavigate } from 'react-router-dom'

export default function SchemeMatching() {
  const { user, profile } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [schemes, setSchemes] = useState<any[]>([])
  const [matches, setMatches] = useState<{ scheme: any; score: number; reasons: string[] }[]>([])
  const [loading, setLoading] = useState(true)
  const [hasProfileData, setHasProfileData] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const data = await schemesService.getAllSchemes()
        setSchemes(data)
        if (profile) {
          const hasData = profile.business_type || profile.sector || profile.investment_amount > 0
          setHasProfileData(hasData)
          if (hasData) {
            const results = schemesService.matchSchemes(profile, data)
            setMatches(results)
          }
        }
      } catch (err) {
        // ignore
      } finally {
        setLoading(false)
      }
    })()
  }, [profile])

  const handleApply = async (scheme: any) => {
    if (!user) return
    try {
      await applicationsService.createApplication(user.id, scheme.id, scheme.name, {
        scheme_id: scheme.id,
        business_name: profile?.business_name,
        business_type: profile?.business_type,
      })
      await notificationsService.createNotification(
        user.id, 'info', 'Application Submitted',
        `Your application for ${scheme.name} has been submitted successfully.`
      )
      navigate('/applications')
    } catch (err: any) {
      alert('Failed to submit application: ' + err.message)
    }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>{t('findSchemes')}</h1>

      {!hasProfileData ? (
        <div className="card">
          <div className="empty-state">
            <h3>Complete Your Profile First</h3>
            <p style={{ marginBottom: '16px' }}>Fill in your business details to get matched with eligible schemes.</p>
            <button className="btn btn-primary" onClick={() => navigate('/profile')}>{t('profile')}</button>
          </div>
        </div>
      ) : matches.length === 0 ? (
        <div className="empty-state">
          <h3>{t('noSchemesFound')}</h3>
        </div>
      ) : (
        matches.map(({ scheme, score, reasons }) => (
          <div key={scheme.id} className="scheme-card">
            <div className="scheme-card-header">
              <div>
                <div className="scheme-name">{scheme.name}</div>
                <div className="scheme-ministry">{scheme.ministry}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-primary-600)' }}>{score}%</div>
                <div style={{ fontSize: '12px', color: 'var(--color-neutral-500)' }}>{t('matchScore')}</div>
              </div>
            </div>
            <div className="match-bar">
              <div className="match-fill" style={{ width: `${score}%` }}></div>
            </div>
            <p className="scheme-description">{scheme.description}</p>
            <p className="scheme-benefits"><strong>{t('benefits')}:</strong> {scheme.benefits}</p>
            {reasons.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <strong style={{ fontSize: '13px', color: 'var(--color-neutral-700)' }}>Why you match:</strong>
                <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                  {reasons.map((r, i) => (
                    <li key={i} style={{ fontSize: '13px', color: 'var(--color-success-600)', marginBottom: '4px' }}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
            <div style={{ marginTop: '16px' }}>
              <button className="btn btn-primary" onClick={() => handleApply(scheme)}>{t('applyNow')}</button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
