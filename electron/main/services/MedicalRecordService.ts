import { getDb } from '../db'
import { medicalRecords } from '../db/schema'
import { eq } from 'drizzle-orm'

export class MedicalRecordService {
  getByPatient(patientId: number) {
    const db = getDb()
    return db.select().from(medicalRecords).where(eq(medicalRecords.patientId, patientId)).all()
  }

  getById(id: number) {
    const db = getDb()
    return db.select().from(medicalRecords).where(eq(medicalRecords.id, id)).get() ?? null
  }

  getByAppointment(appointmentId: number) {
    const db = getDb()
    return db.select().from(medicalRecords).where(eq(medicalRecords.appointmentId, appointmentId)).get() ?? null
  }

  create(data: {
    patientId: number
    appointmentId?: number
    doctorId?: number
    visitDate: string
    chiefComplaint?: string
    history?: string
    vitalSigns?: string
    examination?: string
    diagnosis: string
    diagnosisCode?: string
    treatment?: string
    prescription?: string
    labRequests?: string
    followUpDate?: string
    followUpNotes?: string
    attachments?: string
    notes?: string
  }) {
    const db = getDb()
    const result = db.insert(medicalRecords).values(data).run()
    return { id: Number(result.lastInsertRowid) }
  }

  update(id: number, data: Partial<{
    chiefComplaint: string
    history: string
    vitalSigns: string
    examination: string
    diagnosis: string
    diagnosisCode: string
    treatment: string
    prescription: string
    labRequests: string
    followUpDate: string
    followUpNotes: string
    attachments: string
    notes: string
  }>) {
    const db = getDb()
    db.update(medicalRecords)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(medicalRecords.id, id))
      .run()
    return this.getById(id)
  }

  delete(id: number) {
    const db = getDb()
    db.delete(medicalRecords).where(eq(medicalRecords.id, id)).run()
  }
}

export const medicalRecordService = new MedicalRecordService()
