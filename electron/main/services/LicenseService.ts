import crypto from 'crypto'
import { machineIdSync } from 'node-machine-id'
import { settingsService } from './SettingsService'

// Loaded from .env at build time via electron.vite.config.ts — never hardcoded
const HMAC_SECRET = process.env.HMAC_SECRET ?? ''
const TRIAL_DAYS = 30

export interface LicenseStatus {
  isValid:       boolean
  isTrial:       boolean
  daysRemaining: number
  expiresAt:     string | null
  machineId:     string
  error?:        string
}

export class LicenseService {
  getMachineId(): string {
    try {
      return machineIdSync().substring(0, 8).toUpperCase()
    } catch {
      return 'UNKNOWN1'
    }
  }

  // ── Called on YOUR server / local tool to generate keys for customers ──
  // Format: CLINIC-{MachineID8}-{ExpiryYYYYMMDD}-{Checksum8}
  // Example: CLINIC-A1B2C3D4-20251231-3F9A2B1C
  static generateKey(machineId: string, validDays: number = 365): string {
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + validDays)
    const expiryStr = expiry.toISOString().split('T')[0].replace(/-/g, '')

    const payload = `${machineId.toUpperCase()}-${expiryStr}`
    const checksum = crypto
      .createHmac('sha256', HMAC_SECRET)
      .update(payload)
      .digest('hex')
      .substring(0, 8)
      .toUpperCase()

    return `CLINIC-${machineId.toUpperCase()}-${expiryStr}-${checksum}`
  }

  // ── Validate a key entered by the user ──
  validateKey(key: string): { valid: boolean; expiresAt?: Date; error?: string } {
    // Expected format: CLINIC-XXXXXXXX-YYYYMMDD-ZZZZZZZZ
    const parts = key.trim().toUpperCase().split('-')

    if (parts.length !== 4 || parts[0] !== 'CLINIC') {
      return { valid: false, error: 'صيغة المفتاح غير صحيحة' }
    }

    const [, keyMachineId, expiryStr, checksum] = parts

    // Verify machine ID
    const thisMachineId = this.getMachineId()
    if (keyMachineId !== thisMachineId) {
      return { valid: false, error: `هذا المفتاح مخصص لجهاز آخر (${keyMachineId})` }
    }

    // Verify checksum
    const payload = `${keyMachineId}-${expiryStr}`
    const expectedChecksum = crypto
      .createHmac('sha256', HMAC_SECRET)
      .update(payload)
      .digest('hex')
      .substring(0, 8)
      .toUpperCase()

    if (checksum !== expectedChecksum) {
      return { valid: false, error: 'مفتاح غير صحيح — تأكد من الكتابة بشكل صحيح' }
    }

    // Parse and check expiry
    if (expiryStr.length !== 8) {
      return { valid: false, error: 'تاريخ انتهاء غير صحيح في المفتاح' }
    }
    const year  = parseInt(expiryStr.substring(0, 4))
    const month = parseInt(expiryStr.substring(4, 6)) - 1
    const day   = parseInt(expiryStr.substring(6, 8))
    const expiresAt = new Date(year, month, day, 23, 59, 59)

    if (expiresAt < new Date()) {
      return { valid: false, error: 'انتهت صلاحية هذا المفتاح' }
    }

    return { valid: true, expiresAt }
  }

  // ── Activate the app with a key ──
  activate(key: string): { success: boolean; error?: string } {
    const result = this.validateKey(key)
    if (!result.valid) return { success: false, error: result.error }

    settingsService.set('license_key', key.trim().toUpperCase())
    settingsService.set('license_expires_at', result.expiresAt!.toISOString())
    settingsService.set('license_activated_at', new Date().toISOString())

    return { success: true }
  }

  // ── Get current license status ──
  getStatus(): LicenseStatus {
    const machineId = this.getMachineId()

    // Check if activated with a valid key
    const licenseKey = settingsService.get('license_key')
    if (licenseKey) {
      const result = this.validateKey(licenseKey)
      if (result.valid && result.expiresAt) {
        const daysRemaining = Math.ceil(
          (result.expiresAt.getTime() - Date.now()) / 86_400_000
        )
        return {
          isValid: true,
          isTrial: false,
          daysRemaining,
          expiresAt: result.expiresAt.toISOString(),
          machineId,
        }
      }
      // Key expired — fall through to trial check
    }

    // Trial mode
    let installedAt = settingsService.get('app_installed_at')
    if (!installedAt) {
      installedAt = new Date().toISOString()
      settingsService.set('app_installed_at', installedAt)
    }

    const daysSinceInstall = Math.floor(
      (Date.now() - new Date(installedAt).getTime()) / 86_400_000
    )
    const daysRemaining = Math.max(0, TRIAL_DAYS - daysSinceInstall)

    return {
      isValid: daysRemaining > 0,
      isTrial: true,
      daysRemaining,
      expiresAt: null,
      machineId,
      error: daysRemaining === 0 ? 'انتهت فترة التجربة المجانية' : undefined,
    }
  }
}

export const licenseService = new LicenseService()
