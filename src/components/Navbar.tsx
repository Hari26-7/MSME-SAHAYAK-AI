import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import type { Language } from '../lib/i18n'

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth()
  const { t, language, setLanguage } = useLanguage()
  const location = useLocation()

  if (!user) return null

  const links = [
    { path: '/dashboard', label: t('welcome') },
    { path: '/profile', label: t('profile') },
    { path: '/credit-score', label: t('creditScore') },
    { path: '/schemes', label: t('schemes') },
    { path: '/applications', label: t('applications') },
    { path: '/documents', label: t('documents') },
    { path: '/face-verification', label: t('faceVerification') },
    { path: '/eligibility-roadmap', label: t('eligibilityRoadmap') },
    { path: '/notifications', label: t('notifications') },
  ]

  return (
    <header className="main-navbar">
      <Link to="/dashboard" className="nav-brand">
        <span>MSME Sahayak AI</span>
      </Link>
      <nav className="nav-links">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <select
          className="form-select"
          style={{ width: 'auto', padding: '6px 10px', fontSize: '13px' }}
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
        >
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
          <option value="ta">தமிழ்</option>
        </select>
        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={signOut}>
          {t('logout')}
        </button>
      </div>
    </header>
  )
}
