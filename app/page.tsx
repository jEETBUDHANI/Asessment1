
'use client'

import { useEffect, useMemo, useState } from 'react'
import PatientCard from '../components/PatientCard'
import type { Patient } from '../types/patient'

type PatientsResponse = {
  page: number
  limit: number
  total: number
  data: Patient[]
}

type SortBy = 'default' | 'name-asc' | 'name-desc' | 'age-asc' | 'age-desc'
type ViewMode = 'table' | 'card'

const ISSUE_OPTIONS = [
  'all',
  'fever',
  'headache',
  'rash',
  'sprained ankle',
  'sore throat',
  'ear infection',
  'sinusitis',
  'allergic reaction',
  'stomach ache',
  'broken arm'
]

function createPageList(current: number, totalPages: number): number[] {
  const start = Math.max(1, current - 2)
  const end = Math.min(totalPages, current + 2)
  const pages: number[] = []

  for (let i = start; i <= end; i += 1) {
    pages.push(i)
  }

  return pages
}

function toTitleCase(value: string): string {
  return value
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function Page() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('default')
  const [issueFilter, setIssueFilter] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const limit = 12

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 300)

    return () => {
      window.clearTimeout(timer)
    }
  }, [query])

  useEffect(() => {
    setPage(1)
  }, [debouncedQuery, sortBy, issueFilter])

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    const load = async () => {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        q: debouncedQuery,
        sort: sortBy,
        issue: issueFilter
      })

      try {
        const res = await fetch(`/api/patients?${params.toString()}`, {
          cache: 'no-store',
          signal: controller.signal
        })

        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`)
        }

        const data = (await res.json()) as PatientsResponse
        if (!active) {
          return
        }

        setPatients(Array.isArray(data.data) ? data.data : [])
        setTotal(typeof data.total === 'number' ? data.total : 0)
      } catch (err) {
        if (!active || (err instanceof Error && err.name === 'AbortError')) {
          return
        }

        setPatients([])
        setTotal(0)
        setError(err instanceof Error ? err.message : 'Failed to load patients')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      active = false
      controller.abort()
    }
  }, [page, debouncedQuery, sortBy, issueFilter])

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const pageList = useMemo(() => createPageList(page, totalPages), [page, totalPages])
  const activeFiltersCount = [debouncedQuery.length > 0, sortBy !== 'default', issueFilter !== 'all'].filter(Boolean).length

  return (
    <div className="wrapper">
      <div className="header">
        <div>
          <h1 className="header-title">Patient Records</h1>
          <p className="header-subtitle">Browse and filter all registered patients</p>
        </div>
        <span className="record-count">{total} patients</span>
      </div>

      <div className="tabs">
        <button className={`tab-btn${viewMode === 'card' ? ' active' : ''}`} onClick={() => setViewMode('card')}>
          Card View
        </button>
        <button className={`tab-btn${viewMode === 'table' ? ' active' : ''}`} onClick={() => setViewMode('table')}>
          Table View
        </button>
      </div>

      <div className="controls">
        <div className="search-box">
          <input
            className="search-input"
            placeholder="Search by name, condition, phone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="filter-group">
          {activeFiltersCount > 0 && (
            <span className="filter-count">{activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active</span>
          )}
          <select className="select-input" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
            <option value="default">Sort by default</option>
            <option value="name-asc">Name A &rarr; Z</option>
            <option value="name-desc">Name Z &rarr; A</option>
            <option value="age-asc">Age (low to high)</option>
            <option value="age-desc">Age (high to low)</option>
          </select>
          <select className="select-input" value={issueFilter} onChange={(e) => setIssueFilter(e.target.value)}>
            {ISSUE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === 'all' ? 'All conditions' : toTitleCase(opt)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <div className="chips">
          {debouncedQuery ? (
            <span className="chip">
              &ldquo;{debouncedQuery}&rdquo;
              <button className="chip-x" onClick={() => setQuery('')}>&#x00D7;</button>
            </span>
          ) : null}
          {sortBy !== 'default' ? (
            <span className="chip">
              {sortBy.replace('-', ' ').replace('asc', String.fromCharCode(8593)).replace('desc', String.fromCharCode(8595))}
              <button className="chip-x" onClick={() => setSortBy('default')}>&#x00D7;</button>
            </span>
          ) : null}
          {issueFilter !== 'all' ? (
            <span className="chip">
              {toTitleCase(issueFilter)}
              <button className="chip-x" onClick={() => setIssueFilter('all')}>&#x00D7;</button>
            </span>
          ) : null}
        </div>
      )}

      <div className="toolbar">
        <button className="btn-pdf" type="button">Export PDF</button>
      </div>

      {loading ? <p className="status-text">Loading...</p> : null}
      {error ? <div className="error-box">{error}</div> : null}

      {!loading && !error && viewMode === 'card' ? (
        <div className="cards-grid">
          {patients.map((p) => (
            <PatientCard key={p.patient_id} patient={p} />
          ))}
        </div>
      ) : null}

      {!loading && !error && viewMode === 'table' ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Age</th>
                <th>Condition</th>
                <th>Phone</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.patient_id}>
                  <td>{p.patient_name}</td>
                  <td>{p.age}</td>
                  <td>{p.medical_issue}</td>
                  <td>{p.contact?.[0]?.number || '-'}</td>
                  <td>{p.contact?.[0]?.email || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loading && !error && patients.length === 0 ? (
        <p className="status-text">No patients match your search.</p>
      ) : null}

      <div className="pagination">
        <button className="pg-arrow" disabled={page <= 1 || loading} onClick={() => setPage((v) => Math.max(1, v - 1))}>
          Prev
        </button>
        {pageList.map((n) => (
          <button
            key={n}
            className={`pg-btn${n === page ? ' active' : ''}`}
            disabled={loading}
            onClick={() => setPage(n)}
          >
            {n}
          </button>
        ))}
        <button className="pg-arrow" disabled={page >= totalPages || loading} onClick={() => setPage((v) => Math.min(totalPages, v + 1))}>
          Next
        </button>
      </div>
    </div>
  )
}