import { app, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { settingsService } from './SettingsService'

export class BackupService {
  private getDbPath(): string {
    return path.join(app.getPath('userData'), 'clinic.db')
  }

  createNow(): { success: boolean; path?: string; error?: string } {
    try {
      const backupDir = settingsService.get('backup_path') || app.getPath('documents')
      const now = new Date()
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const backupPath = path.join(backupDir, `clinic-backup-${timestamp}.db`)

      fs.copyFileSync(this.getDbPath(), backupPath)
      settingsService.set('last_backup_time', now.toISOString())
      settingsService.set('last_backup_path', backupPath)

      this.cleanupLocalBackups(backupDir)

      return { success: true, path: backupPath }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }

  private cleanupLocalBackups(backupDir: string, keep = 30): void {
    try {
      const files = fs
        .readdirSync(backupDir)
        .filter((f: string) => /^clinic-backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.db$/.test(f))
        .map((f: string) => ({
          name: f,
          time: fs.statSync(path.join(backupDir, f)).mtime.getTime(),
        }))
        .sort((a: { name: string; time: number }, b: { name: string; time: number }) => b.time - a.time)

      files
        .slice(keep)
        .forEach((f: { name: string; time: number }) => fs.unlinkSync(path.join(backupDir, f.name)))
    } catch {
      // تجاهل أخطاء الـ cleanup لعدم إيقاف النسخ الرئيسية
    }
  }

  restore(backupPath: string): { success: boolean; error?: string } {
    try {
      if (!fs.existsSync(backupPath)) {
        return { success: false, error: 'ملف النسخة الاحتياطية غير موجود' }
      }
      const dbPath = this.getDbPath()
      const tempPath = dbPath + '.bak'
      fs.copyFileSync(dbPath, tempPath)
      fs.copyFileSync(backupPath, dbPath)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }

  async chooseBackupPath(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'اختر مجلد النسخ الاحتياطي',
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const chosen = result.filePaths[0]
    settingsService.set('backup_path', chosen)
    return chosen
  }

  async chooseRestorePath(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      title: 'اختر ملف النسخة الاحتياطية للاستعادة',
      filters: [{ name: 'قاعدة بيانات العيادة', extensions: ['db'] }],
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  }

  getLastBackupTime(): string | null {
    return settingsService.get('last_backup_time')
  }

  async backupToUSB(): Promise<{ success: boolean; path?: string; error?: string }> {
    const candidates =
      process.platform === 'win32'
        ? ['D:\\', 'E:\\', 'F:\\', 'G:\\', 'H:\\']
        : (() => {
            try {
              return fs
                .readdirSync('/Volumes')
                .filter((v: string) => v !== 'Macintosh HD')
                .map((v: string) => `/Volumes/${v}`)
            } catch {
              return []
            }
          })()

    const usbDrive = candidates.find((p) => {
      try {
        fs.accessSync(p, fs.constants.W_OK)
        return true
      } catch {
        return false
      }
    })

    if (!usbDrive) {
      return { success: false, error: 'لا يوجد USB متصل أو قابل للكتابة' }
    }

    const localResult = this.createNow()
    if (!localResult.success || !localResult.path) {
      return { success: false, error: localResult.error }
    }

    const backupDir = path.join(usbDrive, 'عيادتي_Backup')
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true })

    const dest = path.join(backupDir, path.basename(localResult.path))
    fs.copyFileSync(localResult.path, dest)

    const files = fs
      .readdirSync(backupDir)
      .filter((f: string) => f.endsWith('.db'))
      .map((f: string) => ({
        name: f,
        time: fs.statSync(path.join(backupDir, f)).mtime.getTime(),
      }))
      .sort((a: { name: string; time: number }, b: { name: string; time: number }) => b.time - a.time)

    files
      .slice(15)
      .forEach((f: { name: string; time: number }) => fs.unlinkSync(path.join(backupDir, f.name)))

    return { success: true, path: dest }
  }

  async uploadToGoogleDrive(
    backupFilePath: string,
  ): Promise<{ success: boolean; fileId?: string; error?: string }> {
    const { drive: driveClient } = require('@googleapis/drive')
    const { OAuth2Client } = require('google-auth-library')
    const tokenPath = path.join(app.getPath('userData'), 'gdrive_token.json')

    if (!fs.existsSync(tokenPath)) {
      return { success: false, error: 'لم يتم ربط Google Drive — اذهب للإعدادات أولاً' }
    }

    try {
      const credentials = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'))
      const auth = new OAuth2Client(
        credentials.client_id,
        credentials.client_secret,
        'urn:ietf:wg:oauth:2.0:oob',
      )
      auth.setCredentials(credentials)

      const drive = driveClient({ version: 'v3', auth })

      const folderSearch = await drive.files.list({
        q: `name='عيادتي Backups' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id)',
      })

      let folderId: string
      if (folderSearch.data.files?.length) {
        folderId = folderSearch.data.files[0].id!
      } else {
        const folder = await drive.files.create({
          requestBody: {
            name: 'عيادتي Backups',
            mimeType: 'application/vnd.google-apps.folder',
          },
          fields: 'id',
        })
        folderId = folder.data.id!
      }

      const response = await drive.files.create({
        requestBody: { name: path.basename(backupFilePath), parents: [folderId] },
        media: {
          mimeType: 'application/octet-stream',
          body: fs.createReadStream(backupFilePath),
        },
        fields: 'id',
      })

      const existing = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        orderBy: 'createdTime asc',
        fields: 'files(id)',
      })
      const driveFiles = existing.data.files ?? []
      if (driveFiles.length > 10) {
        for (const f of driveFiles.slice(0, driveFiles.length - 10)) {
          await drive.files.delete({ fileId: f.id! })
        }
      }

      return { success: true, fileId: response.data.id! }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }

  async fullAutoBackup(): Promise<void> {
    const enabled = settingsService.get('backup_enabled')
    if (enabled !== 'true') return

    const lastBackup = settingsService.get('last_backup_time')
    if (lastBackup) {
      const hoursSince = (Date.now() - new Date(lastBackup).getTime()) / 3_600_000
      if (hoursSince < 20) return
    }

    const local = this.createNow()
    console.log('[BACKUP] Local:', local.success ? '✓' : local.error)

    const usb = await this.backupToUSB()
    console.log('[BACKUP] USB:', usb.success ? `✓ ${usb.path}` : usb.error)

    if (local.path && settingsService.get('gdrive_enabled') === 'true') {
      const drive = await this.uploadToGoogleDrive(local.path)
      console.log('[BACKUP] Drive:', drive.success ? `✓ ${drive.fileId}` : drive.error)
    }

    const destinations = [
      local.success ? 'محلي' : null,
      usb.success ? 'USB' : null,
      settingsService.get('gdrive_enabled') === 'true' ? 'Drive' : null,
    ]
      .filter(Boolean)
      .join(' + ')

    settingsService.set('last_backup_destinations', destinations)
  }
}

export const backupService = new BackupService()
