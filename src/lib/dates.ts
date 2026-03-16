import { format, isToday, isTomorrow, isYesterday } from 'date-fns'
import { ar } from 'date-fns/locale'

export function formatDate(isoDate: string): string {
  // "15/03/2024"
  return format(new Date(isoDate), 'dd/MM/yyyy')
}

export function formatDateArabic(isoDate: string): string {
  // "الأحد، ١٥ مارس ٢٠٢٤"
  return format(new Date(isoDate), 'EEEE، d MMMM yyyy', { locale: ar })
}

export function formatTime(timeSlot: string): string {
  // "09:30" → "٩:٣٠ ص"
  const [h, m] = timeSlot.split(':').map(Number)
  const period = h < 12 ? 'ص' : 'م'
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

export function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate)
  if (isToday(date)) return 'اليوم'
  if (isTomorrow(date)) return 'غداً'
  if (isYesterday(date)) return 'أمس'
  return formatDate(isoDate)
}

export function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birth = new Date(dateOfBirth)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function todayISO(): string {
  return toISODate(new Date())
}
