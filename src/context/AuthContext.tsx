import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService, profileService } from '../lib/services'

interface AuthContextType {
  user: any
  profile: any
  loading: boolean
  signIn: (e: string, p: string) => Promise<any>
  signUp: (e: string, p: string, name?: string, phone?: string) => Promise<any>
  signOut: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(() => {
    try {
      const u = localStorage.getItem('msme_user')
      return u ? JSON.parse(u) : null
    } catch {
      return null
    }
  })
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const fetchProfile = async (uId: string) => {
    try {
      const p = await profileService.getProfile(uId)
      setProfile(p)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('msme_access_token')
      if (token) {
        try {
          const u = await authService.me()
          setUser(u)
          localStorage.setItem('msme_user', JSON.stringify(u))
          await fetchProfile(u.id)
        } catch {
          authService.signOut()
          setUser(null)
          setProfile(null)
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  const signIn = async (e: string, p: string) => {
    const data = await authService.signIn(e, p)
    setUser(data.user)
    await fetchProfile(data.user.id)
    return data
  }

  const signUp = async (e: string, p: string, name = '', phone = '') => {
    const data = await authService.register(e, p, name, phone)
    setUser(data.user)
    await fetchProfile(data.user.id)
    return data
  }

  const signOut = () => {
    authService.signOut()
    setUser(null)
    setProfile(null)
  }

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id)
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
