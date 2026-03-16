import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Check, ChevronLeft, Stethoscope, HardDrive, Wrench, Sparkles, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const STEPS = ['مرحباً', 'بيانات العيادة', 'النسخ الاحتياطي', 'جاهز']

const clinicSchema = z.object({
  clinic_name:       z.string().min(2, 'اسم العيادة مطلوب'),
  doctor_name:       z.string().min(2, 'اسم الطبيب مطلوب'),
  doctor_specialty:  z.string().optional(),
  clinic_phone:      z.string().optional(),
  clinic_address:    z.string().optional(),
  admin_email:       z.string().email('بريد إلكتروني غير صالح').optional().or(z.literal('')),
  smtp_app_password: z.string().optional(),
})

export default function OnboardingWizard() {
  const [step, setStep] = useState(0)
  const [showSmtp, setShowSmtp] = useState(false)
  const navigate = useNavigate()
  const userId = useAuthStore(s => s.user?.id)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(clinicSchema),
  })

  const saveClinicInfo = async (data: any) => {
    await window.api.settings.setMany(data, userId)
    setStep(2)
  }

  const finish = async () => {
    await window.api.settings.set('onboarding_completed', 'true', userId)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step   ? 'bg-primary-600 text-white' :
                i === step ? 'bg-white border-2 border-primary-600 text-primary-600' :
                             'bg-gray-200 text-gray-400'
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-12 h-0.5 ${i < step ? 'bg-primary-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div className="card p-8 text-center">
            <div className="w-20 h-20 bg-primary-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Stethoscope className="w-10 h-10 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">مرحباً بك في عيادتي</h1>
            <p className="text-gray-500 mb-8 leading-relaxed">
              سيساعدك هذا المعالج على إعداد نظامك في دقيقتين.
              يمكنك تغيير كل هذه الإعدادات لاحقاً من صفحة الإعدادات.
            </p>
            <button onClick={() => setStep(1)} className="btn-primary px-8 py-3 text-base">
              ابدأ الإعداد ←
            </button>
          </div>
        )}

        {/* Step 1 — Clinic Info */}
        {step === 1 && (
          <div className="card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Wrench className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold">بيانات العيادة</h2>
            </div>
            <form onSubmit={handleSubmit(saveClinicInfo)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">اسم العيادة <span className="text-red-500">*</span></label>
                  <input {...register('clinic_name')} className="input-field" placeholder="عيادة د. أحمد" />
                  {errors.clinic_name && <p className="text-red-500 text-xs mt-1">{errors.clinic_name.message as string}</p>}
                </div>
                <div>
                  <label className="label">اسم الطبيب <span className="text-red-500">*</span></label>
                  <input {...register('doctor_name')} className="input-field" placeholder="د. أحمد محمد" />
                  {errors.doctor_name && <p className="text-red-500 text-xs mt-1">{errors.doctor_name.message as string}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">التخصص</label>
                  <input {...register('doctor_specialty')} className="input-field" placeholder="طب عام" />
                </div>
                <div>
                  <label className="label">رقم الهاتف</label>
                  <input {...register('clinic_phone')} className="input-field" placeholder="01xxxxxxxxx" dir="ltr" />
                </div>
              </div>
              <div>
                <label className="label">العنوان</label>
                <input {...register('clinic_address')} className="input-field" placeholder="القاهرة" />
              </div>

              {/* Recovery email section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                <p className="text-xs text-gray-500 mb-3">
                  بريد الاستعادة — يُستخدم لإعادة تعيين كلمة المرور إذا نسيتها
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">البريد الإلكتروني (Gmail)</label>
                    <input
                      {...register('admin_email')}
                      type="email"
                      className="input-field"
                      placeholder="you@gmail.com"
                      dir="ltr"
                    />
                    {errors.admin_email && (
                      <p className="text-red-500 text-xs mt-1">{errors.admin_email.message as string}</p>
                    )}
                  </div>
                  <div>
                    <label className="label">App Password (Gmail)</label>
                    <div className="relative">
                      <input
                        {...register('smtp_app_password')}
                        type={showSmtp ? 'text' : 'password'}
                        className="input-field pl-10"
                        placeholder="xxxx xxxx xxxx xxxx"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSmtp(v => !v)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showSmtp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      من Google &gt; الأمان &gt; App passwords
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(0)} className="btn-secondary flex items-center gap-1">
                  <ChevronLeft className="w-4 h-4" /> رجوع
                </button>
                <button type="submit" className="btn-primary flex-1">التالي ←</button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2 — Backup */}
        {step === 2 && (
          <div className="card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-bold">النسخ الاحتياطي</h2>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              حدد مجلداً لحفظ النسخ الاحتياطية تلقائياً. هذا يحميك من فقدان البيانات.
            </p>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  const r = await window.api.backup.chooseBackupPath()
                  if (r.success && r.data) toast.success(`تم تحديد: ${r.data}`)
                }}
                className="btn-secondary w-full py-3 flex items-center justify-center gap-2"
              >
                <HardDrive className="w-4 h-4" />
                اختر مجلد النسخ الاحتياطي
              </button>
              <button onClick={() => setStep(3)} className="btn-primary w-full py-3">
                التالي ←
              </button>
              <button
                onClick={() => setStep(3)}
                className="text-sm text-gray-400 hover:text-gray-600 w-full text-center"
              >
                تخطي (يمكن الإعداد لاحقاً)
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Done */}
        {step === 3 && (
          <div className="card p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">جاهز!</h2>
            <p className="text-gray-500 mb-8">تم إعداد عيادتك بنجاح. يمكنك البدء في استخدام النظام الآن.</p>
            <button onClick={finish} className="btn-primary px-8 py-3 text-base">
              ابدأ الاستخدام ←
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
