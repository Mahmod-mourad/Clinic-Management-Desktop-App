import { create } from 'zustand'

interface ClinicSettings {
  name: string
  currency: string
  timezone: string
}

interface SettingsState {
  settings: ClinicSettings
  setSettings: (settings: Partial<ClinicSettings>) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: {
    name: 'عيادتي',
    currency: 'EGP',
    timezone: 'Africa/Cairo',
  },
  setSettings: (partial) =>
    set((s) => ({ settings: { ...s.settings, ...partial } })),
}))
