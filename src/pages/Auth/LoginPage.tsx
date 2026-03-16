import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Stethoscope, Loader2, ArrowRight, Mail, KeyRound, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

// ─── Login ────────────────────────────────────────────────────────

const loginSchema = z.object({
  username: z.string().min(1, 'اسم المستخدم مطلوب'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
})
type LoginForm = z.infer<typeof loginSchema>

// ─── Forgot Password steps ───────────────────────────────────────

type ResetStep = 'email' | 'otp' | 'newpw'

const emailSchema   = z.object({ email: z.string().email('بريد إلكتروني غير صالح') })
const otpSchema     = z.object({ otp:   z.string().length(6, 'الرمز 6 أرقام') })
const newPwSchema   = z.object({
  password: z.string().min(6, 'كلمة المرور 6 أحرف على الأقل'),
  confirm:  z.string().min(1, 'مطلوب'),
}).refine(d => d.password === d.confirm, {
  message: 'كلمتا المرور غير متطابقتين',
  path: ['confirm'],
})

// ─── Main Component ───────────────────────────────────────────────

export default function LoginPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore(s => s.setUser)
  const [showPassword, setShowPassword] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [isFirstTime, setIsFirstTime] = useState(false)

  useEffect(() => {
    window.api.settings.get('onboarding_completed').then(r => {
      setIsFirstTime(!r.data)
    })
  }, [])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    const result = await window.api.auth.login(data.username, data.password)
    if (!result.success || !result.data) {
      toast.error(result.error ?? 'خطأ في تسجيل الدخول')
      return
    }
    setUser(result.data)
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo + Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">عيادتي</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">نظام إدارة العيادة</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">تسجيل الدخول</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Username */}
            <div>
              <label className="label">اسم المستخدم</label>
              <input
                {...register('username')}
                type="text"
                autoComplete="username"
                autoFocus
                placeholder="admin"
                className={cn('input-field', errors.username && 'border-red-500 focus:ring-red-500')}
              />
              {errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="label">كلمة المرور</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={cn('input-field pl-10', errors.password && 'border-red-500 focus:ring-red-500')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'جاري الدخول...' : 'دخول'}
            </button>
          </form>

          {/* Forgot password link */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
            >
              نسيت كلمة المرور؟
            </button>
          </div>
        </div>

        {/* Version */}
        <p className="text-center text-xs text-gray-400 mt-4">الإصدار 1.0.0</p>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <ForgotPasswordModal onClose={() => setForgotOpen(false)} />
      )}
    </div>
  )
}

// ─── Forgot Password Modal ────────────────────────────────────────

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<ResetStep>('email')

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            step === 'email' ? 'bg-blue-100'  :
            step === 'otp'   ? 'bg-amber-100' :
                               'bg-green-100',
          )}>
            {step === 'email' && <Mail      className="w-5 h-5 text-blue-600" />}
            {step === 'otp'   && <KeyRound  className="w-5 h-5 text-amber-600" />}
            {step === 'newpw' && <ShieldCheck className="w-5 h-5 text-green-600" />}
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {step === 'email' ? 'استعادة كلمة المرور' :
               step === 'otp'   ? 'أدخل رمز التحقق' :
                                  'كلمة مرور جديدة'}
            </h3>
            <p className="text-xs text-gray-400">
              {step === 'email' ? 'سيتم إرسال رمز OTP إلى بريدك' :
               step === 'otp'   ? 'تحقق من بريدك الإلكتروني' :
                                  'أدخل كلمة مرور جديدة'}
            </p>
          </div>
        </div>

        {step === 'email' && <EmailStep onNext={() => setStep('otp')} onClose={onClose} />}
        {step === 'otp'   && <OtpStep   onNext={() => setStep('newpw')} />}
        {step === 'newpw' && <NewPwStep onClose={onClose} />}
      </div>
    </div>
  )
}

// ── Step 1: Email ─────────────────────────────────────────────────

function EmailStep({ onNext, onClose }: { onNext: () => void; onClose: () => void }) {
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ email: string }>({
    resolver: zodResolver(emailSchema),
  })

  const onSubmit = async ({ email }: { email: string }) => {
    const r = await window.api.auth.requestReset(email) as { success: boolean; otp?: string; error?: string }
    if (r.success && r.otp) {
      sessionStorage.setItem('reset_otp', r.otp)
      setGeneratedOtp(r.otp)
    } else {
      toast.error(r.error ?? 'فشل توليد الرمز')
    }
  }

  if (generatedOtp) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-center">
          <p className="text-sm text-amber-700 dark:text-amber-400 mb-2">رمز التحقق الخاص بك</p>
          <div className="text-3xl font-bold font-mono tracking-[0.4em] text-amber-800 dark:text-amber-300 py-2">
            {generatedOtp}
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">صالح لمدة 15 دقيقة</p>
        </div>
        <button type="button" onClick={onNext} className="btn-primary w-full flex items-center justify-center gap-2">
          التالي <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">البريد الإلكتروني</label>
        <input
          {...register('email')}
          type="email"
          className={cn('input-field', errors.email && 'border-red-500')}
          placeholder="you@gmail.com"
          dir="ltr"
          autoFocus
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          توليد الرمز
        </button>
      </div>
    </form>
  )
}

// ── Step 2: OTP ───────────────────────────────────────────────────

function OtpStep({ onNext }: { onNext: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ otp: string }>({
    resolver: zodResolver(otpSchema),
  })

  // We just store OTP in component state to pass to next step
  const onSubmit = async ({ otp }: { otp: string }) => {
    // Verify OTP exists by trying a dummy newPassword check — we do the real check in NewPwStep
    // Just validate length via zod; move to next step and carry otp value
    sessionStorage.setItem('reset_otp', otp)
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">رمز التحقق (6 أرقام)</label>
        <input
          {...register('otp')}
          type="text"
          inputMode="numeric"
          maxLength={6}
          className={cn('input-field text-center text-2xl tracking-[0.5em] font-mono', errors.otp && 'border-red-500')}
          placeholder="••••••"
          dir="ltr"
          autoFocus
        />
        {errors.otp && <p className="text-red-500 text-xs mt-1">{errors.otp.message}</p>}
        <p className="text-xs text-gray-400 mt-1">صالح لمدة 15 دقيقة</p>
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        التالي <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  )
}

// ── Step 3: New Password ──────────────────────────────────────────

function NewPwStep({ onClose }: { onClose: () => void }) {
  const [showPw, setShowPw]   = useState(false)
  const [showCf, setShowCf]   = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ password: string; confirm: string }>({
    resolver: zodResolver(newPwSchema),
  })

  const onSubmit = async ({ password }: { password: string; confirm: string }) => {
    const otp = sessionStorage.getItem('reset_otp') ?? ''
    const r = await window.api.auth.verifyReset(otp, password)
    if (r.success) {
      sessionStorage.removeItem('reset_otp')
      toast.success('تم تغيير كلمة المرور بنجاح — سجّل دخولك من جديد')
      onClose()
    } else {
      toast.error(r.error ?? 'حدث خطأ')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">كلمة المرور الجديدة</label>
        <div className="relative">
          <input
            {...register('password')}
            type={showPw ? 'text' : 'password'}
            className={cn('input-field pl-10', errors.password && 'border-red-500')}
            dir="ltr"
            autoFocus
          />
          <button type="button" onClick={() => setShowPw(v => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
      </div>
      <div>
        <label className="label">تأكيد كلمة المرور</label>
        <div className="relative">
          <input
            {...register('confirm')}
            type={showCf ? 'text' : 'password'}
            className={cn('input-field pl-10', errors.confirm && 'border-red-500')}
            dir="ltr"
          />
          <button type="button" onClick={() => setShowCf(v => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {showCf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm.message}</p>}
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        حفظ كلمة المرور
      </button>
    </form>
  )
}
