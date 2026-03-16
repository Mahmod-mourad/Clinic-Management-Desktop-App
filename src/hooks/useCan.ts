import { useAuthStore } from '@/stores/authStore'
import { can } from '@/lib/permissions'

export function useCan(permission: string): boolean {
  const role = useAuthStore(s => s.user?.role ?? 'receptionist')
  return can(role as any, permission as any)
}
