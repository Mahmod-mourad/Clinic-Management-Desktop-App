import { useState } from 'react'
import { ChevronRight, ChevronLeft, Plus, Calendar, MessageCircle, Printer } from 'lucide-react'
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { ar } from 'date-fns/locale'
import { useQuery } from '@tanstack/react-query'
import { pdf } from '@react-pdf/renderer'
import { cn } from '@/lib/utils'
import StatusBadge from '@/components/shared/StatusBadge'
import BookingModal from './BookingModal'
import MonthView from './MonthView'
import { AppointmentSchedulePDF } from './AppointmentSchedulePDF'
import { formatTime } from '@/lib/dates'
import { toast } from 'sonner'
import { buildWhatsAppURL, buildAppointmentReminder } from '@/lib/whatsapp'

type ViewMode = 'day' | 'week' | 'month'

interface AppointmentRow {
  id: number
  date: string
  timeSlot: string
  duration: number
  status: string
  type: string
  patientName: string | null
  patientLastName: string | null
  patientPhone: string | null
  chiefComplaint: string | null
}

export default function AppointmentsPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [editingId, setEditingId] = useState<number | undefined>()

  const dateStr = format(currentDate, 'yyyy-MM-dd')

  const { data: appointments = [], refetch } = useQuery({
    queryKey: ['appointments', viewMode, dateStr],
    queryFn: async () => {
      if (viewMode === 'day') {
        const r = await window.api.appointments.getByDate(dateStr)
        return r.success ? (r.data as AppointmentRow[]) : []
      }
      if (viewMode === 'week') {
        const start = format(startOfWeek(currentDate, { weekStartsOn: 6 }), 'yyyy-MM-dd')
        const end   = format(endOfWeek(currentDate, { weekStartsOn: 6 }), 'yyyy-MM-dd')
        const r = await window.api.appointments.getByDateRange(start, end)
        return r.success ? (r.data as AppointmentRow[]) : []
      }
      return []
    },
  })

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => window.api.settings.getAll().then(r => r.data as any),
  })

  const navigate = (direction: 'prev' | 'next') => {
    if (viewMode === 'day') {
      setCurrentDate(d => direction === 'next' ? addDays(d, 1) : subDays(d, 1))
    } else if (viewMode === 'week') {
      setCurrentDate(d => direction === 'next' ? addWeeks(d, 1) : subWeeks(d, 1))
    } else {
      setCurrentDate(d => direction === 'next' ? addMonths(d, 1) : subMonths(d, 1))
    }
  }

  const updateStatus = async (id: number, status: string) => {
    const r = await window.api.appointments.updateStatus(id, status)
    if (r.success) {
      toast.success('تم تحديث الحالة')
      refetch()
    } else {
      toast.error(r.error ?? 'حدث خطأ')
    }
  }

  const openEdit = (id: number) => {
    setEditingId(id)
    setShowBookingModal(true)
  }

  const handlePrint = async () => {
    const clinicName = settingsData?.clinic_name ?? 'العيادة'
    const doctorName = settingsData?.doctor_name ?? 'الطبيب'

    let appts: AppointmentRow[] = []
    if (viewMode === 'day') {
      appts = appointments
    } else if (viewMode === 'week') {
      appts = appointments
    } else {
      // For month view, fetch current day's appointments as fallback
      const r = await window.api.appointments.getByDate(dateStr)
      appts = r.success ? (r.data as AppointmentRow[]) : []
    }

    const docData = {
      date: dateStr,
      clinicName,
      doctorName,
      appointments: appts,
    }

    try {
      const blob = await pdf(<AppointmentSchedulePDF data={docData} />).toBlob()
      const url = URL.createObjectURL(blob)
      const win = window.open(url, '_blank')
      win?.addEventListener('load', () => {
        win.print()
        URL.revokeObjectURL(url)
      })
    } catch {
      toast.error('حدث خطأ أثناء الطباعة')
    }
  }

  const headerLabel = () => {
    if (viewMode === 'month') return format(currentDate, 'MMMM yyyy', { locale: ar })
    return format(currentDate, 'EEEE، d MMMM yyyy', { locale: ar })
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
        {/* Date navigation */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('next')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-sm bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-lg font-medium hover:bg-primary-100 transition-colors"
          >
            اليوم
          </button>
          <button onClick={() => navigate('prev')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {headerLabel()}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Print button */}
          <button
            onClick={handlePrint}
            title="طباعة جدول المواعيد"
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* View toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['day', 'week', 'month'] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-colors',
                  viewMode === v
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm font-medium'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
                )}
              >
                {v === 'day' ? 'يوم' : v === 'week' ? 'أسبوع' : 'شهر'}
              </button>
            ))}
          </div>

          <button
            onClick={() => { setEditingId(undefined); setShowBookingModal(true) }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            موعد جديد
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="page-content">
        {viewMode === 'day' && (
          <DayView
            appointments={appointments}
            onUpdateStatus={updateStatus}
            onNewAppointment={() => { setEditingId(undefined); setShowBookingModal(true) }}
            onEditAppointment={openEdit}
          />
        )}
        {viewMode === 'week' && (
          <WeekView
            currentDate={currentDate}
            appointments={appointments}
            onDayClick={(date) => {
              setCurrentDate(date)
              setViewMode('day')
            }}
          />
        )}
        {viewMode === 'month' && (
          <MonthView
            currentDate={currentDate}
            onAppointmentClick={(id, date) => {
              setCurrentDate(new Date(date))
              openEdit(id)
            }}
          />
        )}
      </div>

      {showBookingModal && (
        <BookingModal
          onClose={() => { setShowBookingModal(false); setEditingId(undefined) }}
          onSuccess={() => { setShowBookingModal(false); setEditingId(undefined); refetch() }}
          defaultDate={dateStr}
          editingAppointmentId={editingId}
        />
      )}
    </div>
  )
}

// ─── Day View ──────────────────────────────────────────────────

function DayView({ appointments, onUpdateStatus, onNewAppointment, onEditAppointment }: {
  appointments: AppointmentRow[]
  onUpdateStatus: (id: number, status: string) => void
  onNewAppointment: () => void
  onEditAppointment: (id: number) => void
}) {
  const hours = Array.from({ length: 14 }, (_, i) => i + 8) // 8am to 9pm

  const getApptForHour = (hour: number) =>
    appointments.filter(a => {
      const [h] = a.timeSlot.split(':').map(Number)
      return h === hour
    })

  if (appointments.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="font-medium">لا توجد مواعيد</p>
        <p className="text-sm mt-1">
          <button onClick={onNewAppointment} className="text-primary-500 hover:underline">
            اضغط هنا لإضافة موعد
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-1">
      {hours.map(hour => {
        const slotAppts = getApptForHour(hour)
        const slotLabel = `${String(hour).padStart(2, '0')}:00`

        return (
          <div key={hour} className="flex gap-3 group">
            <div className="w-16 text-left text-sm text-gray-400 pt-3 flex-shrink-0">
              {formatTime(slotLabel)}
            </div>
            <div className="flex-1 min-h-[56px] border-t border-gray-100 dark:border-gray-800 pt-1">
              {slotAppts.length > 0 ? (
                slotAppts.map(appt => (
                  <AppointmentCard
                    key={appt.id}
                    appointment={appt}
                    onUpdateStatus={onUpdateStatus}
                    onEdit={onEditAppointment}
                  />
                ))
              ) : (
                <button
                  onClick={onNewAppointment}
                  className="w-full text-right text-xs text-gray-300 hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  + إضافة موعد
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AppointmentCard({ appointment: a, onUpdateStatus, onEdit }: {
  appointment: AppointmentRow
  onUpdateStatus: (id: number, status: string) => void
  onEdit: (id: number) => void
}) {
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => window.api.settings.getAll().then(r => r.data as any),
  })

  const typeLabels: Record<string, string> = {
    'first-visit':  'أول مرة',
    'follow-up':    'متابعة',
    'consultation': 'استشارة',
    'procedure':    'إجراء',
    'checkup':      'فحص',
  }

  const nextStatus: Record<string, string> = {
    scheduled:     'confirmed',
    confirmed:     'arrived',
    arrived:       'in-progress',
    'in-progress': 'completed',
  }

  const nextStatusLabel: Record<string, string> = {
    scheduled:     'تأكيد',
    confirmed:     'وصل',
    arrived:       'بدء',
    'in-progress': 'إتمام',
  }

  const fullName = [a.patientName, a.patientLastName].filter(Boolean).join(' ')

  const sendReminder = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!a.patientPhone) {
      toast.error('المريض ليس لديه رقم هاتف')
      return
    }
    const message = buildAppointmentReminder({
      patientName: fullName,
      clinicName:  settingsData?.clinic_name ?? 'العيادة',
      doctorName:  settingsData?.doctor_name ?? 'الطبيب',
      date:        a.date,
      timeSlot:    a.timeSlot,
    })
    await window.api.system.openURL(buildWhatsAppURL(a.patientPhone, message))
    toast.success('تم فتح واتساب')
  }

  return (
    <div
      onClick={() => onEdit(a.id)}
      className={cn(
        'flex items-center justify-between px-3 py-2 rounded-lg mb-1 cursor-pointer',
        'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
        'hover:border-primary-300 dark:hover:border-primary-700 transition-colors',
      )}
    >
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-gray-900 dark:text-white">{fullName}</span>
          <span className="text-xs text-gray-400">{formatTime(a.timeSlot)}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-500">{typeLabels[a.type] ?? a.type}</span>
          {a.chiefComplaint && (
            <span className="text-xs text-gray-400 truncate max-w-[200px]">— {a.chiefComplaint}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={sendReminder}
          title="إرسال تذكير واتساب"
          className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
        </button>
        <StatusBadge type="appointment" status={a.status} />
        {nextStatus[a.status] && (
          <button
            onClick={(e) => { e.stopPropagation(); onUpdateStatus(a.id, nextStatus[a.status]) }}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium px-2 py-1 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
          >
            {nextStatusLabel[a.status]}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Week View ─────────────────────────────────────────────────

function WeekView({ currentDate, appointments, onDayClick }: {
  currentDate: Date
  appointments: AppointmentRow[]
  onDayClick: (date: Date) => void
}) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 6 }) // Saturday
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="grid grid-cols-7 gap-2 p-4">
      {days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd')
        const dayAppts = appointments.filter(a => a.date === dayStr)
        const isToday = dayStr === format(new Date(), 'yyyy-MM-dd')

        return (
          <button
            key={day.toISOString()}
            onClick={() => onDayClick(day)}
            className={cn(
              'p-3 rounded-xl border text-right transition-colors',
              'hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/10',
              isToday
                ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
            )}
          >
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {format(day, 'EEEE', { locale: ar })}
            </p>
            <p className={cn(
              'text-2xl font-bold mt-1',
              isToday ? 'text-primary-600' : 'text-gray-700 dark:text-gray-300',
            )}>
              {format(day, 'd')}
            </p>
            {dayAppts.length > 0 ? (
              <div className="mt-2 space-y-1">
                {dayAppts.slice(0, 3).map(a => (
                  <div key={a.id} className="text-xs text-gray-500 truncate">
                    {formatTime(a.timeSlot)} — {[a.patientName, a.patientLastName].filter(Boolean).join(' ')}
                  </div>
                ))}
                {dayAppts.length > 3 && (
                  <div className="text-xs text-primary-500">+{dayAppts.length - 3} أخرى</div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-2">لا مواعيد</p>
            )}
          </button>
        )
      })}
    </div>
  )
}
