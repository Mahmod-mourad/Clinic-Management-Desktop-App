import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { formatTime } from '@/lib/dates'
import { CAIRO_REGULAR, CAIRO_BOLD } from '@/assets/fonts/cairo'

Font.register({
  family: 'Cairo',
  fonts: [
    { src: CAIRO_REGULAR, fontWeight: 'normal' },
    { src: CAIRO_BOLD,    fontWeight: 'bold' },
  ],
})

const fmtDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

const typeLabels: Record<string, string> = {
  'first-visit':  'أول مرة',
  'follow-up':    'متابعة',
  'consultation': 'استشارة',
  'procedure':    'إجراء',
  'checkup':      'فحص',
}

const statusLabels: Record<string, string> = {
  scheduled:     'مجدول',
  confirmed:     'مؤكد',
  arrived:       'وصل',
  'in-progress': 'يُعالج',
  completed:     'مكتمل',
  cancelled:     'ملغي',
  'no-show':     'لم يحضر',
}

const statusColor: Record<string, string> = {
  completed: '#15803d',
  cancelled: '#dc2626',
  'no-show': '#d97706',
}

const s = StyleSheet.create({
  page: {
    fontFamily: 'Cairo',
    fontSize: 10,
    paddingHorizontal: 36,
    paddingVertical: 32,
    backgroundColor: '#ffffff',
  },
  header: { alignItems: 'center', marginBottom: 20 },
  accent: { width: 48, height: 4, backgroundColor: '#1d4ed8', borderRadius: 2, marginBottom: 10 },
  clinicName: { fontSize: 20, fontWeight: 'bold', color: '#1d4ed8', textAlign: 'center' },
  doctorName: { fontSize: 11, color: '#374151', marginTop: 4, textAlign: 'center' },
  title: { fontSize: 13, fontWeight: 'bold', color: '#111827', marginTop: 6, textAlign: 'center' },
  date:  { fontSize: 10, color: '#6b7280', marginTop: 3, textAlign: 'center' },
  divider: { borderBottom: '1.5 solid #e5e7eb', marginBottom: 16 },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: '#1d4ed8',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 5,
    marginBottom: 2,
  },
  headText: { color: '#ffffff', fontWeight: 'bold', fontSize: 9, textAlign: 'right' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottom: '1 solid #f1f5f9',
  },
  tableRowAlt: { backgroundColor: '#f8fafc' },
  cell: { fontSize: 9, color: '#111827', textAlign: 'right' },
  colTime:   { width: 55, flexShrink: 0 },
  colName:   { flex: 1, paddingHorizontal: 4 },
  colType:   { width: 65, flexShrink: 0 },
  colStatus: { width: 55, flexShrink: 0 },
  colDoctor: { width: 80, flexShrink: 0 },
  footer: {
    marginTop: 20,
    borderTop: '1 solid #e5e7eb',
    paddingTop: 8,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 8.5,
  },
})

export interface AppointmentSchedulePDFData {
  date: string
  clinicName: string
  doctorName: string
  appointments: Array<{
    id: number
    timeSlot: string
    patientName: string | null
    patientLastName: string | null
    type: string
    status: string
  }>
}

export function AppointmentSchedulePDF({ data }: { data: AppointmentSchedulePDFData }) {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const printedAt = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View style={s.accent} />
          <Text style={s.clinicName}>{data.clinicName}</Text>
          <Text style={s.doctorName}>{data.doctorName}</Text>
          <Text style={s.title}>جدول المواعيد</Text>
          <Text style={s.date}>{fmtDate(data.date)}</Text>
        </View>

        <View style={s.divider} />

        {/* Table head */}
        <View style={s.tableHead}>
          <Text style={[s.headText, s.colStatus]}>الحالة</Text>
          <Text style={[s.headText, s.colDoctor]}>الدكتور</Text>
          <Text style={[s.headText, s.colType]}>النوع</Text>
          <Text style={[s.headText, s.colName]}>اسم المريض</Text>
          <Text style={[s.headText, s.colTime]}>الوقت</Text>
        </View>

        {/* Rows */}
        {data.appointments.map((a, i) => {
          const fullName = [a.patientName, a.patientLastName].filter(Boolean).join(' ')
          const color = statusColor[a.status]
          return (
            <View key={a.id} style={[s.tableRow, i % 2 !== 0 ? s.tableRowAlt : {}]}>
              <Text style={[s.cell, s.colStatus, color ? { color, fontWeight: 'bold' } : {}]}>
                {statusLabels[a.status] ?? a.status}
              </Text>
              <Text style={[s.cell, s.colDoctor]}>{data.doctorName}</Text>
              <Text style={[s.cell, s.colType]}>{typeLabels[a.type] ?? a.type}</Text>
              <Text style={[s.cell, s.colName]}>{fullName}</Text>
              <Text style={[s.cell, s.colTime]}>{formatTime(a.timeSlot)}</Text>
            </View>
          )
        })}

        {data.appointments.length === 0 && (
          <Text style={{ textAlign: 'center', color: '#9ca3af', marginTop: 20 }}>لا توجد مواعيد</Text>
        )}

        {/* Footer */}
        <View style={s.footer}>
          <Text>طبع من نظام عيادتي</Text>
          <Text>{printedAt}</Text>
        </View>
      </Page>
    </Document>
  )
}
