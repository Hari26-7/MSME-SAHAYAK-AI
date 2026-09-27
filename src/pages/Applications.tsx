import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { applicationsService, schemesService, notificationsService } from '../lib/services'
import { useSearchParams } from 'react-router-dom'

export default function Applications() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const [applications, setApplications] = useState<any[]>([])
  const [schemes, setSchemes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [selectedSchemeId, setSelectedSchemeId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [viewApp, setViewApp] = useState<any | null>(null)

  useEffect(() => {
    if (!user) return
    (async () => {
      try {
        const [apps, schemeData] = await Promise.all([
          applicationsService.getApplications(user.id),
          schemesService.getAllSchemes(),
        ])
        setApplications(apps)
        setSchemes(schemeData)
        const schemeParam = searchParams.get('scheme')
        if (schemeParam) {
          setSelectedSchemeId(schemeParam)
          setShowApplyForm(true)
        }
      } catch (err) {
        // ignore
      } finally {
        setLoading(false)
      }
    })()
  }, [user, searchParams])

  const handleApply = async () => {
    if (!user || !selectedSchemeId) return
    setSubmitting(true)
    try {
      const scheme = schemes.find((s) => s.id === selectedSchemeId)
      if (!scheme) return
      const app = await applicationsService.createApplication(user.id, scheme.id, scheme.name, {
        business_name: '',
        applied_via: 'MSME Sahayak AI',
      })
      setApplications((prev) => [app, ...prev])
      await notificationsService.createNotification(user.id, 'info', 'Application Submitted', `Your application for ${scheme.name} has been submitted. Reference: ${app.application_reference}`)
      setShowApplyForm(false)
      setSelectedSchemeId('')
      setToast({ msg: 'Application submitted successfully', type: 'success' })
      setTimeout(() => setToast(null), 3000)
    } catch (err: any) {
      setToast({ msg: err.message || 'Failed to submit', type: 'error' })
      setTimeout(() => setToast(null), 3000)
    } finally {
      setSubmitting(false)
    }
  }

  const handleWithdraw = async (id: string) => {
    if (!confirm('Withdraw this application?')) return
    try {
      await applicationsService.deleteApplication(id)
      setApplications((prev) => prev.filter((a) => a.id !== id))
      setToast({ msg: 'Application withdrawn', type: 'success' })
      setTimeout(() => setToast(null), 3000)
    } catch (err: any) {
      setToast({ msg: err.message || 'Failed', type: 'error' })
      setTimeout(() => setToast(null), 3000)
    }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>{t('applications')}</h1>
        <button className="btn btn-primary" onClick={() => setShowApplyForm(!showApplyForm)}>+ New Application</button>
      </div>

      {showApplyForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 className="card-title" style={{ marginBottom: '16px' }}>New Application</h3>
          <div className="form-group">
            <label className="form-label">{t('schemeName')}</label>
            <select className="form-select" value={selectedSchemeId} onChange={(e) => setSelectedSchemeId(e.target.value)}>
              <option value="">Select a scheme</option>
              {schemes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button className="btn btn-primary" onClick={handleApply} disabled={!selectedSchemeId || submitting}>
              {submitting ? t('loading') : t('applyNow')}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowApplyForm(false)}>{t('cancel')}</button>
          </div>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="empty-state">
          <h3>{t('noApplications')}</h3>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>{t('applicationReference')}</th>
                <th>{t('schemeName')}</th>
                <th>{t('applicationStatus')}</th>
                <th>{t('submittedAt')}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{app.application_reference}</td>
                  <td>{app.scheme_name}</td>
                  <td>
                    <span className={`badge badge-${app.status}`}>{t(app.status as any) || app.status}</span>
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--color-neutral-500)' }}>
                    {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => setViewApp(app)}>{t('view')}</button>
                      {app.status === 'draft' && (
                        <button className="btn btn-danger" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => handleWithdraw(app.id)}>{t('delete')}</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewApp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setViewApp(null)}>
          <div className="card" style={{ maxWidth: '550px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3 className="card-title">{viewApp.scheme_name}</h3>
              <button className="btn btn-secondary" style={{ padding: '4px 12px' }} onClick={() => setViewApp(null)}>{t('close')}</button>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--color-neutral-600)' }}>
              <p><strong>{t('applicationReference')}:</strong> <span style={{ fontFamily: 'monospace' }}>{viewApp.application_reference}</span></p>
              <p style={{ marginTop: '8px' }}><strong>{t('applicationStatus')}:</strong> <span className={`badge badge-${viewApp.status}`}>{t(viewApp.status as any) || viewApp.status}</span></p>
              <p style={{ marginTop: '8px' }}><strong>{t('submittedAt')}:</strong> {viewApp.submitted_at ? new Date(viewApp.submitted_at).toLocaleString() : '-'}</p>
              {viewApp.reviewed_at && <p style={{ marginTop: '8px' }}><strong>Reviewed:</strong> {new Date(viewApp.reviewed_at).toLocaleString()}</p>}
              {viewApp.notes && <p style={{ marginTop: '8px' }}><strong>Notes:</strong> {viewApp.notes}</p>}
              {viewApp.status_history && viewApp.status_history.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <strong>Status Timeline:</strong>
                  <div style={{ marginTop: '8px' }}>
                    {viewApp.status_history.map((h: any, i: number) => (
                      <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--color-neutral-100)', fontSize: '13px' }}>
                        <span className={`badge badge-${h.status}`}>{h.status}</span>
                        <span style={{ marginLeft: '8px', color: 'var(--color-neutral-500)' }}>{new Date(h.timestamp).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}
