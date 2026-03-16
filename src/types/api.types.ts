// IPC API response envelope
export interface ApiResponse<T> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: string
  code?: string
}

export type ApiResult<T> = ApiResponse<T> | ApiError

// ─── IPC response shape from main process ─────────────────────
export interface IpcResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}

// ─── Auth ─────────────────────────────────────────────────────
export interface AuthUser {
  id: number
  name: string
  username: string
  role: 'admin' | 'doctor' | 'receptionist'
}

// ─── Window API (exposed via contextBridge) ────────────────────
export interface ElectronAPI {
  auth: {
    login: (username: string, password: string) => Promise<IpcResponse<AuthUser>>
    logout: () => Promise<IpcResponse>
    changePassword: (userId: number, current: string, next: string) => Promise<IpcResponse>
    requestReset: (email: string) => Promise<IpcResponse>
    verifyReset: (otp: string, newPassword: string) => Promise<IpcResponse>
  }
  patients: {
    getAll: (filters?: unknown) => Promise<IpcResponse<unknown[]>>
    getById: (id: number) => Promise<IpcResponse<unknown>>
    search: (query: string) => Promise<IpcResponse<unknown[]>>
    create: (data: unknown) => Promise<IpcResponse<{ id: number; fileNumber: string }>>
    update: (id: number, data: unknown) => Promise<IpcResponse<unknown>>
    softDelete: (id: number, deletedBy?: number, reason?: string) => Promise<IpcResponse>
    getNextFileNumber: () => Promise<IpcResponse<string>>
  }
  appointments: {
    getAll: (filters?: unknown) => Promise<IpcResponse<unknown[]>>
    getByDate: (date: string) => Promise<IpcResponse<unknown[]>>
    getByDateRange: (start: string, end: string) => Promise<IpcResponse<unknown[]>>
    getById: (id: number) => Promise<IpcResponse<unknown>>
    getTodayQueue: () => Promise<IpcResponse<unknown[]>>
    getAvailableSlots: (date: string, duration: number) => Promise<IpcResponse<string[]>>
    create: (data: unknown, userId?: number) => Promise<IpcResponse<{ id: number }>>
    update: (id: number, data: unknown, userId?: number) => Promise<IpcResponse<unknown>>
    updateStatus: (id: number, status: string, userId?: number) => Promise<IpcResponse>
    cancel: (id: number, reason: string, userId?: number) => Promise<IpcResponse>
  }
  medicalRecords: {
    getByPatient: (patientId: number) => Promise<IpcResponse<unknown[]>>
    getById: (id: number) => Promise<IpcResponse<unknown>>
    getByAppointment: (appointmentId: number) => Promise<IpcResponse<unknown>>
    create: (data: unknown, userId?: number) => Promise<IpcResponse<{ id: number }>>
    update: (id: number, data: unknown) => Promise<IpcResponse<unknown>>
    delete: (id: number) => Promise<IpcResponse>
  }
  services: {
    getAll: (includeInactive?: boolean) => Promise<IpcResponse<unknown[]>>
    create: (data: unknown) => Promise<IpcResponse<{ id: number }>>
    update: (id: number, data: unknown) => Promise<IpcResponse>
    toggleActive: (id: number) => Promise<IpcResponse>
  }
  invoices: {
    getAll: (filters?: unknown) => Promise<IpcResponse<unknown[]>>
    getById: (id: number) => Promise<IpcResponse<unknown>>
    getByPatient: (patientId: number) => Promise<IpcResponse<unknown[]>>
    create: (data: unknown, userId?: number) => Promise<IpcResponse<{ id: number; invoiceNumber: string }>>
    update: (id: number, data: unknown, userId?: number) => Promise<IpcResponse<unknown>>
    cancel: (id: number, userId?: number) => Promise<IpcResponse>
    getOutstanding: () => Promise<IpcResponse<unknown[]>>
    getNextNumber: () => Promise<IpcResponse<string>>
  }
  payments: {
    getByInvoice: (invoiceId: number) => Promise<IpcResponse<unknown[]>>
    create: (data: unknown, userId?: number) => Promise<IpcResponse<{ id: number }>>
    delete: (id: number, userId?: number) => Promise<IpcResponse>
  }
  reports: {
    getDashboardStats: (date: string) => Promise<IpcResponse<unknown>>
    getFinancialSummary: (start: string, end: string) => Promise<IpcResponse<unknown>>
    getAppointmentStats: (start: string, end: string) => Promise<IpcResponse<unknown>>
    getEndOfDay: (date: string) => Promise<IpcResponse<unknown>>
  }
  settings: {
    getAll: () => Promise<IpcResponse<Record<string, string>>>
    get: (key: string) => Promise<IpcResponse<string | null>>
    set: (key: string, value: string, userId?: number) => Promise<IpcResponse>
    setMany: (data: Record<string, string>, userId?: number) => Promise<IpcResponse>
    getUsers: () => Promise<IpcResponse<unknown[]>>
    createUser: (data: unknown, userId?: number) => Promise<IpcResponse>
    updateUser: (id: number, data: unknown, userId?: number) => Promise<IpcResponse>
  }
  backup: {
    createNow: () => Promise<IpcResponse<string>>
    restore: (path: string) => Promise<IpcResponse>
    chooseBackupPath: () => Promise<IpcResponse<string | null>>
    chooseRestorePath: () => Promise<IpcResponse<string | null>>
    getLastBackupTime: () => Promise<IpcResponse<string | null>>
    toUSB: () => Promise<IpcResponse<{ success: boolean; path?: string; error?: string }>>
    toDrive: () => Promise<IpcResponse<{ success: boolean; fileId?: string; error?: string }>>
  }
  recycle: {
    getDeletedPatients: () => Promise<IpcResponse<unknown[]>>
    restorePatient: (id: number) => Promise<IpcResponse>
    permanentDelete: (id: number) => Promise<IpcResponse>
  }
  system: {
    openFile: (path: string) => Promise<IpcResponse>
    saveFileDialog: (name: string, filters: unknown[]) => Promise<IpcResponse<string | null>>
    openFolderDialog: () => Promise<IpcResponse<string | null>>
    getAppVersion: () => Promise<IpcResponse<string>>
    openURL: (url: string) => Promise<IpcResponse>
    toggleFullscreen: () => Promise<IpcResponse & { isFullscreen?: boolean }>
    isFullscreen: () => Promise<IpcResponse<boolean>>
  }
  license: {
    getStatus: () => Promise<IpcResponse<import('./license.types').LicenseStatus>>
    activate: (key: string) => Promise<IpcResponse<{ success: boolean; error?: string }>>
    getMachineId: () => Promise<IpcResponse<string>>
  }
  audit: {
    getLog: (filters?: unknown) => Promise<IpcResponse<unknown[]>>
  }
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
