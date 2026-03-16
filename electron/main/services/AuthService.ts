import crypto from 'crypto'
import { getDb } from '../db'
import { users, settings } from '../db/schema'
import { eq } from 'drizzle-orm'

export interface AuthUser {
  id: number
  name: string
  username: string
  role: 'admin' | 'doctor' | 'receptionist'
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'clinic-salt').digest('hex')
}

export class AuthService {
  login(username: string, password: string): AuthUser | null {
    const db = getDb()
    const user = db.select().from(users).where(eq(users.username, username)).get()

    if (!user || !user.isActive) return null
    if (hashPassword(password) !== user.passwordHash) return null

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role as AuthUser['role'],
    }
  }

  changePassword(userId: number, currentPassword: string, newPassword: string): boolean {
    const db = getDb()
    const user = db.select().from(users).where(eq(users.id, userId)).get()
    if (!user) return false
    if (hashPassword(currentPassword) !== user.passwordHash) return false

    db.update(users)
      .set({ passwordHash: hashPassword(newPassword), updatedAt: new Date().toISOString() })
      .where(eq(users.id, userId))
      .run()

    return true
  }

  private getSetting(key: string): string | null {
    const db = getDb()
    const row = db.select().from(settings).where(eq(settings.key, key)).get()
    return row?.value ?? null
  }

  private setSetting(key: string, value: string): void {
    const db = getDb()
    const existing = db.select().from(settings).where(eq(settings.key, key)).get()
    const now = new Date().toISOString()
    if (existing) {
      db.update(settings).set({ value, updatedAt: now }).where(eq(settings.key, key)).run()
    } else {
      db.insert(settings).values({ key, value, createdAt: now, updatedAt: now }).run()
    }
  }

  requestPasswordReset(email: string): { success: boolean; otp?: string; error?: string } {
    const adminEmail = this.getSetting('admin_email')
    if (!adminEmail || adminEmail.trim().toLowerCase() !== email.trim().toLowerCase()) {
      return { success: false, error: 'البريد الإلكتروني غير مسجل في النظام' }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    this.setSetting('reset_otp', otp)
    this.setSetting('reset_otp_expiry', expiry)

    return { success: true, otp }
  }

  verifyOtpAndResetPassword(otp: string, newPassword: string): { success: boolean; error?: string } {
    const storedOtp    = this.getSetting('reset_otp')
    const storedExpiry = this.getSetting('reset_otp_expiry')

    if (!storedOtp || storedOtp !== otp) {
      return { success: false, error: 'رمز التحقق غير صحيح' }
    }

    if (!storedExpiry || new Date() > new Date(storedExpiry)) {
      return { success: false, error: 'انتهت صلاحية رمز التحقق — اطلب رمزاً جديداً' }
    }

    const db = getDb()
    const admin = db.select().from(users).where(eq(users.role, 'admin')).get()
    if (!admin) return { success: false, error: 'لم يتم العثور على حساب المدير' }

    db.update(users)
      .set({ passwordHash: hashPassword(newPassword), updatedAt: new Date().toISOString() })
      .where(eq(users.id, admin.id))
      .run()

    this.setSetting('reset_otp', '')
    this.setSetting('reset_otp_expiry', '')

    return { success: true }
  }
}

export const authService = new AuthService()
