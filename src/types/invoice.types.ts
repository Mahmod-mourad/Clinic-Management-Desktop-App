// Invoice domain types — full definitions in Phase 1
export type InvoiceStatus = 'draft' | 'paid' | 'partial' | 'cancelled'

export interface Invoice {
  id: number
  patientId: number
  patientName: string
  totalPiasters: number   // stored as integer piasters
  paidPiasters: number
  status: InvoiceStatus
  createdAt: string
}
