// Appointment domain types — full definitions in Phase 1
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

export interface Appointment {
  id: number
  patientId: number
  patientName: string
  date: string
  time: string
  status: AppointmentStatus
  notes?: string
  createdAt: string
}
