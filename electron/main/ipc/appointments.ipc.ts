import { ipcMain } from 'electron'
import { appointmentService } from '../services/AppointmentService'
import { auditService } from '../services/AuditService'

export function registerAppointmentsIpc(): void {
  ipcMain.handle('appointments:getAll', async (_, filters?: unknown) => {
    try {
      return { success: true, data: appointmentService.getAll(filters as any) }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('appointments:getByDate', async (_, date: string) => {
    try {
      return { success: true, data: appointmentService.getByDate(date) }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('appointments:getByDateRange', async (_, start: string, end: string) => {
    try {
      return { success: true, data: appointmentService.getByDateRange(start, end) }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('appointments:getById', async (_, id: number) => {
    try {
      return { success: true, data: appointmentService.getById(id) }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('appointments:getTodayQueue', async () => {
    try {
      return { success: true, data: appointmentService.getTodayQueue() }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('appointments:getAvailableSlots', async (_, date: string, duration: number) => {
    try {
      return { success: true, data: appointmentService.getAvailableSlots(date, duration) }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('appointments:create', async (_, data: unknown, userId?: number) => {
    try {
      const result = appointmentService.create(data as any)
      if (userId) {
        auditService.log({
          userId,
          action: 'create',
          entity: 'appointment',
          entityId: result.id,
          summary: `تم إنشاء موعد للمريض رقم ${(data as any).patientId}`,
        })
      }
      return { success: true, data: result }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('appointments:update', async (_, id: number, data: unknown, userId?: number) => {
    try {
      const result = appointmentService.update(id, data as any)
      if (userId) {
        auditService.log({
          userId,
          action: 'update',
          entity: 'appointment',
          entityId: id,
          summary: `تم تعديل الموعد رقم ${id}`,
        })
      }
      return { success: true, data: result }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('appointments:updateStatus', async (_, id: number, status: string, userId?: number) => {
    try {
      appointmentService.updateStatus(id, status)
      if (userId) {
        auditService.log({
          userId,
          action: 'update',
          entity: 'appointment',
          entityId: id,
          summary: `تم تغيير حالة الموعد رقم ${id} إلى ${status}`,
        })
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('appointments:cancel', async (_, id: number, reason: string, userId?: number) => {
    try {
      appointmentService.cancel(id, reason)
      if (userId) {
        auditService.log({
          userId,
          action: 'delete',
          entity: 'appointment',
          entityId: id,
          summary: `تم إلغاء الموعد رقم ${id}`,
        })
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}
