import { ipcMain } from 'electron'
import { recycleBinService } from '../services/RecycleBinService'
import { requireRole } from './requireRole'

export function registerRecycleIpc(): void {
  ipcMain.handle('recycle:getDeletedPatients', async (_, userId?: number) => {
    try {
      await requireRole(userId, ['admin'])
      return { success: true, data: recycleBinService.getDeletedPatients() }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle('recycle:restorePatient', async (_, id: number, userId?: number) => {
    try {
      await requireRole(userId, ['admin'])
      recycleBinService.restorePatient(id)
      return { success: true }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle('recycle:permanentDelete', async (_, id: number, userId?: number) => {
    try {
      await requireRole(userId, ['admin'])
      recycleBinService.permanentDelete(id)
      return { success: true }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })
}
