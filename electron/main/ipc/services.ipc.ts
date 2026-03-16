import { ipcMain } from 'electron'
import { serviceCatalogService } from '../services/ServiceCatalogService'

export function registerServicesIpc(): void {
  ipcMain.handle('services:getAll', async (_, includeInactive?: boolean) => {
    try {
      return { success: true, data: serviceCatalogService.getAll(includeInactive) }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('services:create', async (_, data: unknown) => {
    try {
      return { success: true, data: serviceCatalogService.create(data as any) }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('services:update', async (_, id: number, data: unknown) => {
    try {
      serviceCatalogService.update(id, data as any)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('services:toggleActive', async (_, id: number) => {
    try {
      serviceCatalogService.toggleActive(id)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}
