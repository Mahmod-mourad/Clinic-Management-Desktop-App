import { ipcMain } from 'electron'
import { invoiceService } from '../services/InvoiceService'
import { auditService } from '../services/AuditService'
import { requireRole } from './requireRole'

export function registerInvoicesIpc(): void {
  ipcMain.handle('invoices:getAll', async (_, filters?: unknown) => {
    try {
      return { success: true, data: invoiceService.getAll(filters as any) }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('invoices:getById', async (_, id: number) => {
    try {
      return { success: true, data: invoiceService.getById(id) }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('invoices:getByPatient', async (_, patientId: number) => {
    try {
      return { success: true, data: invoiceService.getByPatient(patientId) }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('invoices:create', async (_, data: unknown, userId?: number) => {
    try {
      const result = invoiceService.create(data as any)
      if (userId) {
        auditService.log({
          userId,
          action: 'create',
          entity: 'invoice',
          entityId: result.id,
          summary: `تم إنشاء فاتورة للمريض رقم ${(data as any).patientId}`,
        })
      }
      return { success: true, data: result }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('invoices:update', async (_, id: number, data: unknown, userId?: number) => {
    try {
      const result = invoiceService.update(id, data as any)
      if (userId) {
        auditService.log({
          userId,
          action: 'update',
          entity: 'invoice',
          entityId: id,
          summary: `تم تعديل الفاتورة رقم ${id}`,
        })
      }
      return { success: true, data: result }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('invoices:cancel', async (_, id: number, userId?: number) => {
    try {
      await requireRole(userId, ['admin', 'doctor'])
      invoiceService.cancel(id)
      auditService.log({
        userId: userId!,
        action: 'delete',
        entity: 'invoice',
        entityId: id,
        summary: `تم إلغاء الفاتورة رقم ${id}`,
      })
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('invoices:getOutstanding', async () => {
    try {
      return { success: true, data: invoiceService.getOutstanding() }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('invoices:getNextNumber', async () => {
    try {
      return { success: true, data: invoiceService.getNextNumber() }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}
