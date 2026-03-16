import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { todayISO } from '@/lib/dates'
import { useDraftSave } from '@/hooks/useDraftSave'

interface FormData {
  visitDate: string
  chiefComplaint?: string
  diagnosis: string
  treatment?: string
  notes?: string
  followUpDate?: string
}

interface Props {
  patientId: number
  appointmentId?: number
  onClose: () => void
  onSuccess: () => void
}

export default function MedicalRecordForm({ patientId, appointmentId, onClose, onSuccess }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ defaultValues: { visitDate: todayISO() } })

  const watchedData = watch()
  const { clearDraft, loadDraft } = useDraftSave(`medical_record_${patientId}`, watchedData)
  const [showRecovery, setShowRecovery] = useState(false)
  const [pendingDraft, setPendingDraft] = useState<FormData | null>(null)

  useEffect(() => {
    const draft = loadDraft()
    if (draft) {
      setPendingDraft(draft)
      setShowRecovery(true)
    }
  }, [])

  const onSubmit = async (data: FormData) => {
    const res = await window.api.medicalRecords.create({
      patientId,
      appointmentId,
      ...data,
    } as any)

    if (res.success) {
      clearDraft()
      toast.success('تم حفظ السجل الطبي')
      onSuccess()
    } else {
      toast.error(res.error ?? 'حدث خطأ')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">تسجيل زيارة جديدة</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Draft recovery banner */}
          {showRecovery && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">وُجدت مسودة محفوظة</p>
                  <p className="text-xs text-amber-600">من جلسة سابقة — هل تريد استكمالها؟</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (pendingDraft) reset(pendingDraft)
                    setShowRecovery(false)
                  }}
                  className="text-xs btn-primary px-3 py-1.5"
                >
                  استعادة
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearDraft()
                    setShowRecovery(false)
                  }}
                  className="text-xs btn-secondary px-3 py-1.5"
                >
                  تجاهل
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="label">تاريخ الزيارة *</label>
            <input {...register('visitDate', { required: 'مطلوب' })} type="date" className="input-field" />
            {errors.visitDate && <p className="text-red-500 text-xs mt-1">{errors.visitDate.message}</p>}
          </div>

          <div>
            <label className="label">الشكوى الرئيسية</label>
            <input {...register('chiefComplaint')} className="input-field" placeholder="ألم في..." />
          </div>

          <div>
            <label className="label">التشخيص *</label>
            <textarea
              {...register('diagnosis', { required: 'مطلوب' })}
              className="input-field"
              rows={3}
              placeholder="التشخيص..."
            />
            {errors.diagnosis && <p className="text-red-500 text-xs mt-1">{errors.diagnosis.message}</p>}
          </div>

          <div>
            <label className="label">العلاج والدواء</label>
            <textarea {...register('treatment')} className="input-field" rows={3} />
          </div>

          <div>
            <label className="label">موعد المتابعة</label>
            <input {...register('followUpDate')} type="date" className="input-field" />
          </div>

          <div>
            <label className="label">ملاحظات</label>
            <textarea {...register('notes')} className="input-field" rows={2} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              إلغاء
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ السجل'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
