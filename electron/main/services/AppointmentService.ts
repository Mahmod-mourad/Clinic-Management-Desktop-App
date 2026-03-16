import { getDb } from '../db'
import { appointments, patients } from '../db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'

export class AppointmentService {
  getAll(filters?: { date?: string; status?: string; patientId?: number }) {
    const db = getDb()
    const conditions = []
    if (filters?.date) conditions.push(eq(appointments.date, filters.date))
    if (filters?.status) conditions.push(eq(appointments.status, filters.status as any))
    if (filters?.patientId) conditions.push(eq(appointments.patientId, filters.patientId))

    const query = db
      .select({
        id: appointments.id,
        patientId: appointments.patientId,
        doctorId: appointments.doctorId,
        date: appointments.date,
        timeSlot: appointments.timeSlot,
        duration: appointments.duration,
        type: appointments.type,
        status: appointments.status,
        chiefComplaint: appointments.chiefComplaint,
        notes: appointments.notes,
        cancelReason: appointments.cancelReason,
        createdAt: appointments.createdAt,
        patientName: patients.firstName,
        patientLastName: patients.lastName,
        patientPhone: patients.phone,
        patientFileNumber: patients.fileNumber,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))

    if (conditions.length > 0) {
      return query.where(and(...conditions)).all()
    }
    return query.all()
  }

  getByDate(date: string) {
    return this.getAll({ date })
  }

  getByDateRange(start: string, end: string) {
    const db = getDb()
    return db
      .select({
        id: appointments.id,
        patientId: appointments.patientId,
        date: appointments.date,
        timeSlot: appointments.timeSlot,
        duration: appointments.duration,
        type: appointments.type,
        status: appointments.status,
        chiefComplaint: appointments.chiefComplaint,
        patientName: patients.firstName,
        patientLastName: patients.lastName,
        patientPhone: patients.phone,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .where(and(gte(appointments.date, start), lte(appointments.date, end)))
      .all()
  }

  getById(id: number) {
    const db = getDb()
    return db
      .select({
        id: appointments.id,
        patientId: appointments.patientId,
        doctorId: appointments.doctorId,
        date: appointments.date,
        timeSlot: appointments.timeSlot,
        duration: appointments.duration,
        type: appointments.type,
        status: appointments.status,
        chiefComplaint: appointments.chiefComplaint,
        notes: appointments.notes,
        cancelReason: appointments.cancelReason,
        createdAt: appointments.createdAt,
        patientName: patients.firstName,
        patientLastName: patients.lastName,
        patientPhone: patients.phone,
        patientFileNumber: patients.fileNumber,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .where(eq(appointments.id, id))
      .get() ?? null
  }

  getTodayQueue() {
    const today = new Date().toISOString().split('T')[0]
    return this.getByDate(today)
  }

  getAvailableSlots(date: string, duration: number) {
    const db = getDb()
    const booked = db
      .select({ timeSlot: appointments.timeSlot, duration: appointments.duration })
      .from(appointments)
      .where(
        and(
          eq(appointments.date, date),
          eq(appointments.status, 'scheduled'),
        ),
      )
      .all()

    const startHour = 9
    const endHour = 21
    const slots: string[] = []

    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += duration) {
        const timeSlot = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
        const isBooked = booked.some(b => b.timeSlot === timeSlot)
        if (!isBooked) slots.push(timeSlot)
      }
    }

    return slots
  }

  create(data: {
    patientId: number
    doctorId?: number
    date: string
    timeSlot: string
    duration?: number
    type?: string
    chiefComplaint?: string
    notes?: string
  }) {
    const db = getDb()
    const result = db.insert(appointments).values({
      ...data,
      type: (data.type as any) ?? 'follow-up',
      status: 'scheduled',
    }).run()
    return { id: Number(result.lastInsertRowid) }
  }

  update(id: number, data: Partial<{
    date: string
    timeSlot: string
    duration: number
    type: string
    chiefComplaint: string
    notes: string
    doctorId: number
  }>) {
    const db = getDb()
    db.update(appointments)
      .set({ ...data as any, updatedAt: new Date().toISOString() })
      .where(eq(appointments.id, id))
      .run()
    return this.getById(id)
  }

  updateStatus(id: number, status: string) {
    const db = getDb()
    db.update(appointments)
      .set({ status: status as any, updatedAt: new Date().toISOString() })
      .where(eq(appointments.id, id))
      .run()
  }

  cancel(id: number, reason: string) {
    const db = getDb()
    db.update(appointments)
      .set({ status: 'cancelled', cancelReason: reason, updatedAt: new Date().toISOString() })
      .where(eq(appointments.id, id))
      .run()
  }
}

export const appointmentService = new AppointmentService()
