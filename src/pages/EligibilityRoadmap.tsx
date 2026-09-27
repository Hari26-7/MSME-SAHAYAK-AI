import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { roadmapService } from '../lib/services'

export default function EligibilityRoadmap() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [steps, setSteps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!user) return
    (async () => {
      try {
        let data = await roadmapService.getRoadmap(user.id)
        if (data.length === 0) {
          data = await roadmapService.createDefaultRoadmap(user.id)
        }
        setSteps(data)
      } catch (err) {
        // ignore
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  const handleToggleStatus = async (step: any) => {
    const nextStatus = step.status === 'completed' ? 'pending' : step.status === 'pending' ? 'in_progress' : 'completed'
    try {
      await roadmapService.updateStepStatus(step.id, nextStatus)
      setSteps((prev) => prev.map((s) => s.id === step.id ? { ...s, status: nextStatus, completed_at: nextStatus === 'completed' ? new Date().toISOString() : null } : s))
    } catch (err: any) {
      setToast({ msg: err.message || 'Failed', type: 'error' })
      setTimeout(() => setToast(null), 3000)
    }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>

  const completedCount = steps.filter((s) => s.status === 'completed').length
  const progress = steps.length > 0 ? (completedCount / steps.length) * 100 : 0

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>{t('eligibilityRoadmap')}</h1>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 className="card-title">Progress</h3>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary-600)' }}>{completedCount}/{steps.length} {t('completed')}</span>
        </div>
        <div className="match-bar" style={{ height: '12px' }}>
          <div className="match-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="card">
        {steps.map((step, index) => (
          <div key={step.id} className="roadmap-step" style={{ paddingBottom: index === steps.length - 1 ? 0 : undefined, borderBottom: index === steps.length - 1 ? 'none' : undefined }}>
            <button
              className={`roadmap-marker ${step.status}`}
              onClick={() => handleToggleStatus(step)}
              style={{ cursor: 'pointer', border: 'none' }}
              title="Click to cycle status"
            >
              {step.status === 'completed' ? '✓' : step.step_number}
            </button>
            <div className="roadmap-content">
              <div className="roadmap-title">{step.title}</div>
              <div className="roadmap-desc">{step.description}</div>
              <div style={{ marginTop: '8px' }}>
                <span className={`badge badge-${step.status === 'completed' ? 'completed' : step.status === 'in_progress' ? 'in-progress' : 'draft'}`}>
                  {step.status === 'completed' ? t('completed') : step.status === 'in_progress' ? t('inProgress') : t('pendingStatus')}
                </span>
                {step.completed_at && (
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--color-neutral-400)' }}>
                    {new Date(step.completed_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--color-neutral-400)', textAlign: 'center' }}>
        Click on a step marker to cycle its status: Pending → In Progress → Completed
      </p>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}
