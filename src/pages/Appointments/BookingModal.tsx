import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import PatientSearch from '@/components/shared/PatientSearch'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/dates'

const schema = z.object({
  patientId: z.number({ required_error: 'اختر المريض' }).positive('اختر المريض'),
  date: z.string().min(1, 'التاريخ مطلوب'),
  timeSlot: z.string().min(1, 'الوقت مطلوب'),
  duration: z.number().default(30),
  type: z.enum(['first-visit', 'follow-up', 'consultation', 'procedure', 'checkup']),
  chiefComplaint: z.string().optional(),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const typeOptions = [
  { value: 'first-visit',  label: 'أول مرة' },
  { value: 'follow-up',    label: 'متابعة' },
  { value: 'consultation', label: 'استشارة' },
  { value: 'procedure',    label: 'إجراء' },
  { value: 'checkup',      label: 'فحص دوري' },
]

export default function BookingModal({ onClose, onSuccess, defaultDate, editingAppointmentId }: {
  onClose: () => void
  onSuccess: () => void
  defaultDate: string
  editingAppointmentId?: number
}) {
  const {
    register, handleSubmit, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: defaultDate, type: 'follow-up', duration: 30 },
  })

  const selectedDate     = watch('date')
  const selectedDuration = watch('duration')
  const selectedTimeSlot = watch('timeSlot')

  const { data: slots = [] } = useQuery({
    queryKey: ['available-slots', selectedDate, selectedDuration],
    queryFn: async () => {
      const r = await window.api.appointments.getAvailableSlots(selectedDate, selectedDuration)
      return r.success ? (r.data as string[]) : []
    },
    enabled: !!selectedDate,
  })

  const { data: conflictAppt } = useQuery({
    queryKey: ['conflict', selectedDate, selectedTimeSlot, selectedDuration, editingAppointmentId],
    queryFn: async () => {
      if (!selectedDate || !selectedTimeSlot || !selectedDuration) return null
      const r = await window.api.appointments.getByDate(selectedDate)
      const appts = r.success ? (r.data as any[]) : []

      const [newH, newM] = selectedTimeSlot.split(':').map(Number)
      const newStart = newH * 60 + newM
      const newEnd   = newStart + selectedDuration

      return appts.find((a: any) => {
        if (editingAppointmentId && a.id === editingAppointmentId) return false
        if (['cancelled', 'no-show'].includes(a.status)) return false
        const [aH, aM] = (a.timeSlot ?? a.time_slot).split(':').map(Number)
        const aStart = aH * 60 + aM
        const aEnd   = aStart + (a.duration ?? 30)
        return newStart < aEnd && newEnd > aStart
      }) ?? null
    },
    enabled: !!selectedDate && !!selectedTimeSlot,
  })

  const onSubmit = async (data: FormData) => {
    const r = await window.api.appointments.create(data)
    if (!r.success) {
      toast.error(r.error ?? 'حدث خطأ في الحجز')
      return
    }
    toast.success('تم حجز الموعد بنجاح')
    onSuccess()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg my-2 sm:my-0"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">موعد جديد</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4">
          {/* Patient search */}
          <div>
            <label className="label">
              المريض <span className="text-red-500">*</span>
            </label>
            <PatientSearch
              onSelect={patient => setValue('patientId', patient.id, { shouldValidate: true })}
              error={errors.patientId?.message}
            />
          </div>

          {/* Date + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">
                التاريخ <span className="text-red-500">*</span>
              </label>
              <input
                {...register('date')}
                type="date"
                className={cn('input-field', errors.date && 'border-red-500')}
              />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
            </div>
            <div>
              <label className="label">المدة</label>
              <select
                {...register('duration', { valueAsNumber: true })}
                className="input-field"
              >
                <option value={15}>١٥ دقيقة</option>
                <option value={30}>٣٠ دقيقة</option>
                <option value={45}>٤٥ دقيقة</option>
                <option value={60}>ساعة</option>
                <option value={90}>ساعة ونص</option>
              </select>
            </div>
          </div>

          {/* Time slots */}
          <div>
            <label className="label">
              الوقت <span className="text-red-500">*</span>
            </label>
            {slots.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2 max-h-52 sm:max-h-64 overflow-y-auto pr-1">
                {slots.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setValue('timeSlot', slot, { shouldValidate: true })}
                    className={cn(
                      'py-2 text-sm rounded-lg border transition-colors',
                      selectedTimeSlot === slot
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-primary-400 text-gray-700 dark:text-gray-300',
                    )}
                  >
                    {formatTime(slot)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-2">لا توجد أوقات متاحة في هذا اليوم</p>
            )}
            {errors.timeSlot && (
              <p className="text-red-500 text-xs mt-1">{errors.timeSlot.message}</p>
            )}
            {conflictAppt && (
              <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mt-2">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">تعارض في المواعيد</p>
                  <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
                    يوجد موعد لـ <strong>{conflictAppt.patientName ?? conflictAppt.patient_name}</strong> في {formatTime(conflictAppt.timeSlot ?? conflictAppt.time_slot)}
                    — اختر وقتاً آخر
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Visit type */}
          <div>
            <label className="label">نوع الزيارة</label>
            <select {...register('type')} className="input-field">
              {typeOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Chief complaint */}
          <div>
            <label className="label">الشكوى الرئيسية</label>
            <input
              {...register('chiefComplaint')}
              className="input-field"
              placeholder="اختياري"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!conflictAppt}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              حفظ الموعد
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
