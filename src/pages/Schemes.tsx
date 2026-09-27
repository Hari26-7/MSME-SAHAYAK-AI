import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { schemesService } from '../lib/services'
import { useNavigate } from 'react-router-dom'

export default function Schemes() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [schemes, setSchemes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const data = await schemesService.getAllSchemes()
        setSchemes(data)
      } catch (err) {
        // ignore
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const categories = [...new Set(schemes.map(s => s.category).filter(Boolean))]

  const filtered = schemes.filter(s => {
    const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !categoryFilter || s.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>{t('browseSchemes')}</h1>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="form-row">
          <div className="form-group" style={{ margin: 0 }}>
            <input
              className="form-input"
              placeholder="Search schemes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <select className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>{t('noSchemesFound')}</h3>
        </div>
      ) : (
        filtered.map((scheme) => (
          <div key={scheme.id} className="scheme-card">
            <div className="scheme-card-header">
              <div>
                <div className="scheme-name">{scheme.name}</div>
                <div className="scheme-ministry">{scheme.ministry}</div>
              </div>
              <span className="badge badge-submitted">{scheme.category}</span>
            </div>
            <p className="scheme-description">{scheme.description}</p>
            <p className="scheme-benefits"><strong>{t('benefits')}:</strong> {scheme.benefits}</p>
            {scheme.eligibility_criteria && scheme.eligibility_criteria.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <strong style={{ fontSize: '13px', color: 'var(--color-neutral-700)' }}>{t('eligibility')}:</strong>
                <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                  {scheme.eligibility_criteria.map((c: string, i: number) => (
                    <li key={i} style={{ fontSize: '13px', color: 'var(--color-neutral-600)', marginBottom: '4px' }}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
            {scheme.documents_required && scheme.documents_required.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <strong style={{ fontSize: '13px', color: 'var(--color-neutral-700)' }}>{t('documentsRequired')}:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {scheme.documents_required.map((d: string, i: number) => (
                    <span key={i} className="badge badge-draft">{d}</span>
                  ))}
                </div>
              </div>
            )}
            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
              {scheme.application_url && (
                <a href={scheme.application_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                  {t('view')}
                </a>
              )}
              <button
                className="btn btn-primary"
                onClick={() => navigate('/applications?scheme=' + scheme.id)}
              >
                {t('applyNow')}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
