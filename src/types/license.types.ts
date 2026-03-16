export interface LicenseStatus {
  isValid:       boolean
  isTrial:       boolean
  daysRemaining: number
  expiresAt:     string | null
  machineId:     string
  error?:        string
}
