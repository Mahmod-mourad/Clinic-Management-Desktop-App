import { getSqliteDb } from './index'
import crypto from 'crypto'

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'clinic-salt').digest('hex')
}

export function seedDatabase(): void {
  const sqlite = getSqliteDb()

  const settingsToSeed = [
    { key: 'clinic_name', value: 'عيادة الدكتور' },
    { key: 'clinic_name_en', value: 'Medical Clinic' },
    { key: 'doctor_name', value: 'د. اسم الطبيب' },
    { key: 'doctor_specialty', value: 'طب عام' },
    { key: 'doctor_phone', value: '01000000000' },
    { key: 'clinic_address', value: 'القاهرة، مصر' },
    { key: 'clinic_logo', value: '' },
    { key: 'last_patient_number', value: '0' },
    { key: `last_invoice_number_${new Date().getFullYear()}`, value: '0' },
    { key: 'backup_path', value: '' },
    { key: 'backup_enabled', value: 'true' },
    { key: 'backup_frequency', value: 'daily' },
    { key: 'last_backup_time', value: '' },
    { key: 'currency', value: 'EGP' },
    { key: 'tax_rate', value: '0' },
    { key: 'appointment_duration', value: '30' },
    { key: 'clinic_start_time', value: '09:00' },
    { key: 'clinic_end_time', value: '21:00' },
    { key: 'theme', value: 'light' },
    { key: 'language', value: 'ar' },
  ]

  const insertSetting = sqlite.prepare(
    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
  )
  for (const s of settingsToSeed) {
    insertSetting.run(s.key, s.value)
  }

  const userCount = sqlite.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count === 0) {
    sqlite.prepare(
      'INSERT INTO users (name, username, password_hash, role) VALUES (?, ?, ?, ?)',
    ).run('مدير النظام', 'admin', hashPassword('clinic123'), 'admin')

    console.log('[SEED] Default admin created: admin / clinic123')
  }

  const serviceCount = sqlite.prepare('SELECT COUNT(*) as count FROM services').get() as { count: number }
  if (serviceCount.count === 0) {
    const insertService = sqlite.prepare(
      'INSERT INTO services (name, name_en, category, price, duration, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
    )
    const defaultServices: [string, string, string, number, number, number][] = [
      ['كشف طبي عام', 'General Checkup', 'كشف', 30000, 30, 1],
      ['كشف أول مرة', 'First Visit', 'كشف', 50000, 45, 2],
      ['متابعة', 'Follow-up', 'كشف', 20000, 20, 3],
      ['استشارة', 'Consultation', 'استشارة', 25000, 30, 4],
    ]
    for (const s of defaultServices) {
      insertService.run(...s)
    }
    console.log('[SEED] Default services created')
  }

  console.log('[SEED] Database seeding completed')
}
