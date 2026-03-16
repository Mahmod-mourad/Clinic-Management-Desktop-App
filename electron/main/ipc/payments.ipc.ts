import { ipcMain } from 'electron'
import { paymentService } from '../services/PaymentService'
import { auditService } from '../services/AuditService'
import { requireRole } from './requireRole'

export function registerPaymentsIpc(): void {
  ipcMain.handle('payments:getByInvoice', async (_, invoiceId: number) => {
    try {
      return { success: true, data: paymentService.getByInvoice(invoiceId) }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('payments:create', async (_, data: unknown, userId?: number) => {
    try {
      const result = paymentService.create(data as any)
      if (userId) {
        const d = data as any
        auditService.log({
          userId,
          action: 'payment',
          entity: 'payment',
          entityId: result.id,
          summary: `تم تسجيل دفعة للفاتورة رقم ${d.invoiceId} بقيمة ${d.amount}`,
        })
      }
      return { success: true, data: result }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('payments:delete', async (_, id: number, userId?: number) => {
    try {
      await requireRole(userId, ['admin'])
      paymentService.delete(id)
      if (userId) {
        auditService.log({
          userId,
          action: 'delete',
          entity: 'payment',
          entityId: id,
          summary: `تم حذف دفعة رقم ${id}`,
        })
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}
