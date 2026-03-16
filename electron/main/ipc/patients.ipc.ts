import { ipcMain } from 'electron'
import { patientService } from '../services/PatientService'
import { auditService } from '../services/AuditService'
import { requireRole } from './requireRole'
import { getSqliteDb } from '../db'

export function registerPatientsIpc(): void {
  ipcMain.handle('patients:getAll', async (_, filters?: unknown) => {
    try {
      return { success: true, data: patientService.getAll(filters as any) }
    } catch (err) {
      console.error('[IPC] patients:getAll error:', err)
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('patients:getById', async (_, id: number) => {
    try {
      return { success: true, data: patientService.getById(id) }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('patients:search', async (_, query: string) => {
    try {
      return { success: true, data: patientService.search(query) }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('patients:create', async (_, data: unknown, userId?: number) => {
    try {
      const result = patientService.create(data as any)
      if (userId) {
        auditService.log({
          userId,
          action: 'create',
          entity: 'patient',
          entityId: result.id,
          summary: `إضافة مريض: ${(data as any).firstName} ${(data as any).lastName}`,
          newValue: { fileNumber: result.fileNumber },
        })
      }
      return { success: true, data: result }
    } catch (err) {
      console.error('[IPC] patients:create error:', err)
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('patients:update', async (_, id: number, data: unknown) => {
    try {
      const result = patientService.update(id, data as any)
      return { success: true, data: result }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('patients:softDelete', async (_, id: number, deletedBy?: number, reason?: string) => {
    try {
      await requireRole(deletedBy, ['admin'])

      const unpaidCount = (getSqliteDb()
        .prepare(`SELECT COUNT(*) as cnt FROM invoices WHERE patient_id = ? AND status IN ('issued','partial')`)
        .get(id) as any).cnt
      if (unpaidCount > 0) {
        return { success: false, error: `لا يمكن حذف المريض، لديه ${unpaidCount} فاتورة غير مدفوعة` }
      }

      const patient = patientService.getById(id)
      patientService.softDelete(id, deletedBy, reason)
      if (deletedBy) {
        auditService.log({
          userId: deletedBy,
          action: 'delete',
          entity: 'patient',
          entityId: id,
          summary: `حذف مريض: ${patient?.firstName} ${patient?.lastName}`,
          oldValue: { reason },
        })
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('patients:getNextFileNumber', async () => {
    try {
      return { success: true, data: patientService.getNextFileNumber() }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}
