import { ipcMain } from 'electron'
import { auditService } from '../services/AuditService'
import { requireRole } from './requireRole'

export function registerAuditIpc(): void {
  ipcMain.handle('audit:getLog', async (_, filters, userId?: number) => {
    try {
      await requireRole(userId, ['admin'])
      return { success: true, data: auditService.getLog(filters) }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })
}
