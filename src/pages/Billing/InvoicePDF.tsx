import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer'
import { formatEGPSimple } from '@/lib/currency'
import { CAIRO_REGULAR, CAIRO_BOLD } from '@/assets/fonts/cairo'

Font.register({
  family: 'Cairo',
  fonts: [
    { src: CAIRO_REGULAR, fontWeight: 'normal' },
    { src: CAIRO_BOLD, fontWeight: 'bold' },
  ],
})

export interface InvoicePDFData {
  invoiceNumber:     string
  issueDate:         string
  patientName:       string
  patientPhone?:     string
  patientFileNumber?: string
  clinicName:        string
  clinicPhone:       string
  doctorName:        string
  items: Array<{
    description: string
    quantity:    number
    unitPrice:   number  // piasters
    total:       number  // piasters
  }>
  subtotal:    number   // piasters
  discount:    number   // piasters
  total:       number   // piasters
  paidAmount:  number   // piasters
  notes?:      string
  status:      string
  qrBase64?:   string
}

const statusLabels: Record<string, string> = {
  issued:    'صادرة',
  partial:   'جزئي',
  paid:      'مدفوعة',
  cancelled: 'ملغاة',
}

const s = StyleSheet.create({
  page:      { fontFamily: 'Cairo', fontSize: 10, padding: 32 },
  header:    { textAlign: 'center', marginBottom: 20 },
  clinicName: { fontSize: 18, fontWeight: 'bold', color: '#1d4ed8' },
  doctorName: { fontSize: 10, color: '#6b7280', marginTop: 2 },
  clinicPhone: { fontSize: 9, color: '#6b7280', marginTop: 1 },
  divider:   { borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginVertical: 8 },
  invoiceTitle: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  infoRow:   { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 12 },
  infoBlock: { gap: 3 },
  label:     { color: '#6b7280', fontSize: 9 },
  value:     { fontWeight: 'bold', fontSize: 10 },
  statusBadge: { fontSize: 9, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: '#f3f4f6', color: '#374151' },
  // Table
  tableHead: { flexDirection: 'row-reverse', backgroundColor: '#1d4ed8', paddingVertical: 5, paddingHorizontal: 8, borderRadius: 4, marginBottom: 2 },
  tableHeadText: { color: '#ffffff', fontWeight: 'bold', fontSize: 9 },
  tableRow:  { flexDirection: 'row-reverse', paddingVertical: 4, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  col1: { flex: 4 },
  col2: { flex: 1, textAlign: 'center' },
  col3: { flex: 2, textAlign: 'center' },
  col4: { flex: 2, textAlign: 'center' },
  // Totals
  totalsSection: { marginTop: 12, alignItems: 'flex-start' },
  totalsBox: { width: 200, gap: 3 },
  totalRow:  { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 2 },
  totalLabel: { color: '#6b7280' },
  totalValue: { fontWeight: 'bold' },
  grandTotal: { borderTopWidth: 1, borderTopColor: '#1d4ed8', paddingTop: 4, marginTop: 2 },
  grandTotalValue: { fontSize: 13, color: '#1d4ed8', fontWeight: 'bold' },
  // Notes
  notesSection: { marginTop: 10, backgroundColor: '#f9fafb', padding: 8, borderRadius: 4 },
  notesLabel: { fontSize: 9, color: '#6b7280', marginBottom: 2 },
  notesText:  { fontSize: 10 },
  // QR + Signature row
  qrSection: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-end',
    marginTop:      16,
    paddingTop:     12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  qrBox: { alignItems: 'center', gap: 3 },
  qrImage: { width: 72, height: 72 },
  qrLabel: { fontSize: 7, color: '#9ca3af', textAlign: 'center' },
  signatureBox: { alignItems: 'center', gap: 4 },
  signatureLine: { width: 120, borderBottomWidth: 1, borderBottomColor: '#d1d5db', marginBottom: 4 },
  signatureLabel: { fontSize: 8, color: '#6b7280' },
  // Footer
  footer: { marginTop: 12, textAlign: 'center', color: '#9ca3af', fontSize: 8 },
})

export function InvoicePDF({ data }: { data: InvoicePDFData }) {
  const [y, m, d] = data.issueDate.split('T')[0].split('-')
  const dateFormatted = `${d}/${m}/${y}`
  const remaining = data.total - data.paidAmount

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Clinic header */}
        <View style={s.header}>
          <Text style={s.clinicName}>{data.clinicName}</Text>
          <Text style={s.doctorName}>{data.doctorName}</Text>
          {data.clinicPhone ? <Text style={s.clinicPhone}>{data.clinicPhone}</Text> : null}
        </View>

        <View style={s.divider} />
        <Text style={s.invoiceTitle}>فاتورة ضريبية مبسطة</Text>

        {/* Invoice info + Patient info */}
        <View style={s.infoRow}>
          <View style={s.infoBlock}>
            <Text style={s.label}>رقم الفاتورة</Text>
            <Text style={s.value}>{data.invoiceNumber}</Text>
            <Text style={[s.label, { marginTop: 4 }]}>التاريخ</Text>
            <Text style={s.value}>{dateFormatted}</Text>
            <Text style={[s.label, { marginTop: 4 }]}>الحالة</Text>
            <Text style={s.statusBadge}>{statusLabels[data.status] ?? data.status}</Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.label}>المريض</Text>
            <Text style={s.value}>{data.patientName}</Text>
            {data.patientPhone ? (
              <>
                <Text style={[s.label, { marginTop: 4 }]}>الهاتف</Text>
                <Text style={s.value}>{data.patientPhone}</Text>
              </>
            ) : null}
            {data.patientFileNumber ? (
              <>
                <Text style={[s.label, { marginTop: 4 }]}>رقم الملف</Text>
                <Text style={s.value}>{data.patientFileNumber}</Text>
              </>
            ) : null}
          </View>
        </View>

        <View style={s.divider} />

        {/* Items table */}
        <View style={s.tableHead}>
          <Text style={[s.tableHeadText, s.col1]}>الخدمة / البند</Text>
          <Text style={[s.tableHeadText, s.col2]}>الكمية</Text>
          <Text style={[s.tableHeadText, s.col3]}>سعر الوحدة</Text>
          <Text style={[s.tableHeadText, s.col4]}>الإجمالي</Text>
        </View>
        {data.items.map((item, i) => (
          <View key={i} style={[s.tableRow, { backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }]}>
            <Text style={s.col1}>{item.description}</Text>
            <Text style={[s.col2, { textAlign: 'center' }]}>{item.quantity}</Text>
            <Text style={[s.col3, { textAlign: 'center' }]}>{formatEGPSimple(item.unitPrice)}</Text>
            <Text style={[s.col4, { textAlign: 'center' }]}>{formatEGPSimple(item.total)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={s.totalsSection}>
          <View style={s.totalsBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>المجموع الفرعي</Text>
              <Text style={s.totalValue}>{formatEGPSimple(data.subtotal)}</Text>
            </View>
            {data.discount > 0 && (
              <View style={s.totalRow}>
                <Text style={[s.totalLabel, { color: '#16a34a' }]}>الخصم</Text>
                <Text style={[s.totalValue, { color: '#16a34a' }]}>- {formatEGPSimple(data.discount)}</Text>
              </View>
            )}
            <View style={[s.totalRow, s.grandTotal]}>
              <Text style={{ fontWeight: 'bold' }}>الإجمالي</Text>
              <Text style={s.grandTotalValue}>{formatEGPSimple(data.total)}</Text>
            </View>
            {data.paidAmount > 0 && (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>المدفوع</Text>
                <Text style={[s.totalValue, { color: '#16a34a' }]}>{formatEGPSimple(data.paidAmount)}</Text>
              </View>
            )}
            {remaining > 0 && (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>المتبقي</Text>
                <Text style={[s.totalValue, { color: '#dc2626' }]}>{formatEGPSimple(remaining)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Notes */}
        {data.notes ? (
          <View style={s.notesSection}>
            <Text style={s.notesLabel}>ملاحظات</Text>
            <Text style={s.notesText}>{data.notes}</Text>
          </View>
        ) : null}

        {/* QR + Signature row */}
        <View style={s.qrSection}>
          <View style={s.signatureBox}>
            <View style={s.signatureLine} />
            <Text style={s.signatureLabel}>توقيع المريض</Text>
          </View>

          {data.qrBase64 ? (
            <View style={s.qrBox}>
              <Image style={s.qrImage} src={data.qrBase64} />
              <Text style={s.qrLabel}>امسح للتحقق</Text>
            </View>
          ) : null}
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text>شكراً لثقتكم • {data.clinicName} • {data.clinicPhone}</Text>
        </View>
      </Page>
    </Document>
  )
}
