import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, Users, Database, Save, Plus, Eye, EyeOff, Moon, Sun, Trash2, HardDrive, Usb, Cloud, Loader2, Shield, Lock, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import RecycleBin from './RecycleBin'
import AuditLogPage from './AuditLogPage'
import { formatDateArabic } from '@/lib/dates'
import { useCan } from '@/hooks/useCan'

type Tab = 'clinic' | 'users' | 'backup' | 'recycle' | 'audit' | 'account'

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('clinic')
  const canViewAudit = useCan('audit_log:view')

  const tabs = [
    { key: 'clinic'   as Tab, label: 'بيانات العيادة',   icon: Building2 },
    { key: 'users'    as Tab, label: 'المستخدمون',        icon: Users },
    { key: 'backup'   as Tab, label: 'النسخ الاحتياطي',  icon: Database },
    { key: 'recycle'  as Tab, label: 'سلة المحذوفات',    icon: Trash2 },
    ...(canViewAudit ? [{ key: 'audit' as Tab, label: 'سجل العمليات', icon: Shield }] : []),
    { key: 'account'  as Tab, label: 'كلمة المرور',       icon: Lock },
  ]

  return (
    <div className="page-container">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 flex-shrink-0">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              tab === key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="page-content">
        {tab === 'clinic'   && <ClinicTab />}
        {tab === 'users'    && <UsersTab />}
        {tab === 'backup'   && <BackupTab />}
        {tab === 'recycle'  && <RecycleBin />}
        {tab === 'audit'    && <AuditLogPage />}
        {tab === 'account'  && <AccountTab />}
      </div>
    </div>
  )
}

// ─── Clinic Tab ─────────────────────────────────────────────────

interface ClinicForm {
  clinic_name: string
  doctor_name: string
  clinic_phone: string
  clinic_address: string
  currency: string
  tax_rate: string
}

function ClinicTab() {
  const isDark = useUIStore(s => s.darkMode)
  const toggleDark = useUIStore(s => s.toggleDarkMode)
  const currentUser = useAuthStore(s => s.user)
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<ClinicForm>()

  const { data: allSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const r = await window.api.settings.getAll()
      return r.success ? (r.data as Record<string, string>) : {}
    },
  })

  useEffect(() => {
    if (allSettings) {
      reset({
        clinic_name:    allSettings.clinic_name    ?? '',
        doctor_name:    allSettings.doctor_name    ?? '',
        clinic_phone:   allSettings.clinic_phone   ?? '',
        clinic_address: allSettings.clinic_address ?? '',
        currency:       allSettings.currency       ?? 'EGP',
        tax_rate:       allSettings.tax_rate       ?? '0',
      })
    }
  }, [allSettings, reset])

  const onSubmit = async (data: ClinicForm) => {
    const r = await window.api.settings.setMany(data as unknown as Record<string, string>, currentUser?.id)
    if (r.success) {
      toast.success('تم حفظ الإعدادات')
    } else {
      toast.error(r.error ?? 'حدث خطأ')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-5">
      <div>
        <label className="label">اسم العيادة</label>
        <input {...register('clinic_name')} className="input-field" placeholder="عيادة د. ..." />
      </div>
      <div>
        <label className="label">اسم الطبيب</label>
        <input {...register('doctor_name')} className="input-field" placeholder="د. محمد ..." />
      </div>
      <div>
        <label className="label">رقم التليفون</label>
        <input {...register('clinic_phone')} className="input-field" dir="ltr" />
      </div>
      <div>
        <label className="label">العنوان</label>
        <textarea {...register('clinic_address')} className="input-field" rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">العملة</label>
          <select {...register('currency')} className="input-field">
            <option value="EGP">جنيه مصري (ج.م)</option>
            <option value="USD">دولار ($)</option>
            <option value="SAR">ريال سعودي (ر.س)</option>
          </select>
        </div>
        <div>
          <label className="label">نسبة الضريبة (%)</label>
          <input {...register('tax_rate')} type="number" min={0} max={100} step={0.5} className="input-field" dir="ltr" />
        </div>
      </div>

      {/* Dark mode toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <div className="flex items-center gap-3">
          {isDark ? <Moon className="w-5 h-5 text-primary-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">الوضع المظلم</p>
            <p className="text-xs text-gray-500">تبديل مظهر التطبيق</p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleDark}
          className={cn(
            'relative w-12 h-6 rounded-full transition-colors',
            isDark ? 'bg-primary-600' : 'bg-gray-300',
          )}
        >
          <span
            className={cn(
              'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
              isDark ? 'translate-x-1' : 'translate-x-7',
            )}
          />
        </button>
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
        <Save className="w-4 h-4" />
        {isSubmitting ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
      </button>
    </form>
  )
}

// ─── Users Tab ──────────────────────────────────────────────────

function UsersTab() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const r = await window.api.settings.getUsers()
      return r.success ? (r.data as any[]) : []
    },
  })

  const roleLabels: Record<string, string> = {
    admin: 'مدير', doctor: 'طبيب', receptionist: 'استقبال',
  }

  return (
    <div className="max-w-xl">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          مستخدم جديد
        </button>
      </div>

      <div className="card divide-y divide-gray-100 dark:divide-gray-700">
        {users.map((user: any) => (
          <div key={user.id} className="flex items-center gap-3 px-5 py-3">
            <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-primary-700">{user.name?.[0]}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
              <p className="text-xs text-gray-500">{user.username} — {roleLabels[user.role] ?? user.role}</p>
            </div>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full',
              user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
            )}>
              {user.isActive ? 'نشط' : 'معطل'}
            </span>
          </div>
        ))}
      </div>

      {showForm && (
        <AddUserForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
            setShowForm(false)
          }}
        />
      )}
    </div>
  )
}

function AddUserForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{
    name: string; username: string; password: string; role: string
  }>()
  const [showPw, setShowPw] = useState(false)
  const currentUser = useAuthStore(s => s.user)

  const onSubmit = async (data: any) => {
    const r = await window.api.settings.createUser(data, currentUser?.id)
    if (r.success) {
      toast.success('تم إضافة المستخدم')
      onSuccess()
    } else {
      toast.error(r.error ?? 'حدث خطأ')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">إضافة مستخدم</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="label">الاسم</label>
            <input {...register('name', { required: 'مطلوب' })} className="input-field" />
          </div>
          <div>
            <label className="label">اسم المستخدم</label>
            <input {...register('username', { required: 'مطلوب' })} className="input-field" dir="ltr" />
          </div>
          <div>
            <label className="label">كلمة المرور</label>
            <div className="relative">
              <input
                {...register('password', { required: 'مطلوب', minLength: { value: 6, message: '6 أحرف على الأقل' } })}
                type={showPw ? 'text' : 'password'}
                className="input-field pl-10"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="label">الدور</label>
            <select {...register('role', { required: 'مطلوب' })} className="input-field">
              <option value="admin">مدير</option>
              <option value="doctor">طبيب</option>
              <option value="receptionist">استقبال</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">إضافة</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Backup Tab ──────────────────────────────────────────────────

function BackupTab() {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState<'local' | 'usb' | 'drive' | 'restore' | null>(null)

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => window.api.settings.getAll().then(r => r.data as Record<string, string> | undefined),
  })

  const runBackup = async (type: 'local' | 'usb' | 'drive') => {
    setLoading(type)
    const handlers = {
      local: () => window.api.backup.createNow(),
      usb:   () => window.api.backup.toUSB(),
      drive: () => window.api.backup.toDrive(),
    }
    const result = await handlers[type]()
    setLoading(null)
    if (result.success) {
      toast.success('تم النسخ الاحتياطي بنجاح ✓')
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    } else {
      const inner = result.data as { error?: string } | undefined
      toast.error(inner?.error ?? (result as any).error ?? 'فشل النسخ الاحتياطي')
    }
  }

  const restoreBackup = async () => {
    const fileResult = await window.api.backup.chooseRestorePath()
    if (!fileResult.success || !fileResult.data) return

    const confirmed = window.confirm(
      'تحذير: سيتم استبدال قاعدة البيانات الحالية بالكامل بالنسخة المختارة.\n\nهل أنت متأكد؟'
    )
    if (!confirmed) return

    setLoading('restore')
    const result = await window.api.backup.restore(fileResult.data)
    setLoading(null)
    if (!result.success) {
      toast.error(result.error ?? 'فشلت عملية الاستعادة')
    }
    // في حال النجاح التطبيق يُعاد تشغيله تلقائياً
  }

  const chooseLocalPath = async () => {
    const result = await window.api.backup.chooseBackupPath()
    if (result.success && result.data) {
      toast.success('تم تحديد المجلد')
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <p className="text-sm text-gray-500">
        آخر نسخة احتياطية:
        <span className="font-medium text-gray-700 dark:text-gray-300 mr-1">
          {settings?.last_backup_time
            ? formatDateArabic(settings.last_backup_time)
            : 'لا يوجد'}
        </span>
        {settings?.last_backup_destinations && (
          <span className="text-green-600 mr-1">({settings.last_backup_destinations})</span>
        )}
      </p>

      {/* Local Backup */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HardDrive className="w-5 h-5 text-gray-500" />
          <div>
            <p className="font-medium text-sm">نسخ احتياطي محلي</p>
            <p className="text-xs text-gray-400 truncate max-w-[280px]">
              {settings?.backup_path || 'لم يتم تحديد مجلد'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={chooseLocalPath} className="btn-secondary text-xs px-3 py-1.5">
            تغيير المجلد
          </button>
          <button
            onClick={() => runBackup('local')}
            disabled={loading === 'local'}
            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
          >
            {loading === 'local' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            نسخ الآن
          </button>
        </div>
      </div>

      {/* USB Backup */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Usb className="w-5 h-5 text-gray-500" />
          <div>
            <p className="font-medium text-sm">نسخ على USB</p>
            <p className="text-xs text-gray-400">يحتاج USB متصل وقابل للكتابة</p>
          </div>
        </div>
        <button
          onClick={() => runBackup('usb')}
          disabled={loading === 'usb'}
          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
        >
          {loading === 'usb' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          نسخ على USB
        </button>
      </div>

      {/* Google Drive */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cloud className="w-5 h-5 text-gray-500" />
          <div>
            <p className="font-medium text-sm">Google Drive</p>
            <p className="text-xs text-gray-400">
              {settings?.gdrive_enabled === 'true' ? '✓ مفعّل' : 'غير مفعّل — يتطلب ربط الحساب'}
            </p>
          </div>
        </div>
        <button
          onClick={() => runBackup('drive')}
          disabled={loading === 'drive'}
          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
        >
          {loading === 'drive' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          رفع على Drive
        </button>
      </div>

      {/* Restore */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RotateCcw className="w-5 h-5 text-gray-500" />
          <div>
            <p className="font-medium text-sm">استعادة نسخة احتياطية</p>
            <p className="text-xs text-gray-400">سيتم إغلاق التطبيق وإعادة تشغيله تلقائياً بعد الاستعادة</p>
          </div>
        </div>
        <button
          onClick={restoreBackup}
          disabled={loading === 'restore'}
          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          {loading === 'restore' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          استعادة
        </button>
      </div>

      {/* Auto backup toggle */}
      <div className="card p-4 flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">نسخ تلقائي يومي</p>
          <p className="text-xs text-gray-400">يتم تلقائياً عند فتح التطبيق كل 20 ساعة</p>
        </div>
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={settings?.backup_enabled === 'true'}
              onChange={async (e) => {
                await window.api.settings.set('backup_enabled', e.target.checked ? 'true' : 'false')
                queryClient.invalidateQueries({ queryKey: ['settings'] })
              }}
            />
            <div
              className={cn(
                'w-10 h-6 rounded-full transition-colors',
                settings?.backup_enabled === 'true' ? 'bg-primary-600' : 'bg-gray-300',
              )}
            />
            <div
              className={cn(
                'absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow',
                settings?.backup_enabled === 'true' ? 'right-1' : 'left-1',
              )}
            />
          </div>
        </label>
      </div>
    </div>
  )
}

// ─── Account Tab (Change Password + Recovery Email) ──────────────

const changePwSchema = z.object({
  current:  z.string().min(1, 'مطلوب'),
  next:     z.string().min(6, 'كلمة المرور الجديدة 6 أحرف على الأقل'),
  confirm:  z.string().min(1, 'مطلوب'),
}).refine(d => d.next === d.confirm, {
  message: 'كلمة المرور الجديدة وتأكيدها غير متطابقين',
  path: ['confirm'],
})

type ChangePwForm = z.infer<typeof changePwSchema>

function AccountTab() {
  const user = useAuthStore(s => s.user)
  const queryClient = useQueryClient()
  const [showCur, setShowCur] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConf, setShowConf] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ChangePwForm>({
    resolver: zodResolver(changePwSchema),
  })

  const {
    register: regEmail,
    handleSubmit: handleEmailSubmit,
    reset: resetEmail,
    formState: { isSubmitting: isEmailSubmitting },
  } = useForm<{ admin_email: string }>()

  const { data: allSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const r = await window.api.settings.getAll()
      return r.success ? (r.data as Record<string, string>) : {}
    },
  })

  useEffect(() => {
    if (allSettings) {
      resetEmail({ admin_email: allSettings.admin_email ?? '' })
    }
  }, [allSettings, resetEmail])

  const onSubmit = async (data: ChangePwForm) => {
    if (!user) return
    const r = await window.api.auth.changePassword(user.id, data.current, data.next)
    if (r.success) {
      toast.success('تم تغيير كلمة المرور بنجاح')
      reset()
    } else {
      toast.error(r.error ?? 'حدث خطأ أثناء تغيير كلمة المرور')
    }
  }

  const onEmailSubmit = async (data: { admin_email: string }) => {
    const r = await window.api.settings.setMany(data as unknown as Record<string, string>, user?.id)
    if (r.success) {
      toast.success('تم حفظ بريد الاستعادة')
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    } else {
      toast.error(r.error ?? 'حدث خطأ')
    }
  }

  return (
    <div className="max-w-sm space-y-8">
      {/* Change Password */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">تغيير كلمة المرور</h3>

        <div>
          <label className="label">كلمة المرور الحالية</label>
          <div className="relative">
            <input
              {...register('current')}
              type={showCur ? 'text' : 'password'}
              className="input-field pl-10"
              dir="ltr"
            />
            <button type="button" onClick={() => setShowCur(v => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.current && <p className="text-red-500 text-xs mt-1">{errors.current.message}</p>}
        </div>

        <div>
          <label className="label">كلمة المرور الجديدة</label>
          <div className="relative">
            <input
              {...register('next')}
              type={showNew ? 'text' : 'password'}
              className="input-field pl-10"
              dir="ltr"
            />
            <button type="button" onClick={() => setShowNew(v => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.next && <p className="text-red-500 text-xs mt-1">{errors.next.message}</p>}
        </div>

        <div>
          <label className="label">تأكيد كلمة المرور الجديدة</label>
          <div className="relative">
            <input
              {...register('confirm')}
              type={showConf ? 'text' : 'password'}
              className="input-field pl-10"
              dir="ltr"
            />
            <button type="button" onClick={() => setShowConf(v => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" />
          {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
        </button>
      </form>

      {/* Recovery Email */}
      <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">بريد الاستعادة</h3>
          <p className="text-xs text-gray-500 mt-1">يُستخدم لإرسال رمز OTP عند نسيان كلمة المرور</p>
        </div>

        <div>
          <label className="label">البريد الإلكتروني</label>
          <input
            {...regEmail('admin_email')}
            type="email"
            className="input-field"
            placeholder="you@gmail.com"
            dir="ltr"
          />
          <p className="text-xs text-gray-400 mt-1">
            عند نسيان كلمة المرور سيظهر رمز OTP على الشاشة للتحقق من هويتك
          </p>
        </div>

        <button type="submit" disabled={isEmailSubmitting} className="btn-secondary flex items-center gap-2">
          <Save className="w-4 h-4" />
          {isEmailSubmitting ? 'جاري الحفظ...' : 'حفظ بريد الاستعادة'}
        </button>
      </form>
    </div>
  )
}
