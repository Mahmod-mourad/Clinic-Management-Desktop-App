import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Calendar, TrendingUp, Clock, AlertCircle, User, MessageCircle, Printer } from 'lucide-react'
import { todayISO } from '@/lib/dates'
import { formatEGP } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { buildWhatsAppURL, buildAppointmentReminder } from '@/lib/whatsapp'
import { pdf } from '@react-pdf/renderer'
import { EndOfDayPDF } from '../Reports/EndOfDayPDF'

export default function DashboardPage() {
  const navigate = useNavigate()
  const today = todayISO()

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const r = await window.api.settings.getAll()
      return r.data as any
    },
  })

  const sendAllReminders = async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const result = await window.api.appointments.getByDate(tomorrowStr)
    const appts = result.data ?? []
    const withPhone = (appts as any[]).filter((a: any) => a.patientPhone)

    if (withPhone.length === 0) {
      toast.info('لا توجد مواعيد غداً أو لا توجد أرقام هواتف')
      return
    }

    toast.info(`جاري إرسال ${withPhone.length} تذكير...`)

    for (const appt of withPhone) {
      const fullName = [appt.patientName, appt.patientLastName].filter(Boolean).join(' ')
      const message = buildAppointmentReminder({
        patientName: fullName,
        clinicName:  settings?.clinic_name ?? 'العيادة',
        doctorName:  settings?.doctor_name ?? 'الطبيب',
        date:        appt.date,
        timeSlot:    appt.timeSlot,
      })
      await window.api.system.openURL(buildWhatsAppURL(appt.patientPhone, message))
      await new Promise(r => setTimeout(r, 800))
    }

    toast.success(`تم إرسال ${withPhone.length} تذكير بنجاح`)
  }

  const printEndOfDayReport = async () => {
    try {
      const reportResult = await window.api.reports.getEndOfDay(today)
      if (!reportResult.success) { toast.error('فشل تحميل التقرير'); return }

      const settingsResult = await window.api.settings.getAll()
      const settingsData = settingsResult.data ?? {}

      const blob = await pdf(
        <EndOfDayPDF data={{
          ...reportResult.data,
          clinicName: (settingsData as any).clinic_name ?? 'العيادة',
          doctorName: (settingsData as any).doctor_name ?? 'الطبيب',
        }} />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `تقرير_${today}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('تم تحميل التقرير')
    } catch (err) {
      toast.error('حدث خطأ أثناء إنشاء التقرير')
      console.error('printEndOfDayReport error:', err)
    }
  }

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', today],
    queryFn: async () => {
      const r = await window.api.reports.getDashboardStats(today)
      return r.success ? (r.data as any) : null
    },
    refetchInterval: 60_000,
  })

  const { data: todayAppts = [], isLoading: loadingAppts } = useQuery({
    queryKey: ['appointments', 'day', today],
    queryFn: async () => {
      const r = await window.api.appointments.getByDate(today)
      return r.success ? (r.data as any[]) : []
    },
    refetchInterval: 30_000,
  })

  const statCards = [
    {
      title: 'مواعيد اليوم',
      value: stats?.todayAppointments ?? 0,
      icon: Calendar,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      onClick: () => navigate('/appointments'),
    },
    {
      title: 'في الانتظار',
      value: todayAppts.filter((a: any) => a.status === 'arrived' || a.status === 'scheduled').length,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      title: 'إيرادات اليوم',
      value: formatEGP(stats?.todayRevenue ?? 0),
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
      onClick: () => navigate('/billing'),
    },
    {
      title: 'فواتير معلقة',
      value: stats?.pendingInvoices ?? 0,
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-900/20',
      onClick: () => navigate('/billing'),
    },
  ]

  const statusLabel: Record<string, string> = {
    scheduled: 'مجدول',
    confirmed: 'مؤكد',
    arrived: 'وصل',
    'in-progress': 'يُعالج',
    completed: 'مكتمل',
    cancelled: 'ملغي',
    'no-show': 'لم يحضر',
  }

  const statusColors: Record<string, string> = {
    scheduled:     'bg-gray-100 text-gray-700',
    confirmed:     'bg-blue-100 text-blue-700',
    arrived:       'bg-amber-100 text-amber-700',
    'in-progress': 'bg-purple-100 text-purple-700',
    completed:     'bg-green-100 text-green-700',
    cancelled:     'bg-red-100 text-red-700',
    'no-show':     'bg-orange-100 text-orange-700',
  }

  return (
    <div className="page-container">
      <div className="page-content space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(card => (
            <div
              key={card.title}
              onClick={card.onClick}
              className={cn(
                'card p-5 flex items-center gap-4',
                card.onClick && 'cursor-pointer hover:shadow-md transition-shadow',
              )}
            >
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', card.bg)}>
                <card.icon className={cn('w-6 h-6', card.color)} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                {isLoading ? (
                  <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                    {card.value}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Today's appointments */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-600" />
              مواعيد اليوم
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={sendAllReminders}
                className="flex items-center gap-1.5 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                تذكير مواعيد الغد
              </button>
              <button
                onClick={printEndOfDayReport}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors"
              >
                <Printer className="w-4 h-4" />
                تقرير اليوم
              </button>
              <button
                onClick={() => navigate('/appointments')}
                className="text-sm text-primary-600 hover:underline"
              >
                عرض الكل
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {loadingAppts ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-3 h-14 bg-gray-50 dark:bg-gray-800/50 animate-pulse" />
              ))
            ) : todayAppts.length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-400 text-sm">
                لا توجد مواعيد اليوم
              </div>
            ) : (
              todayAppts.slice(0, 8).map((appt: any) => {
                const name = [appt.patientName, appt.patientLastName].filter(Boolean).join(' ')
                const statusCfg = statusColors[appt.status] ?? 'bg-gray-100 text-gray-600'
                return (
                  <div key={appt.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{name}</p>
                      <p className="text-xs text-gray-500">{appt.timeSlot} — {appt.type}</p>
                    </div>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusCfg)}>
                      {statusLabel[appt.status] ?? appt.status}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Pending invoices teaser */}
        {stats?.pendingAmount > 0 && (
          <div
            onClick={() => navigate('/billing')}
            className="card p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-400">فواتير غير مسددة</p>
                <p className="text-sm text-amber-700 dark:text-amber-500">
                  {stats.pendingInvoices} فاتورة بإجمالي {formatEGP(stats.pendingAmount)}
                </p>
              </div>
            </div>
            <span className="text-sm text-amber-600 hover:underline">عرض →</span>
          </div>
        )}
      </div>
    </div>
  )
}
