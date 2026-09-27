import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { schemesService, applicationsService, documentsService, notificationsService, roadmapService } from '../lib/services'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const { t } = useLanguage()
  const [stats, setStats] = useState({ schemes: 0, applications: 0, documents: 0, notifications: 0, roadmapCompleted: 0, roadmapTotal: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    (async () => {
      try {
        const [schemes, applications, documents, notifications, roadmap] = await Promise.all([
          schemesService.getAllSchemes(),
          applicationsService.getApplications(user.id),
          documentsService.getDocuments(user.id),
          notificationsService.getNotifications(user.id),
          roadmapService.getRoadmap(user.id),
        ])
        const completedSteps = roadmap.filter((s: any) => s.status === 'completed').length
        setStats({
          schemes: schemes.length,
          applications: applications.length,
          documents: documents.length,
          notifications: notifications.filter((n: any) => !n.is_read).length,
          roadmapCompleted: completedSteps,
          roadmapTotal: roadmap.length,
        })
      } catch (err) {
        // If roadmap doesn't exist yet, create it
        if (user) {
          await roadmapService.createDefaultRoadmap(user.id)
          const roadmap = await roadmapService.getRoadmap(user.id)
          setStats(prev => ({ ...prev, roadmapTotal: roadmap.length }))
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  if (loading) {
    return (
      <div className="loading-spinner"><div className="spinner"></div></div>
    )
  }

  const statCards = [
    { label: t('schemes'), value: stats.schemes, color: 'var(--color-primary-100)', iconColor: 'var(--color-primary-600)', icon: 'S', link: '/schemes' },
    { label: t('applications'), value: stats.applications, color: 'var(--color-accent-100)', iconColor: 'var(--color-accent-600)', icon: 'A', link: '/applications' },
    { label: t('documents'), value: stats.documents, color: 'var(--color-warning-100)', iconColor: 'var(--color-warning-600)', icon: 'D', link: '/documents' },
    { label: t('notifications'), value: stats.notifications, color: 'var(--color-secondary-100)', iconColor: 'var(--color-secondary-600)', icon: 'N', link: '/notifications' },
  ]

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
        {t('welcome')}, {profile?.full_name || profile?.business_name || 'Entrepreneur'}!
      </h1>
      <p style={{ color: 'var(--color-neutral-500)', marginBottom: '32px', fontSize: '14px' }}>
        {t('tagline')}
      </p>

      <div className="stats-grid">
        {statCards.map((card) => (
          <Link key={card.label} to={card.link} style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
              <div className="stat-icon" style={{ background: card.color, color: card.iconColor, fontWeight: '700', fontSize: '18px' }}>
                {card.icon}
              </div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">{t('eligibilityRoadmap')}</h3>
          <Link to="/eligibility-roadmap" className="auth-link" style={{ fontSize: '13px' }}>{t('view')} →</Link>
        </div>
        {stats.roadmapTotal > 0 ? (
          <div>
            <div className="match-bar" style={{ height: '12px' }}>
              <div
                className="match-fill"
                style={{ width: `${(stats.roadmapCompleted / stats.roadmapTotal) * 100}%` }}
              ></div>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--color-neutral-600)', marginTop: '8px' }}>
              {stats.roadmapCompleted} / {stats.roadmapTotal} {t('completed').toLowerCase()}
            </p>
          </div>
        ) : (
          <p style={{ color: 'var(--color-neutral-500)', fontSize: '14px' }}>No roadmap yet</p>
        )}
      </div>

      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '16px' }}>Quick Actions</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <Link to="/scheme-matching" className="btn btn-primary">{t('findSchemes')}</Link>
          <Link to="/documents" className="btn btn-outline">{t('uploadDocument')}</Link>
          <Link to="/credit-score" className="btn btn-outline">{t('creditScore')}</Link>
          <Link to="/scheme-stacking" className="btn btn-outline">{t('schemeStacking')}</Link>
        </div>
      </div>
    </div>
  )
}
