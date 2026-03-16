import { create } from 'zustand'

export interface AppNotification {
  id: string
  message: string
  type: 'info' | 'warning' | 'success'
  createdAt: Date
  read: boolean
}

interface NotificationStore {
  notifications: AppNotification[]
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void
  markAllRead: () => void
  clearAll: () => void
  unreadCount: () => number
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],

  addNotification: (n) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    set(s => ({
      notifications: [
        { ...n, id, createdAt: new Date(), read: false },
        ...s.notifications,
      ].slice(0, 50), // keep max 50
    }))
  },

  markAllRead: () =>
    set(s => ({
      notifications: s.notifications.map(n => ({ ...n, read: true })),
    })),

  clearAll: () => set({ notifications: [] }),

  unreadCount: () => get().notifications.filter(n => !n.read).length,
}))
