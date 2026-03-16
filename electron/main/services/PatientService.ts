import { getDb, getSqliteDb } from '../db'
import { patients } from '../db/schema'
import { eq } from 'drizzle-orm'
import { settingsService } from './SettingsService'

function normalizeAr(text: string): string {
  if (!text) return ''
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .trim()
    .toLowerCase()
}

type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown'
type Gender = 'male' | 'female'

export interface CreatePatientData {
  firstName: string
  lastName: string
  phone: string
  firstNameEn?: string
  lastNameEn?: string
  phone2?: string
  nationalId?: string
  dateOfBirth?: string
  gender?: Gender
  address?: string
  bloodType?: BloodType
  allergies?: string
  chronicDiseases?: string
  emergencyContact?: string
  notes?: string
}

export interface UpdatePatientData {
  firstName?: string
  lastName?: string
  phone?: string
  firstNameEn?: string
  lastNameEn?: string
  phone2?: string
  nationalId?: string
  dateOfBirth?: string
  gender?: Gender
  address?: string
  bloodType?: BloodType
  allergies?: string
  chronicDiseases?: string
  emergencyContact?: string
  notes?: string
}

export interface PatientFilters {
  search?: string
  isActive?: boolean
  page?: number
  pageSize?: number
}

function buildSearchIndex(data: {
  firstName: string
  lastName: string
  phone: string
  phone2?: string | null
  nationalId?: string | null
}): string {
  return [
    normalizeAr(data.firstName),
    normalizeAr(data.lastName),
    data.phone,
    data.phone2 ?? '',
    data.nationalId ?? '',
  ].join(' ').trim()
}

export class PatientService {
  getAll(filters?: PatientFilters) {
    const sqlite = getSqliteDb()
    const page = filters?.page ?? 1
    const pageSize = filters?.pageSize ?? 20
    const offset = (page - 1) * pageSize
    const isActive = filters?.isActive !== undefined ? filters.isActive : true

    const whereActive = `p.is_active = ${isActive ? 1 : 0}`
    const whereSearch = filters?.search ? `AND p.search_index LIKE ?` : ''
    const searchParam = filters?.search ? `%${normalizeAr(filters.search)}%` : undefined

    const dataStmt = sqlite.prepare(`
      SELECT p.*,
        COALESCE(a.visit_count, 0) as visit_count,
        a.last_visit
      FROM patients p
      LEFT JOIN (
        SELECT patient_id,
               COUNT(*) as visit_count,
               MAX(date) as last_visit
        FROM appointments
        WHERE status = 'completed'
        GROUP BY patient_id
      ) a ON a.patient_id = p.id
      WHERE ${whereActive} ${whereSearch}
      ORDER BY p.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `)

    const countStmt = sqlite.prepare(`
      SELECT COUNT(*) as total FROM patients p
      WHERE ${whereActive} ${whereSearch}
    `)

    const data = searchParam ? dataStmt.all(searchParam) : dataStmt.all()
    const total = searchParam
      ? (countStmt.get(searchParam) as any).total
      : (countStmt.get() as any).total

    return { data, total, page, pageSize }
  }

  getById(id: number) {
    const db = getDb()
    return db.select().from(patients).where(eq(patients.id, id)).get() ?? null
  }

  search(query: string) {
    const sqlite = getSqliteDb()
    const normalized = normalizeAr(query)
    return sqlite.prepare(`
      SELECT id, first_name as firstName, last_name as lastName, phone, file_number as fileNumber
      FROM patients
      WHERE is_active = 1 AND (search_index LIKE ? OR phone LIKE ? OR file_number LIKE ?)
      ORDER BY created_at DESC LIMIT 15
    `).all(`%${normalized}%`, `%${query}%`, `%${query}%`)
  }

  create(data: CreatePatientData) {
    const db = getDb()
    const fileNumber = settingsService.getNextPatientNumber()
    const searchIndex = buildSearchIndex(data)

    const result = db.insert(patients).values({
      fileNumber,
      searchIndex,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      firstNameEn: data.firstNameEn,
      lastNameEn: data.lastNameEn,
      phone2: data.phone2,
      nationalId: data.nationalId,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      address: data.address,
      bloodType: data.bloodType,
      allergies: data.allergies,
      chronicDiseases: data.chronicDiseases,
      emergencyContact: data.emergencyContact,
      notes: data.notes,
      isActive: true,
    }).run()

    return { id: Number(result.lastInsertRowid), fileNumber }
  }

  update(id: number, data: UpdatePatientData) {
    const db = getDb()
    const existing = this.getById(id)
    if (!existing) return null

    const searchIndex = buildSearchIndex({
      firstName: data.firstName ?? existing.firstName,
      lastName: data.lastName ?? existing.lastName,
      phone: data.phone ?? existing.phone,
      phone2: data.phone2 ?? existing.phone2,
      nationalId: data.nationalId ?? existing.nationalId,
    })

    db.update(patients)
      .set({
        searchIndex,
        updatedAt: new Date().toISOString(),
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        firstNameEn: data.firstNameEn,
        lastNameEn: data.lastNameEn,
        phone2: data.phone2,
        nationalId: data.nationalId,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        address: data.address,
        bloodType: data.bloodType,
        allergies: data.allergies,
        chronicDiseases: data.chronicDiseases,
        emergencyContact: data.emergencyContact,
        notes: data.notes,
      })
      .where(eq(patients.id, id))
      .run()

    return this.getById(id)
  }

  softDelete(id: number, deletedBy?: number, reason?: string) {
    getSqliteDb()
      .prepare(
        `UPDATE patients
         SET is_active = 0,
             deleted_at = CURRENT_TIMESTAMP,
             deleted_by = ?,
             delete_reason = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .run(deletedBy ?? null, reason ?? null, id)
  }

  getNextFileNumber() {
    return settingsService.getNextPatientNumber()
  }
}

export const patientService = new PatientService()
