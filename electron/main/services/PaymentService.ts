import { getDb } from '../db'
import { payments, invoices } from '../db/schema'
import { eq } from 'drizzle-orm'

export class PaymentService {
  getByInvoice(invoiceId: number) {
    const db = getDb()
    return db.select().from(payments).where(eq(payments.invoiceId, invoiceId)).all()
  }

  create(data: {
    invoiceId: number
    amount: number
    paymentDate: string
    method?: 'cash' | 'card' | 'insurance' | 'bank-transfer' | 'other'
    reference?: string
    receivedBy?: number
    notes?: string
  }) {
    const db = getDb()

    const result = db.insert(payments).values({
      invoiceId: data.invoiceId,
      amount: data.amount,
      paymentDate: data.paymentDate,
      method: data.method ?? 'cash',
      reference: data.reference,
      receivedBy: data.receivedBy,
      notes: data.notes,
    }).run()

    // Recalculate paidAmount on the invoice
    const allPayments = this.getByInvoice(data.invoiceId)
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0) + data.amount

    const invoice = db.select().from(invoices).where(eq(invoices.id, data.invoiceId)).get()
    if (invoice) {
      const newStatus = totalPaid >= invoice.total ? 'paid' : totalPaid > 0 ? 'partial' : 'issued'
      db.update(invoices)
        .set({ paidAmount: totalPaid, status: newStatus as any, updatedAt: new Date().toISOString() })
        .where(eq(invoices.id, data.invoiceId))
        .run()
    }

    return { id: Number(result.lastInsertRowid) }
  }

  delete(id: number) {
    const db = getDb()
    const payment = db.select().from(payments).where(eq(payments.id, id)).get()
    if (!payment) return

    db.delete(payments).where(eq(payments.id, id)).run()

    // Recalculate paidAmount
    const remaining = this.getByInvoice(payment.invoiceId)
    const totalPaid = remaining.reduce((sum, p) => sum + p.amount, 0)
    const invoice = db.select().from(invoices).where(eq(invoices.id, payment.invoiceId)).get()
    if (invoice) {
      const newStatus = totalPaid >= invoice.total ? 'paid' : totalPaid > 0 ? 'partial' : 'issued'
      db.update(invoices)
        .set({ paidAmount: totalPaid, status: newStatus as any, updatedAt: new Date().toISOString() })
        .where(eq(invoices.id, payment.invoiceId))
        .run()
    }
  }
}

export const paymentService = new PaymentService()
