import { ipcMain } from 'electron'
import { licenseService } from '../services/LicenseService'

export function registerLicenseHandlers(): void {
  ipcMain.handle('license:getStatus', async () => {
    try { return { success: true, data: licenseService.getStatus() } }
    catch (e) { return { success: false, error: String(e) } }
  })

  ipcMain.handle('license:activate', async (_, key: string) => {
    try { return { success: true, data: licenseService.activate(key) } }
    catch (e) { return { success: false, error: String(e) } }
  })

  ipcMain.handle('license:getMachineId', async () => {
    try { return { success: true, data: licenseService.getMachineId() } }
    catch (e) { return { success: false, error: String(e) } }
  })
}
