export function normalizeEgyptianPhone(phone: string): string {
  let digits = phone.replace(/\D/g, '')

  if (digits.startsWith('0')) digits = '2' + digits
  if (!digits.startsWith('20')) digits = '20' + digits

  return digits
}

export function buildWhatsAppURL(phone: string, message: string): string {
  const normalized = normalizeEgyptianPhone(phone)
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}

export function buildAppointmentReminder(params: {
  patientName: string
  clinicName: string
  doctorName: string
  date: string
  timeSlot: string
}): string {
  const { patientName, clinicName, doctorName, date, timeSlot } = params

  const [year, month, day] = date.split('-')
  const formattedDate = `${day}/${month}/${year}`

  const [h, m] = timeSlot.split(':').map(Number)
  const period = h < 12 ? 'صباحاً' : 'مساءً'
  const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h
  const formattedTime = `${hour12}:${String(m).padStart(2, '0')} ${period}`

  return `السلام عليكم ${patientName} 🌿

نذكّركم بموعدكم في *${clinicName}*

📅 التاريخ: ${formattedDate}
⏰ الوقت: ${formattedTime}
👨‍⚕️ الطبيب: ${doctorName}

نرجو الحضور قبل الموعد بـ 10 دقائق.
لتأجيل أو إلغاء الموعد يرجى التواصل معنا.

شكراً لثقتكم 🙏`
}
