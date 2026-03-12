
import { NextResponse } from 'next/server'
import data from '../../../data/data.json'

type SortBy = 'default' | 'name-asc' | 'name-desc' | 'age-asc' | 'age-desc'

type PatientRecord = {
  patient_id: number
  patient_name: string
  age: number
  medical_issue: string
  contact?: Array<{
    address?: string | null
    number?: string | null
    email?: string | null
  }>
}

function toSearchText(record: PatientRecord): string {
  const contact = record.contact?.[0]
  return [record.patient_name, record.medical_issue, contact?.address, contact?.number, contact?.email]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const limit = Math.max(1, Math.min(24, Number(searchParams.get('limit') || 12)))
  const query = (searchParams.get('q') || '').trim().toLowerCase()
  const issue = (searchParams.get('issue') || 'all').trim().toLowerCase()
  const sort = ((searchParams.get('sort') || 'default') as SortBy).toLowerCase() as SortBy

  let filtered = (data as PatientRecord[]).filter((record) => {
    if (query.length > 0 && !toSearchText(record).includes(query)) {
      return false
    }

    if (issue !== 'all' && record.medical_issue.toLowerCase() !== issue) {
      return false
    }

    return true
  })

  filtered = [...filtered]

  if (sort === 'name-asc') {
    filtered.sort((a, b) => a.patient_name.localeCompare(b.patient_name))
  }

  if (sort === 'name-desc') {
    filtered.sort((a, b) => b.patient_name.localeCompare(a.patient_name))
  }

  if (sort === 'age-asc') {
    filtered.sort((a, b) => a.age - b.age)
  }

  if (sort === 'age-desc') {
    filtered.sort((a, b) => b.age - a.age)
  }

  const start = (page - 1) * limit
  const end = start + limit
  const sliced = filtered.slice(start, end)

  return NextResponse.json({
    page,
    limit,
    total: filtered.length,
    data: sliced
  })
}
