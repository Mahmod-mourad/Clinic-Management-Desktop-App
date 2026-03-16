import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { todayISO } from '@/lib/dates'
import { poundsToPiasters, formatEGP } from '@/lib/currency'
import PatientSearch from '@/components/shared/PatientSearch'

interface LineItem {
  serviceId?: number
  description: string
  quantity: number
  unitPricePounds: number
}

interface Props {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateInvoiceModal({ onClose, onSuccess }: Props) {
  const [patientId, setPatientId] = useState<number | null>(null)
  const [patientName, setPatientName] = useState('')
  const [issueDate, setIssueDate] = useState(todayISO())
  const [items, setItems] = useState<LineItem[]>([{ description: '', quantity: 1, unitPricePounds: 0 }])
  const [discountPounds, setDiscountPounds] = useState(0)
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const r = await window.api.services.getAll()
      return r.success ? (r.data as any[]) : []
    },
  })

  const subtotalPiasters = items.reduce((sum, it) => sum + poundsToPiasters(it.unitPricePounds) * it.quantity, 0)
  const discountPiasters = discountType === 'percentage'
    ? Math.round(subtotalPiasters * discountPounds / 100)
    : poundsToPiasters(discountPounds)
  const totalPiasters = subtotalPiasters - discountPiasters

  const addItem = () => setItems(prev => [...prev, { description: '', quantity: 1, unitPricePounds: 0 }])
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: keyof LineItem, value: any) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  const selectService = (i: number, svc: any) => {
    setItems(prev => prev.map((item, idx) =>
      idx === i
        ? { ...item, serviceId: svc.id, description: svc.name, unitPricePounds: svc.price / 100 }
        : item,
    ))
  }

  const handleSubmit = async () => {
    if (!patientId) { toast.error('اختر المريض أولاً'); return }
    if (items.some(it => !it.description)) { toast.error('أدخل وصف لكل بند'); return }

    setSubmitting(true)
    const payload = {
      patientId,
      issueDate,
      subtotal: subtotalPiasters,
      discount: discountPiasters,
      discountType,
      total: totalPiasters,
      notes: notes || undefined,
      items: items.map(it => ({
        serviceId: it.serviceId,
        description: it.description,
        quantity: it.quantity,
        unitPrice: poundsToPiasters(it.unitPricePounds),
        total: poundsToPiasters(it.unitPricePounds) * it.quantity,
      })),
    }

    const r = await window.api.invoices.create(payload)
    setSubmitting(false)

    if (r.success) {
      toast.success('تم إنشاء الفاتورة')
      onSuccess()
    } else {
      toast.error(r.error ?? 'حدث خطأ')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">فاتورة جديدة</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Patient + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">المريض *</label>
              <PatientSearch
                onSelect={p => { setPatientId(p.id); setPatientName(`${p.firstName} ${p.lastName}`) }}
                placeholder="اختر المريض..."
              />
              {patientName && <p className="text-xs text-green-600 mt-1">✓ {patientName}</p>}
            </div>
            <div>
              <label className="label">التاريخ</label>
              <input
                type="date"
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">البنود</label>
              <button onClick={addItem} className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> إضافة بند
              </button>
            </div>

            <div className="space-y-2">
              {/* Quick-add from services */}
              {services.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {services.map((svc: any) => (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => {
                        const emptyIdx = items.findIndex(it => !it.description)
                        if (emptyIdx >= 0) {
                          selectService(emptyIdx, svc)
                        } else {
                          setItems(prev => [...prev, {
                            serviceId: svc.id,
                            description: svc.name,
                            quantity: 1,
                            unitPricePounds: svc.price / 100,
                          }])
                        }
                      }}
                      className="text-xs px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full hover:bg-primary-100 transition-colors"
                    >
                      + {svc.name} ({formatEGP(svc.price)})
                    </button>
                  ))}
                </div>
              )}

              {/* Item rows */}
              <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 px-1">
                <span className="col-span-6">الوصف</span>
                <span className="col-span-2 text-center">الكمية</span>
                <span className="col-span-3 text-center">السعر (ج.م)</span>
                <span className="col-span-1" />
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    value={item.description}
                    onChange={e => updateItem(i, 'description', e.target.value)}
                    className="input-field col-span-6"
                    placeholder="اسم الخدمة"
                  />
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                    className="input-field col-span-2 text-center"
                  />
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={item.unitPricePounds}
                    onChange={e => updateItem(i, 'unitPricePounds', parseFloat(e.target.value) || 0)}
                    className="input-field col-span-3 text-center"
                    dir="ltr"
                  />
                  <button
                    onClick={() => removeItem(i)}
                    disabled={items.length === 1}
                    className="col-span-1 p-1 text-gray-400 hover:text-red-500 disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Discount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">الخصم</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  value={discountPounds}
                  onChange={e => setDiscountPounds(parseFloat(e.target.value) || 0)}
                  className="input-field flex-1"
                  dir="ltr"
                />
                <select
                  value={discountType}
                  onChange={e => setDiscountType(e.target.value as 'fixed' | 'percentage')}
                  className="input-field w-24"
                >
                  <option value="fixed">ج.م</option>
                  <option value="percentage">%</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">ملاحظات</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} className="input-field" />
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>المجموع الفرعي</span>
              <span>{formatEGP(subtotalPiasters)}</span>
            </div>
            {discountPiasters > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>الخصم</span>
                <span>-{formatEGP(discountPiasters)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-2">
              <span>الإجمالي</span>
              <span>{formatEGP(totalPiasters)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1">
            {submitting ? 'جاري الحفظ...' : 'إنشاء الفاتورة'}
          </button>
        </div>
      </div>
    </div>
  )
}
