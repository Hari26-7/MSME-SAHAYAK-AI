import { useState, useEffect, FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { profileService, notificationsService, roadmapService } from '../lib/services'

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
]

const businessTypes = ['Micro', 'Small', 'Medium', 'Proprietorship', 'Partnership', 'Private Limited', 'LLP', 'Self Help Group']
const sectors = ['Manufacturing', 'Services', 'Trade', 'Retail', 'Agriculture', 'Food Processing', 'Textiles', 'Handicrafts', 'Technology', 'Construction', 'Transport', 'Healthcare', 'Education', 'Other']

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const { t } = useLanguage()
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        business_name: profile.business_name || '',
        business_type: profile.business_type || '',
        sector: profile.sector || '',
        sub_sector: profile.sub_sector || '',
        investment_amount: profile.investment_amount || 0,
        annual_turnover: profile.annual_turnover || 0,
        employee_count: profile.employee_count || 0,
        state: profile.state || '',
        city: profile.city || '',
        pincode: profile.pincode || '',
      })
    }
  }, [profile])

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      await profileService.updateProfile(user.id, formData)
      await refreshProfile()
      setToast({ msg: t('profileUpdated'), type: 'success' })
      // Create a notification
      await notificationsService.createNotification(user.id, 'success', 'Profile Updated', 'Your business profile has been updated successfully.')
      setTimeout(() => setToast(null), 3000)
    } catch (err: any) {
      setToast({ msg: err.message || 'Failed to update profile', type: 'error' })
      setTimeout(() => setToast(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (!profile) {
    return <div className="loading-spinner"><div className="spinner"></div></div>
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>{t('profile')}</h1>
      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 className="card-title" style={{ marginBottom: '20px' }}>Personal Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('fullName')}</label>
              <input className="form-input" value={formData.full_name || ''} onChange={(e) => handleChange('full_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('phoneNumber')}</label>
              <input className="form-input" value={formData.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 className="card-title" style={{ marginBottom: '20px' }}>Business Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('businessName')}</label>
              <input className="form-input" value={formData.business_name || ''} onChange={(e) => handleChange('business_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('businessType')}</label>
              <select className="form-select" value={formData.business_type || ''} onChange={(e) => handleChange('business_type', e.target.value)}>
                <option value="">Select type</option>
                {businessTypes.map((bt) => <option key={bt} value={bt}>{bt}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('sector')}</label>
              <select className="form-select" value={formData.sector || ''} onChange={(e) => handleChange('sector', e.target.value)}>
                <option value="">Select sector</option>
                {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('subSector')}</label>
              <input className="form-input" value={formData.sub_sector || ''} onChange={(e) => handleChange('sub_sector', e.target.value)} />
            </div>
          </div>
          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">{t('investmentAmount')}</label>
              <input type="number" className="form-input" value={formData.investment_amount || 0} onChange={(e) => handleChange('investment_amount', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('annualTurnover')}</label>
              <input type="number" className="form-input" value={formData.annual_turnover || 0} onChange={(e) => handleChange('annual_turnover', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('employeeCount')}</label>
              <input type="number" className="form-input" value={formData.employee_count || 0} onChange={(e) => handleChange('employee_count', Number(e.target.value))} />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 className="card-title" style={{ marginBottom: '20px' }}>Location</h3>
          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">{t('state')}</label>
              <select className="form-select" value={formData.state || ''} onChange={(e) => handleChange('state', e.target.value)}>
                <option value="">Select state</option>
                {indianStates.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('city')}</label>
              <input className="form-input" value={formData.city || ''} onChange={(e) => handleChange('city', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('pincode')}</label>
              <input className="form-input" value={formData.pincode || ''} onChange={(e) => handleChange('pincode', e.target.value)} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? t('loading') : t('save')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setFormData({})}>{t('cancel')}</button>
        </div>
      </form>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}
