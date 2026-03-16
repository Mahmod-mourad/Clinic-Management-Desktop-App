import { ipcMain } from 'electron'
import { authService } from '../services/AuthService'
import { auditService } from '../services/AuditService'

export function registerAuthIpc(): void {
  ipcMain.handle('auth:login', async (_, username: string, password: string) => {
    try {
      const user = authService.login(username, password)
      if (!user) return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }
      auditService.log({ userId: user.id, action: 'login', entity: 'user', summary: `دخول: ${user.name}` })
      return { success: true, data: user }
    } catch (err) {
      console.error('[IPC] auth:login error:', err)
      return { success: false, error: 'حدث خطأ أثناء تسجيل الدخول' }
    }
  })

  ipcMain.handle('auth:logout', async () => {
    return { success: true }
  })

  ipcMain.handle('auth:changePassword', async (_, userId: number, current: string, next: string) => {
    try {
      const ok = authService.changePassword(userId, current, next)
      if (!ok) return { success: false, error: 'كلمة المرور الحالية غير صحيحة' }
      auditService.log({ userId, action: 'update', entity: 'user', entityId: userId, summary: `تم تغيير كلمة المرور للمستخدم رقم ${userId}` })
      return { success: true }
    } catch (err) {
      console.error('[IPC] auth:changePassword error:', err)
      return { success: false, error: 'حدث خطأ' }
    }
  })

  ipcMain.handle('auth:requestReset', async (_, email: string) => {
    try {
      return authService.requestPasswordReset(email)
    } catch (err: any) {
      console.error('[IPC] auth:requestReset error:', err)
      return { success: false, error: err?.message ?? 'حدث خطأ' }
    }
  })

  ipcMain.handle('auth:verifyReset', async (_, otp: string, newPassword: string) => {
    try {
      return authService.verifyOtpAndResetPassword(otp, newPassword)
    } catch (err) {
      console.error('[IPC] auth:verifyReset error:', err)
      return { success: false, error: 'حدث خطأ أثناء إعادة تعيين كلمة المرور' }
    }
  })
}
