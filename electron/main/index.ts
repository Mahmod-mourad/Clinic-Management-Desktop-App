import { app, BrowserWindow } from 'electron'
import { createWindow } from './window'
import { initDb, closeDb } from './db'
import { runMigrations } from './db/migrate'
import { seedDatabase } from './db/seed'
import { registerAllIpc } from './ipc'
import { backupService } from './services/BackupService'
import { recycleBinService } from './services/RecycleBinService'

app.whenReady().then(() => {
  initDb()
  runMigrations()
  seedDatabase()
  registerAllIpc()
  createWindow()

  // Auto backup + auto purge deleted patients (30-day retention)
  backupService.fullAutoBackup().catch(e => console.error('[BACKUP] Auto backup failed:', e))
  recycleBinService.autoPurge()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  closeDb()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => closeDb())
