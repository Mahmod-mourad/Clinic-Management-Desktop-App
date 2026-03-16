import { useMemo } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/dates'

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

const statusColors: Record<string, string> = {
  scheduled:     'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  confirmed:     'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  arrived:       'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'in-progress': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  completed:     'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  cancelled:     'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
  'no-show':     'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
}

export default function MonthView({
  currentDate,
  onAppointmentClick,
}: {
  currentDate: Date
  onAppointmentClick: (appointmentId: number, date: string) => void
}) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd   = endOfMonth(currentDate)

  // Grid starts on Saturday (weekStartsOn: 6) to match week view
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 6 })
  const gridEnd   = endOfWeek(monthEnd,   { weekStartsOn: 6 })

  const startStr = format(gridStart, 'yyyy-MM-dd')
  const endStr   = format(gridEnd,   'yyyy-MM-dd')

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments', 'month', format(currentDate, 'yyyy-MM')],
    queryFn: async () => {
      const r = await window.api.appointments.getByDateRange(startStr, endStr)
      return r.success ? (r.data as AppointmentRow[]) : []
    },
  })

  // Build list of all days in grid
  const days = useMemo(() => {
    const result: Date[] = []
    let day = gridStart
    while (day <= gridEnd) {
      result.push(day)
      day = addDays(day, 1)
    }
    return result
  }, [gridStart.toISOString(), gridEnd.toISOString()])

  // Map appointments by date for O(1) lookup
  const apptsByDate = useMemo(() => {
    const map: Record<string, AppointmentRow[]> = {}
    for (const a of appointments) {
      if (!map[a.date]) map[a.date] = []
      map[a.date].push(a)
    }
    return map
  }, [appointments])

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const dayNames = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']

  return (
    <div className="flex flex-col h-full p-4">
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {dayNames.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {days.map(day => {
          const dayStr     = format(day, 'yyyy-MM-dd')
          const isThisMonth = isSameMonth(day, currentDate)
          const isToday    = dayStr === todayStr
          const dayAppts   = apptsByDate[dayStr] ?? []

          return (
            <div
              key={dayStr}
              className={cn(
                'rounded-lg border p-1.5 min-h-[90px] flex flex-col',
                isThisMonth
                  ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800',
              )}
            >
              {/* Day number */}
              <div className={cn(
                'text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0',
                isToday
                  ? 'bg-primary-600 text-white'
                  : isThisMonth
                    ? 'text-gray-700 dark:text-gray-200'
                    : 'text-gray-300 dark:text-gray-600',
              )}>
                {format(day, 'd')}
              </div>

              {/* Appointments */}
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {dayAppts.slice(0, 3).map(a => {
                  const fullName = [a.patientName, a.patientLastName].filter(Boolean).join(' ')
                  return (
                    <button
                      key={a.id}
                      onClick={() => onAppointmentClick(a.id, dayStr)}
                      className={cn(
                        'text-right text-[10px] leading-tight px-1 py-0.5 rounded truncate w-full',
                        statusColors[a.status] ?? 'bg-gray-100 text-gray-600',
                      )}
                    >
                      {formatTime(a.timeSlot)} {fullName}
                    </button>
                  )
                })}
                {dayAppts.length > 3 && (
                  <span className="text-[10px] text-primary-500 px-1">+{dayAppts.length - 3} أخرى</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
