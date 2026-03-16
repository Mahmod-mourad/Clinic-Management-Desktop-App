import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

interface PatientFormData {
  firstName: string
  lastName: string
  phone: string
  phone2?: string
  nationalId?: string
  dateOfBirth?: string
  gender?: 'male' | 'female'
  address?: string
  bloodType?: string
  allergies?: string
  chronicDiseases?: string
  emergencyContact?: string
  notes?: string
}

interface Props {
  patient?: any
  onClose: () => void
  onSuccess?: (id: number) => void
}

export default function PatientForm({ patient, onClose, onSuccess }: Props) {
  const queryClient = useQueryClient()
  const isEdit = !!patient

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<PatientFormData>()

  useEffect(() => {
    if (patient) {
      reset({
        firstName: patient.first_name ?? patient.firstName,
        lastName: patient.last_name ?? patient.lastName,
        phone: patient.phone,
        phone2: patient.phone2,
        nationalId: patient.national_id ?? patient.nationalId,
        dateOfBirth: patient.date_of_birth ?? patient.dateOfBirth,
        gender: patient.gender,
        address: patient.address,
        bloodType: patient.blood_type ?? patient.bloodType,
        allergies: patient.allergies,
        chronicDiseases: patient.chronic_diseases ?? patient.chronicDiseases,
        emergencyContact: patient.emergency_contact ?? patient.emergencyContact,
        notes: patient.notes,
      })
    }
  }, [patient, reset])

  const onSubmit = async (data: PatientFormData) => {
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== '' && v !== undefined),
    )
    let res
    if (isEdit) {
      res = await window.api.patients.update(patient.id, cleaned)
    } else {
      res = await window.api.patients.create(cleaned)
    }

    if (res.success) {
      toast.success(isEdit ? 'تم تحديث بيانات المريض' : 'تم إضافة المريض بنجاح')
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      onSuccess?.((res.data as any)?.id ?? patient?.id)
      onClose()
    } else {
      toast.error(res.error ?? 'حدث خطأ')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'تعديل بيانات المريض' : 'إضافة مريض جديد'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">الاسم الأول *</label>
              <input
                {...register('firstName', { required: 'مطلوب' })}
                className="input-field"
                placeholder="محمد"
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label className="label">اسم العائلة *</label>
              <input
                {...register('lastName', { required: 'مطلوب' })}
                className="input-field"
                placeholder="أحمد"
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Phone row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">رقم الهاتف *</label>
              <input
                {...register('phone', { required: 'مطلوب' })}
                className="input-field"
                placeholder="01xxxxxxxxx"
                dir="ltr"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="label">هاتف احتياطي</label>
              <input {...register('phone2')} className="input-field" placeholder="01xxxxxxxxx" dir="ltr" />
            </div>
          </div>

          {/* DOB + Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">تاريخ الميلاد</label>
              <input {...register('dateOfBirth')} type="date" className="input-field" />
            </div>
            <div>
              <label className="label">الجنس</label>
              <select {...register('gender')} className="input-field">
                <option value="">اختر...</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>
          </div>

          {/* National ID + Blood Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">الرقم القومي</label>
              <input {...register('nationalId')} className="input-field" dir="ltr" />
            </div>
            <div>
              <label className="label">فصيلة الدم</label>
              <select {...register('bloodType')} className="input-field">
                <option value="">اختر...</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
                <option value="unknown">غير معروف</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="label">العنوان</label>
            <input {...register('address')} className="input-field" />
          </div>

          {/* Allergies + Chronic */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">الحساسية</label>
              <label className="flex items-center gap-2 mb-1 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={watch('allergies') === 'لا يوجد'}
                  onChange={e => setValue('allergies', e.target.checked ? 'لا يوجد' : '')}
                  className="w-3.5 h-3.5 accent-blue-600"
                />
                <span className="text-xs text-gray-500">لا يوجد</span>
              </label>
              <textarea {...register('allergies')} className="input-field" rows={2} />
            </div>
            <div>
              <label className="label">الأمراض المزمنة</label>
              <label className="flex items-center gap-2 mb-1 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={watch('chronicDiseases') === 'لا يوجد'}
                  onChange={e => setValue('chronicDiseases', e.target.checked ? 'لا يوجد' : '')}
                  className="w-3.5 h-3.5 accent-blue-600"
                />
                <span className="text-xs text-gray-500">لا يوجد</span>
              </label>
              <textarea {...register('chronicDiseases')} className="input-field" rows={2} />
            </div>
          </div>

          {/* Emergency contact */}
          <div>
            <label className="label">جهة الاتصال للطوارئ</label>
            <input {...register('emergencyContact')} className="input-field" />
          </div>

          {/* Notes */}
          <div>
            <label className="label">ملاحظات</label>
            <textarea {...register('notes')} className="input-field" rows={2} />
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="btn-secondary flex-1">
            إلغاء
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="btn-primary flex-1"
          >
            {isSubmitting ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إضافة المريض'}
          </button>
        </div>
      </div>
    </div>
  )
}
