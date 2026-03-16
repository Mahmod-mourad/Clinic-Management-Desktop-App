import QRCode from 'qrcode'

// Generates a base64 PNG data URL by drawing onto a DOM canvas.
// Using toCanvas() + canvas.toDataURL() avoids the Node.js canvas
// detection issue in Electron's renderer process.
export async function generateQRBase64(text: string): Promise<string> {
  const canvas = document.createElement('canvas')
  await QRCode.toCanvas(canvas, text, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 120,
    color: {
      dark:  '#000000',
      light: '#ffffff',
    },
  })
  return canvas.toDataURL('image/png')
}

// Build the QR content string for an invoice
export function buildInvoiceQRContent(params: {
  invoiceNumber: string
  patientName:   string
  totalPiasters: number
  issueDate:     string
  clinicName:    string
}): string {
  const total = (params.totalPiasters / 100).toFixed(2)
  const [y, m, d] = params.issueDate.split('T')[0].split('-')
  const dateFormatted = `${d}/${m}/${y}`

  return [
    `عيادة: ${params.clinicName}`,
    `فاتورة: ${params.invoiceNumber}`,
    `المريض: ${params.patientName}`,
    `المبلغ: ${total} ج.م`,
    `التاريخ: ${dateFormatted}`,
  ].join('\n')
}
