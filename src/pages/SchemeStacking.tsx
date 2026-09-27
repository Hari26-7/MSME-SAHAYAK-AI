import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { schemesService, stackingService } from '../lib/services'

export default function SchemeStacking() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [schemes, setSchemes] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!user) return
    (async () => {
      try {
        const [schemeData, historyData] = await Promise.all([
          schemesService.getAllSchemes(),
          stackingService.getStackingChecks(user.id),
        ])
        setSchemes(schemeData)
        setHistory(historyData)
      } catch (err) {
        // ignore
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  const toggleScheme = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])
  }

  const handleCheck = async () => {
    if (!user || selectedIds.length < 2) {
      setToast({ msg: 'Select at least 2 schemes to check compatibility', type: 'error' })
      setTimeout(() => setToast(null), 3000)
      return
    }
    setChecking(true)
    try {
      const selectedSchemes = schemes.filter((s) => selectedIds.includes(s.id)).map((s) => ({ id: s.id, name: s.name }))
      const res = await stackingService.checkStacking(user.id, selectedSchemes)
      setResult(res)
      setHistory((prev) => [res, ...prev])
      setToast({ msg: 'Stacking check completed', type: 'success' })
      setTimeout(() => setToast(null), 3000)
    } catch (err: any) {
      setToast({ msg: err.message || 'Failed', type: 'error' })
      setTimeout(() => setToast(null), 3000)
    } finally {
      setChecking(false)
    }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>{t('schemeStacking')}</h1>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 className="card-title" style={{ marginBottom: '16px' }}>{t('selectSchemes')}</h3>
        <p style={{ fontSize: '14px', color: 'var(--color-neutral-500)', marginBottom: '16px' }}>
          Select multiple schemes to check if they can be combined (stacked) for maximum benefit.
        </p>
        <div className="checkbox-grid">
          {schemes.map((scheme) => (
            <label
              key={scheme.id}
              className={`checkbox-item ${selectedIds.includes(scheme.id) ? 'checked' : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(scheme.id)}
                onChange={() => toggleScheme(scheme.id)}
              />
              <span style={{ fontSize: '13px', fontWeight: 500 }}>{scheme.name}</span>
            </label>
          ))}
        </div>
        <div style={{ marginTop: '20px' }}>
          <button className="btn btn-primary" onClick={handleCheck} disabled={checking || selectedIds.length < 2}>
            {checking ? t('loading') : t('checkCompatibility')}
          </button>
        </div>
      </div>

      {result && (
        <div className={`stacking-result ${result.is_compatible ? 'compatible' : 'not-compatible'}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: result.is_compatible ? 'var(--color-success-500)' : 'var(--color-error-500)',
              color: 'white', fontSize: '24px', fontWeight: '700',
            }}>
              {result.is_compatible ? '✓' : '!'}
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: result.is_compatible ? 'var(--color-success-700)' : 'var(--color-error-700)' }}>
                {result.is_compatible ? t('compatible') : t('notCompatible')}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-neutral-600)' }}>
                {result.selected_scheme_names.join(' + ')}
              </p>
            </div>
          </div>
          {result.combined_benefits && (
            <div style={{ marginTop: '12px' }}>
              <strong style={{ fontSize: '13px' }}>{t('combinedBenefits')}:</strong>
              <p style={{ fontSize: '14px', marginTop: '4px' }}>{result.combined_benefits}</p>
            </div>
          )}
          {result.conflict_notes && (
            <div style={{ marginTop: '12px' }}>
              <strong style={{ fontSize: '13px' }}>{t('conflictNotes')}:</strong>
              <p style={{ fontSize: '14px', marginTop: '4px', color: 'var(--color-error-600)' }}>{result.conflict_notes}</p>
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="card" style={{ marginTop: '24px' }}>
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Previous Checks</h3>
          {history.map((h, i) => (
            <div key={h.id || i} style={{ padding: '12px 0', borderBottom: i === history.length - 1 ? 'none' : '1px solid var(--color-neutral-100)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{h.selected_scheme_names.join(' + ')}</span>
                  <span className={`badge badge-${h.is_compatible ? 'compatible' : 'failed'}`} style={{ marginLeft: '8px' }}>
                    {h.is_compatible ? t('compatible') : t('notCompatible')}
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--color-neutral-400)' }}>{new Date(h.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}
