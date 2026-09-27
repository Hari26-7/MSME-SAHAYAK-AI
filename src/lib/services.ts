/// <reference types="vite/client" />

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '')

function getToken() {
  return localStorage.getItem('msme_access_token') || ''
}

function authHeaders(extra: Record<string,string> = {}) {
  const token = getToken()
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: authHeaders({ ...(options.headers as Record<string,string> || {}) }),
  })
  const contentType = response.headers.get('content-type') || ''
  const body = contentType.includes('application/json') ? await response.json() : await response.text()
  if (!response.ok) {
    const message = typeof body === 'object' && body?.detail ? body.detail : `Request failed (${response.status})`
    throw new Error(message)
  }
  return body as T
}

export const authService = {
  async signIn(email: string, password: string) {
    const data = await request<any>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    localStorage.setItem('msme_access_token', data.access_token)
    localStorage.setItem('msme_user', JSON.stringify(data.user))
    return data
  },
  async register(email: string, password: string, full_name = '', phone = '') {
    const data = await request<any>('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name, phone }),
    })
    localStorage.setItem('msme_access_token', data.access_token)
    localStorage.setItem('msme_user', JSON.stringify(data.user))
    return data
  },
  async me() { return request<any>('/auth/me') },
  signOut() {
    localStorage.removeItem('msme_access_token')
    localStorage.removeItem('msme_user')
  },
}

export const profileService = {
  getProfile: (userId: string) => request<any>(`/profile/${userId}`),
  updateProfile: (userId: string, data: Record<string, any>) => request<any>(`/profile/${userId}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }),
  upsertProfile: (data: Record<string, any>) => {
    const userId = data.user_id || data.id
    return profileService.updateProfile(userId, data)
  }
}

export const creditService = {
  getCreditProfile: (userId: string) => request<any>(`/credit/${userId}`),
  saveCreditProfile: (data: Record<string, any>) => request<any>('/credit', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }),
  calculateRating(score: number) {
    if (score >= 750) return 'Excellent'
    if (score >= 700) return 'Good'
    if (score >= 650) return 'Fair'
    if (score >= 600) return 'Needs Improvement'
    return 'Poor'
  },
}

export const schemesService = {
  getAllSchemes: () => request<any[]>('/schemes'),
  getScheme: (id: string) => request<any>(`/schemes/${id}`),
  matchSchemes: (profile: any, schemes: any[]) => {
    return schemes.map((scheme) => {
      let score = 70
      const reasons: string[] = []
      if (profile.sector) {
        score += 10
        reasons.push(`Matches your sector (${profile.sector})`)
      }
      if (profile.business_type) {
        score += 10
        reasons.push(`Eligible for ${profile.business_type} enterprises`)
      }
      if (profile.investment_amount > 0 && profile.investment_amount <= scheme.max_loan_amount) {
        score += 10
        reasons.push(`Investment within scheme limit`)
      }
      return { scheme, score: Math.min(score, 98), reasons }
    })
  }
}

export const applicationsService = {
  getApplications: (userId: string) => request<any[]>(`/applications/${userId}`),
  createApplication: (userId: string, schemeId: string, schemeName: string, applicationData: Record<string, any> = {}) => request<any>('/applications', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, scheme_id: schemeId, scheme_name: schemeName, application_data: applicationData }),
  }),
  deleteApplication: (id: string) => request<any>(`/applications/${id}`, { method: 'DELETE' }),
  updateStatus: (id: string, status: string, notes = '') => request<any>(`/applications/${id}/status`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, notes }),
  }),
}

export const documentsService = {
  getDocuments: (userId: string) => request<any[]>(`/documents/${userId}`),
  async uploadDocument(userId: string, file: File, documentType: string) {
    const form = new FormData()
    form.append('user_id', userId)
    form.append('document_type', documentType)
    form.append('file', file)
    return request<any>('/documents/upload', { method: 'POST', body: form })
  },
  deleteDocument: (id: string) => request<any>(`/documents/${id}`, { method: 'DELETE' }),
  updateVerificationStatus: (id: string, status: string, reviewerNotes = '') => {
    const form = new FormData()
    form.append('status', status)
    form.append('reviewer_notes', reviewerNotes)
    return request<any>(`/documents/${id}/verification`, { method: 'PATCH', body: form })
  },
}

export const faceVerificationService = {
  getVerifications: (userId: string) => request<any[]>(`/face-verification/${userId}`),
  createVerification: (userId: string, status: string, confidenceScore: number, livenessCheck: boolean, imagePreview = '') => request<any>('/face-verification', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, status, confidence_score: confidenceScore, liveness_check: livenessCheck, image_preview: imagePreview }),
  }),
}

export const roadmapService = {
  getRoadmap: (userId: string) => request<any[]>(`/roadmap/${userId}`),
  createDefaultRoadmap: (userId: string) => request<any[]>(`/roadmap/${userId}/default`, { method: 'POST' }),
  updateStepStatus: (stepId: string, status: string) => request<any>(`/roadmap/step/${stepId}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
  }),
}

export const notificationsService = {
  getNotifications: (userId: string) => request<any[]>(`/notifications/${userId}`),
  createNotification: (userId: string, type: string, title: string, message: string, reminderDate = '') => request<any>('/notifications', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, type, title, message, reminder_date: reminderDate || null }),
  }),
  markAsRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: (userId: string) => request<any>(`/notifications/user/${userId}/read-all`, { method: 'PATCH' }),
  deleteNotification: (id: string) => request<any>(`/notifications/${id}`, { method: 'DELETE' }),
}

export const stackingService = {
  getStackingChecks: async (_userId: string) => [],
  checkStacking: async (_userId: string, selectedSchemes: { id: string; name: string }[]) => {
    const names = selectedSchemes.map(s => s.name)
    return {
      id: "stack-" + Date.now(),
      is_compatible: true,
      selected_scheme_names: names,
      combined_benefits: "Eligible to combine credit guarantee with capital subsidy across approved ceilings.",
      conflict_notes: null,
      created_at: new Date().toISOString()
    }
  },
  getRecommendations: async (_userId: string) => [
    { title: "MUDRA Loan + PMEGP Subsidy", savings: "Up to 35% Capital Subsidy + Low Interest Credit", description: "Combine credit-linked capital subsidy with collateral-free working capital loan." }
  ]
}

export { API_URL }
