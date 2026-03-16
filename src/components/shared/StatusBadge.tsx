import { cn } from '@/lib/utils'

type AppointmentStatus = 'scheduled' | 'confirmed' | 'arrived' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'
type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'partial' | 'cancelled'

const appointmentConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  scheduled:     { label: 'مجدول',   className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  confirmed:     { label: 'مؤكد',    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  arrived:       { label: 'وصل',     className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  'in-progress': { label: 'يُعالج',  className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  completed:     { label: 'مكتمل',   className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  cancelled:     { label: 'ملغي',    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  'no-show':     { label: 'لم يحضر', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
}

const invoiceConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  draft:     { label: 'مسودة',  className: 'bg-gray-100 text-gray-700' },
  issued:    { label: 'صادرة',  className: 'bg-blue-100 text-blue-700' },
  paid:      { label: 'مدفوعة', className: 'bg-green-100 text-green-700' },
  partial:   { label: 'جزئي',   className: 'bg-amber-100 text-amber-700' },
  cancelled: { label: 'ملغاة',  className: 'bg-red-100 text-red-700' },
}

interface Props {
  type: 'appointment' | 'invoice'
  status: string
  className?: string
}

export default function StatusBadge({ type, status, className }: Props) {
  const config = type === 'appointment'
    ? appointmentConfig[status as AppointmentStatus]
    : invoiceConfig[status as InvoiceStatus]

  if (!config) return null

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      config.className,
      className,
    )}>
      {config.label}
    </span>
  )
}
