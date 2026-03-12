import { useMemo, useState } from 'react'
import type { Patient } from '../types/patient'

type Props = {
  patient: Patient
}

function normalizeIssue(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '-')
}

function initialsFromName(name: string): string {
  const parts = name.split(' ').filter(Boolean)
  const first = parts[0]?.charAt(0) || ''
  const second = parts[1]?.charAt(0) || ''
  return (first + second).toUpperCase()
}

export default function PatientCard({ patient }: Props) {
  const [imageError, setImageError] = useState(false)
  const primaryContact = patient.contact?.[0]
  const issueKey = useMemo(() => normalizeIssue(patient.medical_issue), [patient.medical_issue])
  const pid = `#${String(patient.patient_id).padStart(4, '0')}`

  return (
    <div className={`patient-card accent-${issueKey}`}>
      <div className="card-header">
        {patient.photo_url && !imageError ? (
          <img className="avatar" src={patient.photo_url} alt={patient.patient_name} onError={() => setImageError(true)} />
        ) : (
          <div className="avatar-fallback">{initialsFromName(patient.patient_name)}</div>
        )}
        <div className="card-name-block">
          <div className="card-name">{patient.patient_name}</div>
          <div className="card-pid">{pid}</div>
        </div>
        <span className="age-badge">{patient.age}y</span>
      </div>

      <div className="card-body">
        <div className="issue-tag">
          <span className={`issue-dot dot-${issueKey}`} />
          {patient.medical_issue}
        </div>
        <div className="divider" />
        <div className="contact-row">
          <span className="contact-label">Addr</span>
          <span className="contact-value">{primaryContact?.address || '-'}</span>
        </div>
        <div className="contact-row">
          <span className="contact-label">Phone</span>
          <span className="contact-value">{primaryContact?.number || '-'}</span>
        </div>
        <div className="contact-row">
          <span className="contact-label">Email</span>
          <span className="contact-value">{primaryContact?.email || '-'}</span>
        </div>
      </div>
    </div>
  )
}
