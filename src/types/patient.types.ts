// Patient domain types — full definitions in Phase 1
export interface Patient {
  id: number
  name: string
  phone: string
  dateOfBirth?: string
  gender?: 'male' | 'female'
  createdAt: string
}
