import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { formatTime } from '@/lib/dates'
import { CAIRO_REGULAR, CAIRO_BOLD } from '@/assets/fonts/cairo'

Font.register({
  family: 'Cairo',
  fonts: [
    { src: CAIRO_REGULAR, fontWeight: 'normal' },
    { src: CAIRO_BOLD, fontWeight: 'bold' },
  ],
})

const fmtNum = (piasters: number) => (piasters / 100).toFixed(2)

// Format date as DD/MM/YYYY – pure numbers, no bidi needed
const fmtDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

const s = StyleSheet.create({
  page: {
    fontFamily: 'Cairo',
    fontSize: 10,
    paddingHorizontal: 36,
    paddingVertical: 32,
    backgroundColor: '#ffffff',
  },

  /* ── Header ── */
  header: { alignItems: 'center', marginBottom: 20 },
  headerAccent: {
    width: 48,
    height: 4,
    backgroundColor: '#1d4ed8',
    borderRadius: 2,
    marginBottom: 10,
  },
  clinicName: { fontSize: 20, fontWeight: 'bold', color: '#1d4ed8', textAlign: 'center' },
  doctorName: { fontSize: 11, color: '#374151', marginTop: 4, textAlign: 'center' },
  reportTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 6,
    textAlign: 'center',
  },
  reportDate: { fontSize: 10, color: '#6b7280', marginTop: 3, textAlign: 'center' },

  divider: { borderBottom: '1.5 solid #e5e7eb', marginBottom: 16 },

  /* ── Sections ── */
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1d4ed8',
    borderBottom: '1.5 solid #1d4ed8',
    paddingBottom: 4,
    marginBottom: 10,
    textAlign: 'right',
  },

  /* ── Summary grid ── */
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    border: '1 solid #e2e8f0',
    alignItems: 'flex-end',
  },
  statCardFull: {
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    border: '1 solid #e2e8f0',
    alignItems: 'center',
    marginBottom: 6,
  },
  statLabel: { fontSize: 9, color: '#6b7280', marginBottom: 4, textAlign: 'right' },
  statValue: { fontSize: 16, fontWeight: 'bold', textAlign: 'right', color: '#111827' },

  /* ── Revenue ── */
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderBottom: '1 solid #f1f5f9',
  },
  revenueLabel: { color: '#374151', fontSize: 10, textAlign: 'right' },
  revenueAmount: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  revenueCurrency: { fontSize: 9, color: '#6b7280' },
  revenueValue: { fontWeight: 'bold', fontSize: 10, color: '#111827' },
  revenueTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    marginTop: 6,
    border: '1 solid #bfdbfe',
  },
  revenueTotalLabel: { fontWeight: 'bold', fontSize: 11, color: '#1e40af', textAlign: 'right' },
  revenueTotalAmount: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  revenueTotalCurrency: { fontSize: 10, color: '#4b72c0' },
  revenueTotalValue: { fontWeight: 'bold', fontSize: 13, color: '#1d4ed8' },

  /* ── Table ── */
  tableHead: {
    flexDirection: 'row',
    backgroundColor: '#1d4ed8',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 5,
    marginBottom: 2,
  },
  tableHeadText: { color: '#ffffff', fontWeight: 'bold', fontSize: 9, textAlign: 'right' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottom: '1 solid #f1f5f9',
  },
  tableRowAlt: { backgroundColor: '#f8fafc' },
  tableCell: { fontSize: 9, color: '#111827', textAlign: 'right' },

  /* Fixed column widths to prevent overflow */
  colTime:   { width: 60, flexShrink: 0 },
  colName:   { flex: 1, paddingHorizontal: 4 },
  colFile:   { width: 65, flexShrink: 0 },
  colStatus: { width: 55, flexShrink: 0, textAlign: 'center' },

  /* ── Status colors ── */
  badgeCompleted: { color: '#15803d', fontWeight: 'bold' },
  badgeCancelled: { color: '#dc2626', fontWeight: 'bold' },
  badgeNoShow:    { color: '#d97706', fontWeight: 'bold' },
  badgeDefault:   { color: '#374151' },

  /* ── Footer ── */
  footer: {
    marginTop: 20,
    borderTop: '1 solid #e5e7eb',
    paddingTop: 8,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 8.5,
  },
})

const statusLabels: Record<string, string> = {
  completed:     'مكتمل',
  cancelled:     'ملغي',
  'no-show':     'لم يحضر',
  arrived:       'وصل',
  scheduled:     'مجدول',
  confirmed:     'مؤكد',
  'in-progress': 'يُعالج',
}

const statusStyle: Record<string, object> = {
  completed:  s.badgeCompleted,
  cancelled:  s.badgeCancelled,
  'no-show':  s.badgeNoShow,
}

export interface EndOfDayReportData {
  date: string
  clinicName: string
  doctorName: string
  appointments: any[]
  totalAppointments: number
  completedCount: number
  cancelledCount: number
  noShowCount: number
  totalRevenuePiasters: number
  cashRevenuePiasters: number
  cardRevenuePiasters: number
  insuranceRevenuePiasters: number
  newPatients: number
}

export function EndOfDayPDF({ data }: { data: EndOfDayReportData }) {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const printedAt = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerAccent} />
          <Text style={s.clinicName}>{data.clinicName}</Text>
          <Text style={s.doctorName}>{data.doctorName}</Text>
          <Text style={s.reportTitle}>تقرير نهاية اليوم</Text>
          <Text style={s.reportDate}>{fmtDate(data.date)}</Text>
        </View>

        <View style={s.divider} />

        {/* ── Summary ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>ملخص اليوم</Text>

          {/* Row 1 */}
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={s.statLabel}>مكتملة</Text>
              <Text style={[s.statValue, { color: '#15803d' }]}>{data.completedCount}</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statLabel}>إجمالي المواعيد</Text>
              <Text style={s.statValue}>{data.totalAppointments}</Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={s.statLabel}>مرضى جدد</Text>
              <Text style={[s.statValue, { color: '#7c3aed' }]}>{data.newPatients}</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statLabel}>ملغية</Text>
              <Text style={[s.statValue, { color: '#dc2626' }]}>{data.cancelledCount}</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statLabel}>لم يحضر</Text>
              <Text style={[s.statValue, { color: '#d97706' }]}>{data.noShowCount}</Text>
            </View>
          </View>
        </View>

        {/* ── Revenue ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>الإيرادات</Text>

          <View style={s.revenueRow}>
            <View style={s.revenueAmount}>
              <Text style={s.revenueValue}>{fmtNum(data.cashRevenuePiasters)}</Text>
              <Text style={s.revenueCurrency}>ج.م</Text>
            </View>
            <Text style={s.revenueLabel}>كاش</Text>
          </View>
          <View style={s.revenueRow}>
            <View style={s.revenueAmount}>
              <Text style={s.revenueValue}>{fmtNum(data.cardRevenuePiasters)}</Text>
              <Text style={s.revenueCurrency}>ج.م</Text>
            </View>
            <Text style={s.revenueLabel}>كارت</Text>
          </View>
          {data.insuranceRevenuePiasters > 0 && (
            <View style={s.revenueRow}>
              <View style={s.revenueAmount}>
                <Text style={s.revenueValue}>{fmtNum(data.insuranceRevenuePiasters)}</Text>
                <Text style={s.revenueCurrency}>ج.م</Text>
              </View>
              <Text style={s.revenueLabel}>تأمين</Text>
            </View>
          )}

          <View style={s.revenueTotalRow}>
            <View style={s.revenueTotalAmount}>
              <Text style={s.revenueTotalValue}>{fmtNum(data.totalRevenuePiasters)}</Text>
              <Text style={s.revenueTotalCurrency}>ج.م</Text>
            </View>
            <Text style={s.revenueTotalLabel}>الإجمالي</Text>
          </View>
        </View>

        {/* ── Appointments table ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>قائمة المواعيد</Text>

          {/* Head */}
          <View style={s.tableHead}>
            <Text style={[s.tableHeadText, s.colStatus]}>الحالة</Text>
            <Text style={[s.tableHeadText, s.colFile]}>رقم الملف</Text>
            <Text style={[s.tableHeadText, s.colName]}>المريض</Text>
            <Text style={[s.tableHeadText, s.colTime]}>الوقت</Text>
          </View>

          {data.appointments.map((a, i) => (
            <View key={i} style={[s.tableRow, i % 2 !== 0 ? s.tableRowAlt : {}]}>
              <Text style={[s.tableCell, s.colStatus, (statusStyle[a.status] ?? s.badgeDefault) as any]}>
                {statusLabels[a.status] ?? a.status}
              </Text>
              <Text style={[s.tableCell, s.colFile]}>{a.file_number}</Text>
              <Text style={[s.tableCell, s.colName]}>{a.patient_name}</Text>
              <Text style={[s.tableCell, s.colTime]}>{formatTime(a.time_slot)}</Text>
            </View>
          ))}
        </View>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <Text>طبع من نظام عيادتي</Text>
          <Text>{printedAt}</Text>
        </View>

      </Page>
    </Document>
  )
}
