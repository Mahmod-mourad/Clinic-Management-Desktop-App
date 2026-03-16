import { registerAuthIpc } from './auth.ipc'
import { registerPatientsIpc } from './patients.ipc'
import { registerAppointmentsIpc } from './appointments.ipc'
import { registerMedicalRecordsIpc } from './medicalRecords.ipc'
import { registerInvoicesIpc } from './invoices.ipc'
import { registerPaymentsIpc } from './payments.ipc'
import { registerServicesIpc } from './services.ipc'
import { registerReportsIpc } from './reports.ipc'
import { registerSettingsIpc } from './settings.ipc'
import { registerBackupIpc } from './backup.ipc'
import { registerRecycleIpc } from './recycle.ipc'
import { registerLicenseHandlers } from './license.ipc'
import { registerAuditIpc } from './audit.ipc'

export function registerAllIpc() {
  registerAuthIpc()
  registerPatientsIpc()
  registerAppointmentsIpc()
  registerMedicalRecordsIpc()
  registerInvoicesIpc()
  registerPaymentsIpc()
  registerServicesIpc()
  registerReportsIpc()
  registerSettingsIpc()
  registerBackupIpc()
  registerRecycleIpc()
  registerLicenseHandlers()
  registerAuditIpc()
}
