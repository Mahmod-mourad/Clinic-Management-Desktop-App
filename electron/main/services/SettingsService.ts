import crypto from 'crypto'
import { getDb, getSqliteDb } from '../db'
import { settings, users } from '../db/schema'
import { eq } from 'drizzle-orm'

export class SettingsService {
  getAll(): Record<string, string> {
    const db = getDb()
    const rows = db.select().from(settings).all()
    return Object.fromEntries(rows.map(r => [r.key, r.value ?? '']))
  }

  get(key: string): string | null {
    const db = getDb()
    const row = db.select().from(settings).where(eq(settings.key, key)).get()
    return row?.value ?? null
  }

  set(key: string, value: string): void {
    const db = getDb()
    db.insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedAt: new Date().toISOString() },
      })
      .run()
  }

  setMany(data: Record<string, string>): void {
    const sqlite = getSqliteDb()
    const stmt = sqlite.prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP',
    )
    const insertMany = sqlite.transaction((entries: [string, string][]) => {
      for (const [key, value] of entries) {
        stmt.run(key, value)
      }
    })
    insertMany(Object.entries(data))
  }

  getNextPatientNumber(): string {
    const current = parseInt(this.get('last_patient_number') ?? '0')
    const next = current + 1
    this.set('last_patient_number', String(next))
    return `P-${String(next).padStart(4, '0')}`
  }

  getNextInvoiceNumber(): string {
    const year = new Date().getFullYear()
    const key = `last_invoice_number_${year}`
    const current = parseInt(this.get(key) ?? '0')
    const next = current + 1
    this.set(key, String(next))
    return `INV-${year}-${String(next).padStart(4, '0')}`
  }

  getUsers() {
    const db = getDb()
    return db.select({
      id: users.id,
      name: users.name,
      username: users.username,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    }).from(users).all()
  }

  createUser(data: { name: string; username: string; password: string; role: string }) {
    const passwordHash = crypto.createHash('sha256').update(data.password + 'clinic-salt').digest('hex')
    const db = getDb()
    return db.insert(users).values({
      name: data.name,
      username: data.username,
      passwordHash,
      role: data.role as 'admin' | 'doctor' | 'receptionist',
    }).run()
  }

  updateUser(id: number, data: Partial<{ name: string; role: string; isActive: boolean; password: string }>) {
    const db = getDb()
    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() }
    if (data.name !== undefined) updateData.name = data.name
    if (data.role !== undefined) updateData.role = data.role
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.password !== undefined) {
      updateData.passwordHash = crypto.createHash('sha256').update(data.password + 'clinic-salt').digest('hex')
    }
    return db.update(users).set(updateData).where(eq(users.id, id)).run()
  }
}

export const settingsService = new SettingsService()
