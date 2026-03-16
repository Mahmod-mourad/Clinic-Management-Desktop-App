import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Shield } from 'lucide-react'

const actionLabels: Record<string, { label: string; color: string }> = {
  create:  { label: 'إضافة',   color: 'text-green-600 bg-green-50' },
  update:  { label: 'تعديل',   color: 'text-blue-600 bg-blue-50' },
  delete:  { label: 'حذف',     color: 'text-red-600 bg-red-50' },
  login:   { label: 'دخول',    color: 'text-gray-600 bg-gray-100' },
  logout:  { label: 'خروج',    color: 'text-gray-600 bg-gray-100' },
  payment: { label: 'دفع',     color: 'text-purple-600 bg-purple-50' },
  print:   { label: 'طباعة',   color: 'text-amber-600 bg-amber-50' },
  restore: { label: 'استعادة', color: 'text-teal-600 bg-teal-50' },
}

export default function AuditLogPage() {
  const [filters, setFilters] = useState({ from: '', to: '', entity: '', action: '' })

  const { data: logs = [] } = useQuery({
    queryKey: ['audit-log', filters],
    queryFn: async () => {
      const r = await window.api.audit.getLog(filters)
      return r.success ? (r.data as any[]) : []
    },
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="date"
          value={filters.from}
          onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
          className="input-field w-40"
        />
        <input
          type="date"
          value={filters.to}
          onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
          className="input-field w-40"
        />
        <select
          value={filters.entity}
          onChange={e => setFilters(f => ({ ...f, entity: e.target.value }))}
          className="input-field w-44"
        >
          <option value="">كل الكيانات</option>
          <option value="patient">مرضى</option>
          <option value="invoice">فواتير</option>
          <option value="appointment">مواعيد</option>
          <option value="payment">مدفوعات</option>
          <option value="user">مستخدمون</option>
        </select>
        <select
          value={filters.action}
          onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
          className="input-field w-44"
        >
          <option value="">كل العمليات</option>
          <option value="create">إضافة</option>
          <option value="update">تعديل</option>
          <option value="delete">حذف</option>
          <option value="login">دخول</option>
          <option value="payment">دفع</option>
        </select>
      </div>

      {/* Log table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-right font-medium text-gray-600 dark:text-gray-400">الوقت</th>
              <th className="px-4 py-2 text-right font-medium text-gray-600 dark:text-gray-400">المستخدم</th>
              <th className="px-4 py-2 text-right font-medium text-gray-600 dark:text-gray-400">العملية</th>
              <th className="px-4 py-2 text-right font-medium text-gray-600 dark:text-gray-400">التفاصيل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {logs.map((log: any) => {
              const action = actionLabels[log.action]
              return (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('ar-EG')}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-medium">{log.user_name ?? 'النظام'}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${action?.color ?? 'bg-gray-100 text-gray-600'}`}>
                      {action?.label ?? log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                    {log.summary ?? `${log.entity} #${log.entity_id}`}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {logs.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Shield className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>لا توجد عمليات في هذه الفترة</p>
          </div>
        )}
      </div>
    </div>
  )
}
