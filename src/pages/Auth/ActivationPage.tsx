import { useState } from 'react'
import { Key, Copy } from 'lucide-react'
import { toast } from 'sonner'
import type { LicenseStatus } from '../../types/license.types'

interface Props {
  status: LicenseStatus
  onActivated: () => void
}

export default function ActivationPage({ status, onActivated }: Props) {
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleActivate = async () => {
    if (!key.trim()) return
    setLoading(true)
    setError('')

    const result = await window.api.license.activate(key)
    setLoading(false)

    if (!result.success || !result.data?.success) {
      setError(result.data?.error ?? result.error ?? 'مفتاح غير صحيح')
      return
    }

    toast.success('تم التفعيل بنجاح! 🎉')
    onActivated()
  }

  const copyMachineId = () => {
    navigator.clipboard.writeText(status.machineId)
    toast.success('تم نسخ رقم الجهاز')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            status.daysRemaining === 0 ? 'bg-red-100' : 'bg-amber-100'
          }`}>
            <Key className={`w-8 h-8 ${status.daysRemaining === 0 ? 'text-red-600' : 'text-amber-600'}`} />
          </div>

          {status.daysRemaining === 0 ? (
            <>
              <h2 className="text-xl font-bold text-red-600 mb-2">انتهت فترة التجربة</h2>
              <p className="text-gray-500 text-sm mb-6">
                انتهت الـ 30 يوماً المجانية. لمتابعة الاستخدام يرجى تفعيل النسخة الكاملة.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-2">تفعيل النظام</h2>
              <p className="text-gray-500 text-sm mb-1">
                متبقي <span className="font-bold text-amber-600">{status.daysRemaining} يوم</span> من التجربة
              </p>
              <p className="text-gray-400 text-xs mb-6">أدخل مفتاح التفعيل للاستخدام غير المحدود</p>
            </>
          )}

          {/* Machine ID */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-4">
            <p className="text-xs text-gray-500 mb-1">رقم جهازك (أرسله لنا للحصول على المفتاح)</p>
            <div className="flex items-center justify-center gap-2">
              <code className="text-base font-bold text-gray-900 dark:text-white tracking-widest">
                {status.machineId}
              </code>
              <button onClick={copyMachineId} className="text-gray-400 hover:text-primary-600">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Key input */}
          <input
            value={key}
            onChange={e => { setKey(e.target.value.toUpperCase()); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleActivate()}
            placeholder="CLINIC-XXXXXXXX-XXXXXXXX-XXXXXXXX"
            className="input-field text-center font-mono text-sm mb-2 tracking-wider"
            dir="ltr"
            autoComplete="off"
            spellCheck={false}
          />

          {error && (
            <p className="text-red-500 text-xs mb-3">{error}</p>
          )}

          <button
            onClick={handleActivate}
            disabled={loading || !key.trim()}
            className="btn-primary w-full py-3 mb-3"
          >
            {loading ? 'جاري التحقق...' : 'تفعيل النظام'}
          </button>

          {status.daysRemaining > 0 && (
            <button
              onClick={onActivated}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              متابعة التجربة ({status.daysRemaining} يوم)
            </button>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-400">للحصول على مفتاح التفعيل تواصل معنا:</p>
            <p className="text-sm font-medium text-primary-600 mt-1">01030796415</p>
          </div>
        </div>
      </div>
    </div>
  )
}
