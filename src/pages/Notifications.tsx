import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { notificationsService } from '../lib/services'

export default function Notifications() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!user) return
    (async () => {
      try {
        const data = await notificationsService.getNotifications(user.id)
        setNotifications(data)
      } catch (err) {
        // ignore
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id)
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
    } catch (err: any) {
      setToast({ msg: err.message || 'Failed', type: 'error' })
      setTimeout(() => setToast(null), 3000)
    }
  }

  const handleMarkAllRead = async () => {
    if (!user) return
    try {
      await notificationsService.markAllAsRead(user.id)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setToast({ msg: 'All notifications marked as read', type: 'success' })
      setTimeout(() => setToast(null), 3000)
    } catch (err: any) {
      setToast({ msg: err.message || 'Failed', type: 'error' })
      setTimeout(() => setToast(null), 3000)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await notificationsService.deleteNotification(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (err: any) {
      setToast({ msg: err.message || 'Failed', type: 'error' })
      setTimeout(() => setToast(null), 3000)
    }
  }

  const handleCreateReminder = async () => {
    if (!user) return
    const title = prompt('Reminder title:')
    if (!title) return
    const message = prompt('Reminder message:') || ''
    const dateStr = prompt('Reminder date (YYYY-MM-DD):') || ''
    try {
      const notif = await notificationsService.createNotification(user.id, 'reminder', title, message, dateStr)
      setNotifications((prev) => [notif, ...prev])
      setToast({ msg: 'Reminder created', type: 'success' })
      setTimeout(() => setToast(null), 3000)
    } catch (err: any) {
      setToast({ msg: err.message || 'Failed', type: 'error' })
      setTimeout(() => setToast(null), 3000)
    }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>
          {t('notifications')}
          {unreadCount > 0 && <span style={{ marginLeft: '8px', fontSize: '14px', color: 'var(--color-primary-600)' }}>({unreadCount} unread)</span>}
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={handleCreateReminder}>+ Reminder</button>
          {unreadCount > 0 && <button className="btn btn-primary" onClick={handleMarkAllRead}>{t('markAllRead')}</button>}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <h3>{t('noNotifications')}</h3>
        </div>
      ) : (
        <div>
          {notifications.map((n) => (
            <div key={n.id} className={`notification-item ${!n.is_read ? 'unread' : ''}`}>
              <div className="notification-icon" style={{
                background: n.type === 'reminder' ? 'var(--color-warning-100)' : n.type === 'success' ? 'var(--color-success-100)' : 'var(--color-accent-100)',
                color: n.type === 'reminder' ? 'var(--color-warning-600)' : n.type === 'success' ? 'var(--color-success-600)' : 'var(--color-accent-600)',
                fontWeight: '700',
                fontSize: '16px',
              }}>
                {n.type === 'reminder' ? 'R' : n.type === 'success' ? 'S' : 'i'}
              </div>
              <div className="notification-content">
                <div className="notification-title">{n.title}</div>
                <div className="notification-message">{n.message}</div>
                <div className="notification-time">
                  {new Date(n.created_at).toLocaleString()}
                  {n.reminder_date && <span style={{ marginLeft: '8px', color: 'var(--color-warning-600)' }}>Reminder: {n.reminder_date}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {!n.is_read && (
                  <button className="btn btn-outline" style={{ padding: '2px 10px', fontSize: '12px' }} onClick={() => handleMarkRead(n.id)}>Mark Read</button>
                )}
                <button className="btn btn-danger" style={{ padding: '2px 10px', fontSize: '12px' }} onClick={() => handleDelete(n.id)}>{t('delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}
