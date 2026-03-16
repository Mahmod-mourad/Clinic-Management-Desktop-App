import { getDb } from '../db'
import { invoices, invoiceItems, patients } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { settingsService } from './SettingsService'

export class InvoiceService {
  getAll(filters?: { status?: string; patientId?: number }) {
    const db = getDb()
    const conditions = []
    if (filters?.status) conditions.push(eq(invoices.status, filters.status as any))
    if (filters?.patientId) conditions.push(eq(invoices.patientId, filters.patientId))

    const query = db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        patientId: invoices.patientId,
        appointmentId: invoices.appointmentId,
        issueDate: invoices.issueDate,
        subtotal: invoices.subtotal,
        discount: invoices.discount,
        discountType: invoices.discountType,
        tax: invoices.tax,
        total: invoices.total,
        status: invoices.status,
        paidAmount: invoices.paidAmount,
        notes: invoices.notes,
        createdAt: invoices.createdAt,
        patientName: patients.firstName,
        patientLastName: patients.lastName,
        patientPhone: patients.phone,
        patientFileNumber: patients.fileNumber,
      })
      .from(invoices)
      .leftJoin(patients, eq(invoices.patientId, patients.id))

    if (conditions.length > 0) {
      return query.where(and(...conditions)).all()
    }
    return query.all()
  }

  getById(id: number) {
    const db = getDb()
    const invoice = db.select().from(invoices).where(eq(invoices.id, id)).get()
    if (!invoice) return null
    const items = db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id)).all()
    return { ...invoice, items }
  }

  getByPatient(patientId: number) {
    return this.getAll({ patientId })
  }

  create(data: {
    patientId: number
    appointmentId?: number
    issueDate: string
    subtotal: number
    discount?: number
    discountType?: 'fixed' | 'percentage'
    discountNote?: string
    tax?: number
    total: number
    notes?: string
    items: Array<{
      serviceId?: number
      description: string
      quantity: number
      unitPrice: number
      total: number
    }>
  }) {
    const db = getDb()
    const invoiceNumber = settingsService.getNextInvoiceNumber()

    const result = db.insert(invoices).values({
      invoiceNumber,
      patientId: data.patientId,
      appointmentId: data.appointmentId,
      issueDate: data.issueDate,
      subtotal: data.subtotal,
      discount: data.discount ?? 0,
      discountType: data.discountType ?? 'fixed',
      discountNote: data.discountNote,
      tax: data.tax ?? 0,
      total: data.total,
      status: 'issued',
      paidAmount: 0,
      notes: data.notes,
    }).run()

    const invoiceId = Number(result.lastInsertRowid)

    for (const item of data.items) {
      db.insert(invoiceItems).values({ ...item, invoiceId }).run()
    }

    return { id: invoiceId, invoiceNumber }
  }

  update(id: number, data: Partial<{
    discount: number
    discountType: 'fixed' | 'percentage'
    discountNote: string
    tax: number
    total: number
    notes: string
    status: string
  }>) {
    const db = getDb()
    const existing = db.select({ status: invoices.status }).from(invoices).where(eq(invoices.id, id)).get()

    if (!existing) throw new Error('الفاتورة غير موجودة')
    if (existing.status === 'paid') {
      throw new Error('لا يمكن تعديل فاتورة مدفوعة — أنشئ إشعار دائن بدلاً من ذلك')
    }
    if (existing.status === 'cancelled') {
      throw new Error('لا يمكن تعديل فاتورة ملغاة')
    }

    db.update(invoices)
      .set({ ...data as any, updatedAt: new Date().toISOString() })
      .where(eq(invoices.id, id))
      .run()
    return this.getById(id)
  }

  cancel(id: number) {
    const db = getDb()
    db.update(invoices)
      .set({ status: 'cancelled', updatedAt: new Date().toISOString() })
      .where(eq(invoices.id, id))
      .run()
  }

  createCreditNote(originalInvoiceId: number, reason: string) {
    const original = this.getById(originalInvoiceId) as any
    if (!original) throw new Error('الفاتورة الأصلية غير موجودة')

    return this.create({
      patientId: original.patientId,
      issueDate: new Date().toISOString().split('T')[0],
      subtotal: -Math.abs(original.subtotal),
      discount: 0,
      tax: 0,
      total: -Math.abs(original.total),
      notes: `إشعار دائن للفاتورة رقم: ${original.invoiceNumber}\nالسبب: ${reason}`,
      items: (original.items as any[]).map((item: any) => ({
        serviceId:   item.serviceId,
        description: `إشعار دائن — ${item.description}`,
        quantity:    item.quantity,
        unitPrice:   -Math.abs(item.unitPrice),
        total:       -Math.abs(item.total),
      })),
    })
  }

  getOutstanding() {
    return this.getAll({ status: 'partial' }).concat(this.getAll({ status: 'issued' }))
  }

  getNextNumber() {
    return settingsService.getNextInvoiceNumber()
  }
}

export const invoiceService = new InvoiceService()
