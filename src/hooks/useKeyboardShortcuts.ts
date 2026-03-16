import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

export function useKeyboardShortcuts() {
  const navigate    = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      const tag  = (e.target as HTMLElement).tagName.toLowerCase()

      // Don't fire when typing in input fields
      if (['input', 'textarea', 'select'].includes(tag)) return

      // ── Navigation ──
      if (e.key === 'F1') { e.preventDefault(); navigate('/dashboard') }
      if (e.key === 'F2') { e.preventDefault(); navigate('/appointments') }
      if (e.key === 'F3') { e.preventDefault(); navigate('/patients') }
      if (e.key === 'F4') { e.preventDefault(); navigate('/billing') }
      if (e.key === 'F5') { e.preventDefault(); navigate('/reports') }

      // ── Actions ──
      if (ctrl && e.key === 'n') {
        e.preventDefault()
        document.dispatchEvent(new CustomEvent('shortcut:new-appointment'))
      }
      if (ctrl && e.key === 'p') {
        e.preventDefault()
        document.dispatchEvent(new CustomEvent('shortcut:new-patient'))
      }
      if (ctrl && e.key === 'i') {
        e.preventDefault()
        document.dispatchEvent(new CustomEvent('shortcut:new-invoice'))
      }
      if (ctrl && e.key === 'f') {
        e.preventDefault()
        document.dispatchEvent(new CustomEvent('shortcut:search'))
      }
      if (ctrl && e.key === 'b') {
        e.preventDefault()
        window.api.backup.createNow().then(() => {
          queryClient.invalidateQueries({ queryKey: ['settings'] })
        })
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate, queryClient])
}
