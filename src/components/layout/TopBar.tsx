import { useEffect, useRef, useState } from 'react'
import { Moon, Sun, Bell, Maximize2, Minimize2, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '@/stores/uiStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { formatDateArabic } from '@/lib/dates'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { LicenseStatus } from '@/types/license.types'

export default function TopBar() {
  const { darkMode, toggleDarkMode } = useUIStore()
  const { notifications, addNotification, markAllRead, clearAll, unreadCount } = useNotificationStore()
  const navigate = useNavigate()
  const [time, setTime] = useState(format(new Date(), 'HH:mm'))
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null)
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)
  const count = unreadCount()

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(format(new Date(), 'HH:mm'))
    }, 30_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    window.api.license.getStatus().then(r => {
      if (r.success && r.data) setLicenseStatus(r.data)
    })
  }, [])

  // ── Close bell popover on outside click ────────────────────
  useEffect(() => {
    if (!bellOpen) return
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [bellOpen])

  // ── Periodic notification checks (every 5 min) ─────────────
  const notifiedIds = useRef(new Set<string>())

  useEffect(() => {
    const check = async () => {
      const now = new Date()
      const todayStr = format(now, 'yyyy-MM-dd')

      // 1. Overdue pending appointments (scheduled/confirmed, 30+ min past their time)
      try {
        const r = await window.api.appointments.getByDate(todayStr)
        if (r.success && Array.isArray(r.data)) {
          for (const a of r.data as any[]) {
            if (!['scheduled', 'confirmed'].includes(a.status)) continue
            const [h, m] = (a.timeSlot as string).split(':').map(Number)
            const apptMs = new Date(todayStr).setHours(h, m, 0, 0)
            const diffMin = (now.getTime() - apptMs) / 60_000
            if (diffMin >= 30) {
              const key = `overdue-${a.id}`
              if (!notifiedIds.current.has(key)) {
                notifiedIds.current.add(key)
                const fullName = [a.patientName, a.patientLastName].filter(Boolean).join(' ')
                addNotification({
                  message: `موعد فات ميعاده: ${fullName} (${a.timeSlot})`,
                  type: 'warning',
                })
              }
            }
          }
        }
      } catch { /* ignore */ }

      // 2. Outstanding invoices older than 7 days
      try {
        const cutoffDate = new Date(now)
        cutoffDate.setDate(cutoffDate.getDate() - 7)
        const cutoffStr = format(cutoffDate, 'yyyy-MM-dd')
        const r = await window.api.invoices.getOutstanding()
        if (r.success && Array.isArray(r.data)) {
          for (const inv of r.data as any[]) {
            const invDate = (inv.createdAt ?? inv.issue_date ?? '').slice(0, 10)
            if (!invDate || invDate > cutoffStr) continue
            const key = `invoice-${inv.id}`
            if (!notifiedIds.current.has(key)) {
              notifiedIds.current.add(key)
              addNotification({
                message: `فاتورة معلقة من أكتر من 7 أيام: ${inv.invoice_number ?? `#${inv.id}`}`,
                type: 'warning',
              })
            }
          }
        }
      } catch { /* ignore */ }
    }

    check()
    const interval = setInterval(check, 5 * 60_000)
    return () => clearInterval(interval)
  }, [])

  const toggleFullscreen = async () => {
    const result = await window.api.system.toggleFullscreen()
    if (result && typeof result === 'object' && 'isFullscreen' in result) {
      setIsFullscreen(result.isFullscreen as boolean)
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault()
        toggleFullscreen()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const typeIcon: Record<string, string> = {
    warning: '⚠️',
    info:    'ℹ️',
    success: '✅',
  }

  const relativeTime = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 60_000)
    if (diff < 1)  return 'الآن'
    if (diff < 60) return `منذ ${diff} دقيقة`
    const hours = Math.floor(diff / 60)
    if (hours < 24) return `منذ ${hours} ساعة`
    return `منذ ${Math.floor(hours / 24)} يوم`
  }

  return (
    <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 flex-shrink-0">
      {/* Date + Time */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatDateArabic(new Date().toISOString())}
        </span>
        <span className="text-sm font-mono text-gray-500 dark:text-gray-500">{time}</span>
      </div>

      {/* Trial Banner */}
      {licenseStatus?.isTrial && licenseStatus.daysRemaining <= 7 && licenseStatus.daysRemaining > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>متبقي <strong>{licenseStatus.daysRemaining} أيام</strong> من التجربة</span>
          <button
            onClick={() => navigate('/')}
            className="underline font-medium hover:no-underline"
          >
            تفعيل
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">

        {/* Bell */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => { setBellOpen(o => !o); if (!bellOpen) markAllRead() }}
            className="relative p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className={cn(
              'absolute left-0 top-full mt-2 w-80 z-50',
              'bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700',
              'overflow-hidden',
            )}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  مسح الكل
                </button>
                <span className="font-semibold text-sm text-gray-900 dark:text-white">الإشعارات</span>
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 text-sm">لا توجد إشعارات</div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0',
                        !n.read && 'bg-blue-50/50 dark:bg-blue-900/10',
                      )}
                    >
                      <span className="text-base mt-0.5 flex-shrink-0">{typeIcon[n.type]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 dark:text-gray-200 text-right leading-snug">
                          {n.message}
                        </p>
                        <p className="text-[11px] text-gray-400 text-right mt-0.5">
                          {relativeTime(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={toggleFullscreen}
          title="شاشة كاملة (F11)"
          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <button
          onClick={toggleDarkMode}
          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  )
}
