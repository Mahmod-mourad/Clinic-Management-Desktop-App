export type Role = 'admin' | 'doctor' | 'receptionist'

export type Permission =
  // Patients
  | 'patients:view'
  | 'patients:create'
  | 'patients:update'
  | 'patients:delete'
  // Medical Records
  | 'medical_records:view'
  | 'medical_records:create'
  | 'medical_records:update'
  | 'medical_records:delete'
  // Appointments
  | 'appointments:view'
  | 'appointments:create'
  | 'appointments:cancel'
  // Invoices
  | 'invoices:view'
  | 'invoices:create'
  | 'invoices:cancel'
  // Payments
  | 'payments:create'
  | 'payments:delete'
  // Reports
  | 'reports:dashboard'
  | 'reports:financial'
  // System
  | 'settings:manage'
  | 'users:manage'
  | 'audit_log:view'
  | 'recycle_bin:access'
  | 'backup:manage'

const PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'patients:view', 'patients:create', 'patients:update', 'patients:delete',
    'medical_records:view', 'medical_records:create', 'medical_records:update', 'medical_records:delete',
    'appointments:view', 'appointments:create', 'appointments:cancel',
    'invoices:view', 'invoices:create', 'invoices:cancel',
    'payments:create', 'payments:delete',
    'reports:dashboard', 'reports:financial',
    'settings:manage', 'users:manage', 'audit_log:view', 'recycle_bin:access', 'backup:manage',
  ],
  doctor: [
    'patients:view', 'patients:update',
    'medical_records:view', 'medical_records:create', 'medical_records:update',
    'appointments:view',
    'invoices:view',
    'reports:dashboard',
  ],
  receptionist: [
    'patients:view', 'patients:create', 'patients:update',
    'appointments:view', 'appointments:create', 'appointments:cancel',
    'invoices:view', 'invoices:create',
    'payments:create',
    'reports:dashboard',
  ],
}

export function can(role: Role, permission: Permission): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false
}
