import { ipcMain } from 'electron'
import { reportService } from '../services/ReportService'
import { requireRole } from './requireRole'

export function registerReportsIpc(): void {
  ipcMain.handle('reports:getDashboardStats', async (_, date: string) => {
    try {
      return { success: true, data: reportService.getDashboardStats(date) }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('reports:getFinancialSummary', async (_, start: string, end: string, userId?: number) => {
    try {
      await requireRole(userId, ['admin'])
      return { success: true, data: reportService.getFinancialSummary(start, end) }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('reports:getAppointmentStats', async (_, start: string, end: string) => {
    try {
      return { success: true, data: reportService.getAppointmentStats(start, end) }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('reports:getEndOfDay', async (_, date: string, userId?: number) => {
    try {
      await requireRole(userId, ['admin'])
      return { success: true, data: reportService.getEndOfDayReport(date) }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}
