import { useState, useEffect, ChangeEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { documentsService, notificationsService } from '../lib/services'

const docTypes = [
  'Aadhaar Card', 'PAN Card', 'GST Certificate', 'MSME Registration (Udyam)',
  'Bank Statement', 'ITR Document', 'Business Registration', 'Utility Bill',
  'Project Report', 'Caste Certificate', 'Other'
]

export default function Documents() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedType, setSelectedType] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [previewDoc, setPreviewDoc] = useState<any | null>(null)

  useEffect(() => {
    if (!user) return
    (async () => {
      try {
        const data = await documentsService.getDocuments(user.id)
        setDocuments(data)
      } catch (err) {
        // ignore
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return
    if (!selectedType) {
      setToast({ msg: 'Please select a document type first', type: 'error' })
      setTimeout(() => setToast(null), 3000)
      return
    }
    setUploading(true)
    try {
      const file = e.target.files[0]
      const doc = await documentsService.uploadDocument(user.id, file, selectedType)
      setDocuments((prev) => [doc, ...prev])
      await notificationsService.createNotification(user.id, 'info', 'Document Uploaded', `${file.name} has been uploaded and is pending verification.`)
      setToast({ msg: 'Document uploaded successfully', type: 'success' })
      setTimeout(() => setToast(null), 3000)
    } catch (err: any) {
      setToast({ msg: err.message || 'Upload failed', type: 'error' })
      setTimeout(() => setToast(null), 3000)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return
    try {
      await documentsService.deleteDocument(id)
      setDocuments((prev) => prev.filter((d) => d.id !== id))
      setToast({ msg: 'Document deleted', type: 'success' })
      setTimeout(() => setToast(null), 3000)
    } catch (err: any) {
      setToast({ msg: err.message || 'Delete failed', type: 'error' })
      setTimeout(() => setToast(null), 3000)
    }
  }

  const handleReverify = async (id: string) => {
    try {
      await documentsService.updateVerificationStatus(id, 'pending', 'Resubmitted for verification')
      setDocuments((prev) => prev.map((d) => d.id === id ? { ...d, verification_status: 'pending', reviewer_notes: 'Resubmitted for verification' } : d))
      setToast({ msg: 'Document resubmitted for verification', type: 'success' })
      setTimeout(() => setToast(null), 3000)
    } catch (err: any) {
      setToast({ msg: err.message || 'Failed', type: 'error' })
      setTimeout(() => setToast(null), 3000)
    }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>{t('documents')}</h1>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 className="card-title" style={{ marginBottom: '16px' }}>{t('uploadDocument')}</h3>
        <div className="form-group">
          <label className="form-label">{t('documentType')}</label>
          <select className="form-select" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <option value="">Select document type</option>
            {docTypes.map((dt) => <option key={dt} value={dt}>{dt}</option>)}
          </select>
        </div>
        <div className="upload-zone" style={{ marginTop: '16px' }}>
          <label htmlFor="doc-upload" style={{ cursor: 'pointer', display: 'block' }}>
            {uploading ? (
              <p style={{ color: 'var(--color-primary-600)', fontWeight: 600 }}>{t('loading')}</p>
            ) : (
              <>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-neutral-400)" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block' }}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p style={{ color: 'var(--color-neutral-500)', fontSize: '14px' }}>Click to select a file to upload</p>
              </>
            )}
          </label>
          <input id="doc-upload" type="file" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading || !selectedType} />
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="empty-state">
          <h3>{t('noDocuments')}</h3>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>{t('documentType')}</th>
                <th>Name</th>
                <th>{t('verificationStatus')}</th>
                <th>{t('uploadedAt')}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td style={{ fontWeight: 500 }}>{doc.document_type}</td>
                  <td>{doc.document_name}</td>
                  <td>
                    <span className={`badge badge-${doc.verification_status}`}>
                      {t(doc.verification_status as any) || doc.verification_status}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--color-neutral-500)' }}>
                    {new Date(doc.uploaded_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => setPreviewDoc(doc)}>{t('view')}</button>
                      {doc.verification_status === 'rejected' && (
                        <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => handleReverify(doc.id)}>Re-verify</button>
                      )}
                      <button className="btn btn-danger" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => handleDelete(doc.id)}>{t('delete')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {previewDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setPreviewDoc(null)}>
          <div className="card" style={{ maxWidth: '500px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3 className="card-title">{previewDoc.document_name}</h3>
              <button className="btn btn-secondary" style={{ padding: '4px 12px' }} onClick={() => setPreviewDoc(null)}>{t('close')}</button>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--color-neutral-600)' }}>
              <p><strong>{t('documentType')}:</strong> {previewDoc.document_type}</p>
              <p style={{ marginTop: '8px' }}><strong>{t('verificationStatus')}:</strong> <span className={`badge badge-${previewDoc.verification_status}`}>{previewDoc.verification_status}</span></p>
              <p style={{ marginTop: '8px' }}><strong>Size:</strong> {(previewDoc.file_size / 1024).toFixed(1)} KB</p>
              <p style={{ marginTop: '8px' }}><strong>Type:</strong> {previewDoc.mime_type || 'N/A'}</p>
              <p style={{ marginTop: '8px' }}><strong>{t('uploadedAt')}:</strong> {new Date(previewDoc.uploaded_at).toLocaleString()}</p>
              {previewDoc.reviewer_notes && <p style={{ marginTop: '8px' }}><strong>Notes:</strong> {previewDoc.reviewer_notes}</p>}
            </div>
          </div>
        </div>
      )}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}
