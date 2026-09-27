import { useState, useEffect, FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { creditService, notificationsService } from '../lib/services'

export default function CreditScore() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [profile, setProfile] = useState<any>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!user) return
    (async () => {
      try {
        const data = await creditService.getCreditProfile(user.id)
        setProfile(data)
        if (data) {
          setFormData({
            credit_score: data.credit_score || 0,
            outstanding_loans: data.outstanding_loans || 0,
            loan_count: data.loan_count || 0,
            annual_income: data.annual_income || 0,
            existing_emis: data.existing_emis || 0,
            banking_partner: data.banking_partner || '',
            gst_registered: data.gst_registered || false,
            itr_filed: data.itr_filed || false,
          })
        }
      } catch (err) {
        // ignore
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      const rating = creditService.calculateRating(Number(formData.credit_score) || 0)
      const data = await creditService.saveCreditProfile({
        user_id: user.id,
        ...formData,
        credit_score: Number(formData.credit_score) || 0,
        outstanding_loans: Number(formData.outstanding_loans) || 0,
        loan_count: Number(formData.loan_count) || 0,
        annual_income: Number(formData.annual_income) || 0,
        existing_emis: Number(formData.existing_emis) || 0,
        credit_rating: rating,
      })
      setProfile(data)
      await notificationsService.createNotification(user.id, 'success', 'Credit Profile Saved', 'Your credit profile has been updated successfully.')
      setToast({ msg: 'Credit profile saved successfully', type: 'success' })
      setTimeout(() => setToast(null), 3000)
    } catch (err: any) {
      setToast({ msg: err.message || 'Failed to save', type: 'error' })
      setTimeout(() => setToast(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>

  const currentScore = profile?.credit_score || 0
  const currentRating = profile?.credit_rating || creditService.calculateRating(Number(formData.credit_score) || 0)

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>{t('creditScore')}</h1>

      {profile && currentScore > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="credit-gauge">
            <div className="credit-score-display">{currentScore}</div>
            <div className="credit-rating-display" style={{
              color: currentScore >= 700 ? 'var(--color-success-600)' : currentScore >= 600 ? 'var(--color-warning-600)' : 'var(--color-error-600)'
            }}>{currentRating}</div>
            <div style={{ width: '100%', maxWidth: '300px', marginTop: '16px' }}>
              <div className="match-bar" style={{ height: '12px' }}>
                <div className="match-fill" style={{
                  width: `${Math.min((currentScore / 900) * 100, 100)}%`,
                  background: currentScore >= 700 ? 'var(--color-success-500)' : currentScore >= 600 ? 'var(--color-warning-500)' : 'var(--color-error-500)'
                }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-neutral-400)', marginTop: '4px' }}>
                <span>300</span><span>900</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 className="card-title" style={{ marginBottom: '20px' }}>Credit Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('creditScoreLabel')}</label>
              <input type="number" min="300" max="900" className="form-input" value={formData.credit_score || 0} onChange={(e) => handleChange('credit_score', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('creditRating')}</label>
              <input className="form-input" value={currentRating} readOnly style={{ background: 'var(--color-neutral-50)' }} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('outstandingLoans')}</label>
              <input type="number" className="form-input" value={formData.outstanding_loans || 0} onChange={(e) => handleChange('outstanding_loans', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('loanCount')}</label>
              <input type="number" className="form-input" value={formData.loan_count || 0} onChange={(e) => handleChange('loan_count', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 className="card-title" style={{ marginBottom: '20px' }}>Financial Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('annualIncome')}</label>
              <input type="number" className="form-input" value={formData.annual_income || 0} onChange={(e) => handleChange('annual_income', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('existingEMIs')}</label>
              <input type="number" className="form-input" value={formData.existing_emis || 0} onChange={(e) => handleChange('existing_emis', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('bankingPartner')}</label>
              <input className="form-input" value={formData.banking_partner || ''} onChange={(e) => handleChange('banking_partner', e.target.value)} />
            </div>
            <div className="form-group" style={{ display: 'flex', gap: '24px', alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.gst_registered || false} onChange={(e) => handleChange('gst_registered', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary-600)' }} />
                {t('gstRegistered')}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.itr_filed || false} onChange={(e) => handleChange('itr_filed', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary-600)' }} />
                {t('itrFiled')}
              </label>
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? t('loading') : t('saveCreditProfile')}
        </button>
      </form>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}
