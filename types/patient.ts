
export type PatientContact = {
  address: string | null
  number: string | null
  email: string | null
}

export type Patient = {
  patient_id: number
  patient_name: string
  age: number
  medical_issue: string
  photo_url: string | null
  contact: PatientContact[]
}
