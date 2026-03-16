import { ipcMain, app, dialog } from 'electron'
import { backupService } from '../services/BackupService'
import { settingsService } from '../services/SettingsService'
import { requireRole } from './requireRole'

export function registerBackupIpc(): void {
  ipcMain.handle('backup:createNow', async (_, userId?: number) => {
    try {
      await requireRole(userId, ['admin'])
      const result = backupService.createNow()
      return result.success
        ? { success: true, data: result.path }
        : { success: false, error: result.error }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('backup:restore', async (_, filePath: string, userId?: number) => {
    try {
      await requireRole(userId, ['admin'])
      const result = backupService.restore(filePath)
      if (result.success) {
        app.relaunch()
        app.exit(0)
      }
      return result
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('backup:chooseRestorePath', async () => {
    try {
      const filePath = await backupService.chooseRestorePath()
      return { success: true, data: filePath }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('backup:chooseBackupPath', async () => {
    try {
      const chosenPath = await backupService.chooseBackupPath()
      return { success: true, data: chosenPath }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('backup:getLastBackupTime', async () => {
    try {
      return { success: true, data: backupService.getLastBackupTime() }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('backup:toUSB', async () => {
    try {
      return { success: true, data: await backupService.backupToUSB() }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle('backup:toDrive', async () => {
    try {
      const lastPath = settingsService.get('last_backup_path')
      if (!lastPath) return { success: false, error: 'لا توجد نسخة محلية بعد' }
      return { success: true, data: await backupService.uploadToGoogleDrive(lastPath) }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle('system:openFile', async (_, filePath: string) => {
    try {
      const { shell } = await import('electron')
      await shell.openPath(filePath)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('system:saveFileDialog', async (_, name: string, filters: unknown[]) => {
    try {
      const result = await dialog.showSaveDialog({
        defaultPath: name,
        filters: filters as any,
      })
      return { success: true, data: result.canceled ? null : result.filePath }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('system:openFolderDialog', async () => {
    try {
      const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
      return { success: true, data: result.canceled ? null : result.filePaths[0] }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('system:getAppVersion', async () => {
    return { success: true, data: app.getVersion() }
  })

  ipcMain.handle('system:openURL', async (_, url: string) => {
    try {
      const { shell } = await import('electron')
      await shell.openExternal(url)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('system:toggleFullscreen', () => {
    const { BrowserWindow } = require('electron')
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return { success: false }
    win.setFullScreen(!win.isFullScreen())
    return { success: true, isFullscreen: win.isFullScreen() }
  })

  ipcMain.handle('system:isFullscreen', () => {
    const { BrowserWindow } = require('electron')
    return BrowserWindow.getFocusedWindow()?.isFullScreen() ?? false
  })
}
