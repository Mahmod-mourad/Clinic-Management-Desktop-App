import { getSqliteDb } from '../db'

export class ReportService {
  getDashboardStats(date: string) {
    const sqlite = getSqliteDb()

    const totalPatients = (sqlite.prepare('SELECT COUNT(*) as c FROM patients WHERE is_active = 1').get() as any).c
    const todayAppointments = (sqlite.prepare(
      "SELECT COUNT(*) as c FROM appointments WHERE date = ?",
    ).get(date) as any).c
    const todayCompleted = (sqlite.prepare(
      "SELECT COUNT(*) as c FROM appointments WHERE date = ? AND status = 'completed'",
    ).get(date) as any).c
    const todayRevenue = (sqlite.prepare(
      "SELECT COALESCE(SUM(amount), 0) as s FROM payments WHERE payment_date = ?",
    ).get(date) as any).s
    const pendingInvoices = (sqlite.prepare(
      "SELECT COUNT(*) as c FROM invoices WHERE status IN ('issued', 'partial')",
    ).get() as any).c
    const pendingAmount = (sqlite.prepare(
      "SELECT COALESCE(SUM(total - paid_amount), 0) as s FROM invoices WHERE status IN ('issued', 'partial')",
    ).get() as any).s

    return {
      totalPatients,
      todayAppointments,
      todayCompleted,
      todayRevenue,
      pendingInvoices,
      pendingAmount,
    }
  }

  getFinancialSummary(start: string, end: string) {
    const sqlite = getSqliteDb()

    const revenue = (sqlite.prepare(
      "SELECT COALESCE(SUM(amount), 0) as s FROM payments WHERE payment_date BETWEEN ? AND ?",
    ).get(start, end) as any).s

    const invoiceCount = (sqlite.prepare(
      "SELECT COUNT(*) as c FROM invoices WHERE issue_date BETWEEN ? AND ?",
    ).get(start, end) as any).c

    const byMethod = sqlite.prepare(
      "SELECT method, COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_date BETWEEN ? AND ? GROUP BY method",
    ).all(start, end)

    const expenses = (sqlite.prepare(
      "SELECT COALESCE(SUM(amount), 0) as s FROM expenses WHERE date BETWEEN ? AND ?",
    ).get(start, end) as any).s

    return { revenue, invoiceCount, byMethod, expenses, net: revenue - expenses }
  }

  getEndOfDayReport(date: string) {
    const sqlite = getSqliteDb()

    const appointments = sqlite.prepare(`
      SELECT a.time_slot, a.status, a.type,
             p.first_name || ' ' || p.last_name AS patient_name,
             p.file_number
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      WHERE a.date = ?
      ORDER BY a.time_slot ASC
    `).all(date) as any[]

    const payments = sqlite.prepare(`
      SELECT
        COALESCE(SUM(amount), 0) as total,
        COALESCE(SUM(CASE WHEN method = 'cash' THEN amount ELSE 0 END), 0) as cash_total,
        COALESCE(SUM(CASE WHEN method = 'card' THEN amount ELSE 0 END), 0) as card_total,
        COALESCE(SUM(CASE WHEN method = 'insurance' THEN amount ELSE 0 END), 0) as insurance_total,
        COUNT(*) as payment_count
      FROM payments WHERE payment_date = ?
    `).get(date) as any

    const newPatients = (sqlite.prepare(`
      SELECT COUNT(*) as count FROM patients
      WHERE DATE(created_at) = ? AND is_active = 1
    `).get(date) as any).count

    const byStatus = appointments.reduce((acc: any, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1
      return acc
    }, {})

    return {
      date,
      appointments,
      totalAppointments:        appointments.length,
      completedCount:           byStatus['completed']  ?? 0,
      cancelledCount:           byStatus['cancelled']  ?? 0,
      noShowCount:              byStatus['no-show']    ?? 0,
      totalRevenuePiasters:     payments.total,
      cashRevenuePiasters:      payments.cash_total,
      cardRevenuePiasters:      payments.card_total,
      insuranceRevenuePiasters: payments.insurance_total,
      newPatients,
    }
  }

  getAppointmentStats(start: string, end: string) {
    const sqlite = getSqliteDb()

    const total = (sqlite.prepare(
      "SELECT COUNT(*) as c FROM appointments WHERE date BETWEEN ? AND ?",
    ).get(start, end) as any).c

    const byStatus = sqlite.prepare(
      "SELECT status, COUNT(*) as count FROM appointments WHERE date BETWEEN ? AND ? GROUP BY status",
    ).all(start, end)

    const byType = sqlite.prepare(
      "SELECT type, COUNT(*) as count FROM appointments WHERE date BETWEEN ? AND ? GROUP BY type",
    ).all(start, end)

    return { total, byStatus, byType }
  }
}

export const reportService = new ReportService()
