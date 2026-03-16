import { useEffect, useState } from 'react'
import { createHashRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/Auth/LoginPage'
import ActivationPage from './pages/Auth/ActivationPage'
import DashboardPage from './pages/Dashboard'
import AppointmentsPage from './pages/Appointments'
import PatientsPage from './pages/Patients'
import PatientProfile from './pages/Patients/PatientProfile'
import BillingPage from './pages/Billing'
import ReportsPage from './pages/Reports'
import SettingsPage from './pages/Settings'
import OnboardingWizard from './pages/Onboarding'
import type { LicenseStatus } from './types/license.types'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function LicenseGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<LicenseStatus | null>(null)
  const [showActivation, setShowActivation] = useState(false)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) return
    window.api.license.getStatus().then(r => {
      if (r.success && r.data) {
        setStatus(r.data)
        if (!r.data.isValid || (r.data.isTrial && r.data.daysRemaining <= 0)) {
          setShowActivation(true)
        }
      }
    })
  }, [isAuthenticated])

  if (showActivation && status) {
    return (
      <ActivationPage
        status={status}
        onActivated={() => {
          setShowActivation(false)
          window.api.license.getStatus().then(r => {
            if (r.success && r.data) setStatus(r.data)
          })
        }}
      />
    )
  }

  return <>{children}</>
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  useEffect(() => {
    window.api.settings.get('onboarding_completed').then(r => {
      setNeedsOnboarding(!r.data)
      setChecked(true)
    })
  }, [])

  if (!checked) return null
  if (needsOnboarding) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

export const router = createHashRouter([
  { path: '/login',       element: <LoginPage /> },
  { path: '/onboarding',  element: <ProtectedRoute><OnboardingWizard /></ProtectedRoute> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <LicenseGuard>
          <OnboardingGuard>
            <AppLayout />
          </OnboardingGuard>
        </LicenseGuard>
      </ProtectedRoute>
    ),
    children: [
      { index: true,                 element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard',           element: <DashboardPage /> },
      { path: 'appointments',        element: <AppointmentsPage /> },
      { path: 'patients',            element: <PatientsPage /> },
      { path: 'patients/:id',        element: <PatientProfile /> },
      { path: 'billing',             element: <BillingPage /> },
      { path: 'reports',             element: <ReportsPage /> },
      { path: 'settings',            element: <SettingsPage /> },
    ],
  },
])
