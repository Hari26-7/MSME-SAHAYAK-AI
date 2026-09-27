import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import { Navbar } from './components/Navbar'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import CreditScore from './pages/CreditScore'
import Applications from './pages/Applications'
import Documents from './pages/Documents'
import FaceVerification from './pages/FaceVerification'
import EligibilityRoadmap from './pages/EligibilityRoadmap'
import Notifications from './pages/Notifications'
import LanguageSelection from './pages/LanguageSelection'
import Schemes from './pages/Schemes'
import SchemeMatching from './pages/SchemeMatching'
import SchemeStacking from './pages/SchemeStacking'

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

const AppRoutes: React.FC = () => {
  const { user } = useAuth()
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
          <Route path="/language-selection" element={<LanguageSelection />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/credit-score" element={<ProtectedRoute><CreditScore /></ProtectedRoute>} />
          <Route path="/applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
          <Route path="/face-verification" element={<ProtectedRoute><FaceVerification /></ProtectedRoute>} />
          <Route path="/eligibility-roadmap" element={<ProtectedRoute><EligibilityRoadmap /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/schemes" element={<ProtectedRoute><Schemes /></ProtectedRoute>} />
          <Route path="/scheme-matching" element={<ProtectedRoute><SchemeMatching /></ProtectedRoute>} />
          <Route path="/scheme-stacking" element={<ProtectedRoute><SchemeStacking /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}
