import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, Users, Receipt,
  BarChart3, Settings, Stethoscope,
  ChevronRight, ChevronLeft, LogOut,
} from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/',             icon: LayoutDashboard, label: 'الرئيسية' },
  { path: '/appointments', icon: Calendar,        label: 'المواعيد' },
  { path: '/patients',     icon: Users,           label: 'المرضى' },
  { path: '/billing',      icon: Receipt,         label: 'الفواتير' },
  { path: '/reports',      icon: BarChart3,       label: 'التقارير' },
  { path: '/settings',     icon: Settings,        label: 'الإعدادات' },
]

const roleLabels: Record<string, string> = {
  admin:        'مدير',
  doctor:       'طبيب',
  receptionist: 'استقبال',
}

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { user, logout } = useAuthStore()
  const location = useLocation()

  const handleLogout = async () => {
    await window.api.auth.logout?.()
    logout()
  }

  return (
    <aside className={cn(
      'relative flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700',
      'transition-all duration-300 ease-in-out flex-shrink-0',
      sidebarCollapsed ? 'w-16' : 'w-60',
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700 h-14 flex-shrink-0">
        <div className="flex-shrink-0 w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <Stethoscope className="w-4 h-4 text-white" />
        </div>
        {!sidebarCollapsed && (
          <span className="font-bold text-gray-900 dark:text-white text-lg">عيادتي</span>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -left-3 top-16 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 z-10"
      >
        {sidebarCollapsed
          ? <ChevronLeft className="w-3 h-3 text-gray-500" />
          : <ChevronRight className="w-3 h-3 text-gray-500" />
        }
      </button>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path)

          return (
            <NavLink
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium',
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
                sidebarCollapsed && 'justify-center',
              )}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* User info + Logout */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
        {!sidebarCollapsed && user && (
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{user.name}</p>
            <p className="text-xs text-gray-500">{roleLabels[user.role] ?? user.role}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-colors',
            'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium',
            sidebarCollapsed && 'justify-center',
          )}
          title={sidebarCollapsed ? 'خروج' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && <span>خروج</span>}
        </button>
      </div>
    </aside>
  )
}
