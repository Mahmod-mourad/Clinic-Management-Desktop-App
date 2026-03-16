import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { todayISO } from '@/lib/dates'
import { formatEGP, poundsToPiasters } from '@/lib/currency'

interface Props {
  invoice: any
  onClose: () => void
  onSuccess: () => void
}

const methods = [
  { value: 'cash',         label: 'نقدي' },
  { value: 'card',         label: 'بطاقة' },
  { value: 'bank-transfer', label: 'تحويل بنكي' },
  { value: 'insurance',    label: 'تأمين' },
  { value: 'other',        label: 'أخرى' },
]

export default function PaymentModal({ invoice, onClose, onSuccess }: Props) {
  const remaining = invoice.total - (invoice.paidAmount ?? invoice.paid_amount ?? 0)
  const [amountPounds, setAmountPounds] = useState((remaining / 100).toFixed(2))
  const [method, setMethod] = useState('cash')
  const [paymentDate, setPaymentDate] = useState(todayISO())
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    const amount = poundsToPiasters(parseFloat(amountPounds))
    if (!amount || amount <= 0) { toast.error('أدخل مبلغ صحيح'); return }
    if (amount > remaining) { toast.error('المبلغ يتجاوز المتبقي'); return }

    setSubmitting(true)
    const r = await window.api.payments.create({
      invoiceId: invoice.id,
      amount,
      paymentDate,
      method,
      reference: reference || undefined,
      notes: notes || undefined,
    } as any)
    setSubmitting(false)

    if (r.success) {
      toast.success('تم تسجيل الدفع')
      onSuccess()
    } else {
      toast.error(r.error ?? 'حدث خطأ')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">تسجيل دفع</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Invoice summary */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-sm space-y-1">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>الإجمالي</span>
              <span>{formatEGP(invoice.total)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>المدفوع</span>
              <span className="text-green-600">{formatEGP(invoice.paidAmount ?? invoice.paid_amount ?? 0)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-600 pt-1">
              <span>المتبقي</span>
              <span className="text-red-600">{formatEGP(remaining)}</span>
            </div>
          </div>

          <div>
            <label className="label">المبلغ (ج.م) *</label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={amountPounds}
              onChange={e => setAmountPounds(e.target.value)}
              className="input-field text-lg font-bold"
              dir="ltr"
            />
          </div>

          <div>
            <label className="label">طريقة الدفع</label>
            <div className="flex flex-wrap gap-2">
              {methods.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    method === m.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">التاريخ</label>
            <input
              type="date"
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              className="input-field"
            />
          </div>

          {(method === 'card' || method === 'bank-transfer') && (
            <div>
              <label className="label">رقم المرجع</label>
              <input
                value={reference}
                onChange={e => setReference(e.target.value)}
                className="input-field"
                dir="ltr"
              />
            </div>
          )}

          <div>
            <label className="label">ملاحظات</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} className="input-field" />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1">
            {submitting ? 'جاري الحفظ...' : 'تأكيد الدفع'}
          </button>
        </div>
      </div>
    </div>
  )
}
