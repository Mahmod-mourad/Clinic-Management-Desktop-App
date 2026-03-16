import { ipcMain } from 'electron'
import { settingsService } from '../services/SettingsService'
import { auditService } from '../services/AuditService'
import { requireRole } from './requireRole'

export function registerSettingsIpc(): void {
  ipcMain.handle('settings:getAll', async () => {
    try {
      return { success: true, data: settingsService.getAll() }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('settings:get', async (_, key: string) => {
    try {
      return { success: true, data: settingsService.get(key) }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('settings:set', async (_, key: string, value: string, userId?: number) => {
    try {
      await requireRole(userId, ['admin'])
      settingsService.set(key, value)
      auditService.log({
        userId: userId!,
        action: 'update',
        entity: 'settings',
        summary: `تم تغيير الإعداد: ${key}`,
      })
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('settings:setMany', async (_, data: Record<string, string>, userId?: number) => {
    try {
      await requireRole(userId, ['admin'])
      settingsService.setMany(data)
      auditService.log({
        userId: userId!,
        action: 'update',
        entity: 'settings',
        summary: 'تم تحديث إعدادات العيادة',
      })
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('settings:getUsers', async (_, userId?: number) => {
    try {
      await requireRole(userId, ['admin'])
      return { success: true, data: settingsService.getUsers() }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('settings:createUser', async (_, data: unknown, userId?: number) => {
    try {
      await requireRole(userId, ['admin'])
      settingsService.createUser(data as any)
      auditService.log({
        userId: userId!,
        action: 'create',
        entity: 'user',
        summary: `تم إنشاء مستخدم جديد: ${(data as any).username}`,
      })
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('settings:updateUser', async (_, id: number, data: unknown, userId?: number) => {
    try {
      await requireRole(userId, ['admin'])
      settingsService.updateUser(id, data as any)
      auditService.log({
        userId: userId!,
        action: 'update',
        entity: 'user',
        entityId: id,
        summary: `تم تعديل بيانات المستخدم رقم ${id}`,
      })
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}
