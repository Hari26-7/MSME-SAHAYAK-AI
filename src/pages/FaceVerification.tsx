import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { faceVerificationService, notificationsService } from '../lib/services'

export default function FaceVerification() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [verifications, setVerifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [streaming, setStreaming] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!user) return
    (async () => {
      try {
        const data = await faceVerificationService.getVerifications(user.id)
        setVerifications(data)
      } catch (err) {
        // ignore
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setStreaming(true)
    } catch (err: any) {
      setToast({ msg: 'Camera access denied or not available: ' + err.message, type: 'error' })
      setTimeout(() => setToast(null), 3000)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setStreaming(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 320
    canvas.height = video.videoHeight || 240
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    setCapturedImage(dataUrl)
    stopCamera()
  }

  const handleVerify = async () => {
    if (!user || !capturedImage) return
    setVerifying(true)
    try {
      // Prototype: simulate face verification with random confidence
      const confidence = Math.round(70 + Math.random() * 30)
      const liveness = Math.random() > 0.2
      const status: 'verified' | 'failed' = confidence >= 75 && liveness ? 'verified' : 'failed'

      const record = await faceVerificationService.createVerification(
        user.id, status, confidence, liveness, capturedImage.substring(0, 100)
      )
      setVerifications((prev) => [record, ...prev])
      await notificationsService.createNotification(
        user.id,
        status === 'verified' ? 'success' : 'error',
        'Face Verification ' + (status === 'verified' ? 'Successful' : 'Failed'),
        `Confidence: ${confidence}%, Liveness: ${liveness ? 'Passed' : 'Failed'}`
      )
      setCapturedImage(null)
      setToast({
        msg: status === 'verified' ? 'Face verified successfully!' : 'Verification failed. Please try again.',
        type: status === 'verified' ? 'success' : 'error',
      })
      setTimeout(() => setToast(null), 3000)
    } catch (err: any) {
      setToast({ msg: err.message || 'Verification failed', type: 'error' })
      setTimeout(() => setToast(null), 3000)
    } finally {
      setVerifying(false)
    }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>{t('faceVerification')}</h1>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 className="card-title" style={{ marginBottom: '16px' }}>{t('startVerification')}</h3>
        <div className="face-container">
          {capturedImage ? (
            <div>
              <img src={capturedImage} alt="Captured" style={{ width: '320px', height: '240px', borderRadius: 'var(--radius-lg)', objectFit: 'cover', border: '3px solid var(--color-primary-500)' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-primary" onClick={handleVerify} disabled={verifying}>
                  {verifying ? t('loading') : t('confirm')}
                </button>
                <button className="btn btn-secondary" onClick={() => { setCapturedImage(null); startCamera() }}>{t('cancel')}</button>
              </div>
            </div>
          ) : streaming ? (
            <div>
              <video ref={videoRef} className="face-video" autoPlay playsInline muted />
              <button className="btn btn-primary" onClick={capturePhoto}>{t('capturePhoto')}</button>
            </div>
          ) : (
            <div>
              <div className="face-placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-neutral-400)" strokeWidth="1.5">
                  <path d="M23 7l-7 5 7 5V7z" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <button className="btn btn-primary" onClick={startCamera}>{t('startVerification')}</button>
            </div>
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
        <p style={{ fontSize: '12px', color: 'var(--color-neutral-400)', textAlign: 'center', marginTop: '16px' }}>
          This is a prototype. Face verification is simulated for demonstration purposes.
        </p>
      </div>

      {verifications.length > 0 && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Verification History</h3>
          <table className="table">
            <thead>
              <tr>
                <th>{t('faceVerificationStatus')}</th>
                <th>{t('confidenceScore')}</th>
                <th>{t('livenessCheck')}</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {verifications.map((v) => (
                <tr key={v.id}>
                  <td><span className={`badge badge-${v.status === 'verified' ? 'verified' : 'failed'}`}>{v.status}</span></td>
                  <td>{v.confidence_score}%</td>
                  <td>{v.liveness_check ? 'Passed' : 'Failed'}</td>
                  <td style={{ fontSize: '13px', color: 'var(--color-neutral-500)' }}>{new Date(v.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}
