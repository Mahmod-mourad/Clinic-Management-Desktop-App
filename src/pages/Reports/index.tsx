import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Calendar, FileText, AlertCircle, Sheet } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import * as XLSX from 'xlsx'
import { formatEGP } from '@/lib/currency'
import { cn } from '@/lib/utils'

const PRESETS = [
  { label: 'هذا الشهر', getRange: () => {
    const now = new Date()
    return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') }
  }},
  { label: 'الشهر الماضي', getRange: () => {
    const prev = subMonths(new Date(), 1)
    return { start: format(startOfMonth(prev), 'yyyy-MM-dd'), end: format(endOfMonth(prev), 'yyyy-MM-dd') }
  }},
  { label: 'آخر 3 أشهر', getRange: () => {
    const now = new Date()
    return { start: format(startOfMonth(subMonths(now, 2)), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') }
  }},
]

const statusLabels: Record<string, string> = {
  scheduled:     'مجدول',
  confirmed:     'مؤكد',
  arrived:       'وصل',
  'in-progress': 'يُعالج',
  completed:     'مكتمل',
  cancelled:     'ملغي',
  'no-show':     'لم يحضر',
}

const typeLabels: Record<string, string> = {
  'first-visit':  'أول مرة',
  'follow-up':    'متابعة',
  'consultation': 'استشارة',
  'procedure':    'إجراء',
  'checkup':      'فحص',
}

export default function ReportsPage() {
  const now = new Date()
  const [start, setStart] = useState(format(startOfMonth(now), 'yyyy-MM-dd'))
  const [end, setEnd] = useState(format(endOfMonth(now), 'yyyy-MM-dd'))
  const [activePreset, setActivePreset] = useState(0)

  const applyPreset = (idx: number) => {
    const { start: s, end: e } = PRESETS[idx].getRange()
    setStart(s); setEnd(e); setActivePreset(idx)
  }

  const exportExcel = () => {
    if (!financial || !apptStats) return

    const byMethod = (method: string) => {
      const found = (financial.byMethod ?? []).find((m: any) => m.method === method)
      return found ? (found.total / 100).toFixed(2) : '0.00'
    }

    const byStatus = (status: string) => {
      const found = (apptStats.byStatus ?? []).find((s: any) => s.status === status)
      return found ? found.count : 0
    }

    const rows = [
      {
        'من': start,
        'إلى': end,
        'إجمالي الدخل': (financial.revenue / 100).toFixed(2),
        'نقداً': byMethod('cash'),
        'بطاقة': byMethod('card'),
        'تحويل': byMethod('bank-transfer'),
        'تأمين': byMethod('insurance'),
        'أخرى': byMethod('other'),
        'عدد المواعيد': apptStats.total ?? 0,
        'المكتملة': byStatus('completed'),
        'الملغاة': byStatus('cancelled'),
        'لم يحضر': byStatus('no-show'),
        'عدد الفواتير': financial.invoiceCount ?? 0,
      },
    ]

    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!dir'] = 'rtl'
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'التقرير المالي')
    XLSX.writeFile(wb, `تقرير_${start}_${end}.xlsx`)
  }

  const { data: financial, isLoading: loadingFin } = useQuery({
    queryKey: ['report-financial', start, end],
    queryFn: async () => {
      const r = await window.api.reports.getFinancialSummary(start, end)
      return r.success ? (r.data as any) : null
    },
  })

  const { data: apptStats, isLoading: loadingAppt } = useQuery({
    queryKey: ['report-appointments', start, end],
    queryFn: async () => {
      const r = await window.api.reports.getAppointmentStats(start, end)
      return r.success ? (r.data as any) : null
    },
  })

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {PRESETS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => applyPreset(i)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg transition-colors',
                activePreset === i
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <input type="date" value={start} onChange={e => { setStart(e.target.value); setActivePreset(-1) }} className="input-field w-36" />
          <span className="text-gray-400">—</span>
          <input type="date" value={end} onChange={e => { setEnd(e.target.value); setActivePreset(-1) }} className="input-field w-36" />
          <button
            onClick={exportExcel}
            disabled={!financial || !apptStats}
            title="تصدير Excel"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <Sheet className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      <div className="page-content space-y-6">
        {/* Financial Summary */}
        <section>
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            الملخص المالي
          </h2>
          {loadingFin ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : financial ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="الإيرادات المحصلة"
                  value={formatEGP(financial.revenue)}
                  color="green"
                  icon={TrendingUp}
                />
                <StatCard
                  label="إجمالي الفواتير"
                  value={String(financial.invoiceCount)}
                  color="blue"
                  icon={FileText}
                />
                <StatCard
                  label="المصروفات"
                  value={formatEGP(financial.expenses ?? 0)}
                  color="red"
                  icon={AlertCircle}
                />
                <StatCard
                  label="صافي الربح"
                  value={formatEGP(financial.net ?? financial.revenue)}
                  color="primary"
                  icon={TrendingUp}
                />
              </div>

              {/* By payment method */}
              {financial.byMethod?.length > 0 && (
                <div className="card mt-4 p-4">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">توزيع طرق الدفع</h3>
                  <div className="space-y-2">
                    {financial.byMethod.map((m: any) => {
                      const methodLabels: Record<string, string> = {
                        cash: 'نقدي', card: 'بطاقة', 'bank-transfer': 'تحويل', insurance: 'تأمين', other: 'أخرى',
                      }
                      const pct = financial.revenue > 0 ? Math.round(m.total / financial.revenue * 100) : 0
                      return (
                        <div key={m.method} className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 dark:text-gray-400 w-20">
                            {methodLabels[m.method] ?? m.method}
                          </span>
                          <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-2 bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white w-24 text-left">
                            {formatEGP(m.total)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-400 text-sm">لا توجد بيانات</p>
          )}
        </section>

        {/* Appointment Stats */}
        <section>
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            إحصائيات المواعيد
          </h2>
          {loadingAppt ? (
            <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ) : apptStats ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* By status */}
              <div className="card p-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                  حسب الحالة — الإجمالي: {apptStats.total}
                </h3>
                <div className="space-y-2">
                  {(apptStats.byStatus ?? []).map((item: any) => (
                    <div key={item.status} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {statusLabels[item.status] ?? item.status}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-1.5 bg-primary-400 rounded-full"
                            style={{ width: apptStats.total ? `${item.count / apptStats.total * 100}%` : '0%' }}
                          />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white w-6 text-left">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* By type */}
              <div className="card p-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">حسب النوع</h3>
                <div className="space-y-2">
                  {(apptStats.byType ?? []).map((item: any) => (
                    <div key={item.type} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {typeLabels[item.type] ?? item.type}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">لا توجد بيانات</p>
          )}
        </section>
      </div>
    </div>
  )
}

function StatCard({
  label, value, color, icon: Icon,
}: {
  label: string
  value: string
  color: 'green' | 'blue' | 'red' | 'primary'
  icon: React.ComponentType<any>
}) {
  const colorMap = {
    green:   { bg: 'bg-green-50 dark:bg-green-900/20',   text: 'text-green-600' },
    blue:    { bg: 'bg-blue-50 dark:bg-blue-900/20',     text: 'text-blue-600' },
    red:     { bg: 'bg-red-50 dark:bg-red-900/20',       text: 'text-red-600' },
    primary: { bg: 'bg-primary-50 dark:bg-primary-900/20', text: 'text-primary-600' },
  }
  const { bg, text } = colorMap[color]

  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', bg)}>
        <Icon className={cn('w-5 h-5', text)} />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
      </div>
    </div>
  )
}
