import { ipcMain } from 'electron'
import { medicalRecordService } from '../services/MedicalRecordService'
import { auditService } from '../services/AuditService'
import { requireRole } from './requireRole'

export function registerMedicalRecordsIpc(): void {
  ipcMain.handle('medicalRecords:getByPatient', async (_, patientId: number) => {
    try {
      return { success: true, data: medicalRecordService.getByPatient(patientId) }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('medicalRecords:getById', async (_, id: number) => {
    try {
      return { success: true, data: medicalRecordService.getById(id) }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('medicalRecords:getByAppointment', async (_, appointmentId: number) => {
    try {
      return { success: true, data: medicalRecordService.getByAppointment(appointmentId) }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('medicalRecords:create', async (_, data: unknown, userId?: number) => {
    try {
      await requireRole(userId, ['admin', 'doctor'])
      const result = medicalRecordService.create(data as any)
      auditService.log({
        userId: userId!,
        action: 'create',
        entity: 'medical_record',
        entityId: result.id,
        summary: `تم إنشاء سجل طبي للمريض رقم ${(data as any).patientId}`,
      })
      return { success: true, data: result }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('medicalRecords:update', async (_, id: number, data: unknown, userId?: number) => {
    try {
      await requireRole(userId, ['admin', 'doctor'])
      return { success: true, data: medicalRecordService.update(id, data as any) }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('medicalRecords:delete', async (_, id: number, userId?: number) => {
    try {
      await requireRole(userId, ['admin'])
      medicalRecordService.delete(id)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}
