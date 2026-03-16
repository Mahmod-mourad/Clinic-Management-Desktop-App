import { useState, useRef, useEffect } from 'react'
import { Search, User } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

interface Patient {
  id: number
  firstName: string
  lastName: string
  phone: string
  fileNumber: string
}

interface Props {
  onSelect: (patient: Patient) => void
  error?: string
  placeholder?: string
}

export default function PatientSearch({ onSelect, error, placeholder = 'ابحث باسم أو هاتف أو رقم ملف' }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data: results = [] } = useQuery({
    queryKey: ['patient-search', query],
    queryFn: async () => {
      if (query.length < 2) return []
      const r = await window.api.patients.search(query)
      return r.success ? (r.data as Patient[]) : []
    },
    enabled: query.length >= 2,
  })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (patient: Patient) => {
    setQuery(`${patient.firstName} ${patient.lastName}`)
    setOpen(false)
    onSelect(patient)
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          className={cn('input-field pr-9', error && 'border-red-500')}
          placeholder={placeholder}
        />
      </div>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {open && query.length >= 2 && (
        <div className="absolute top-full right-0 left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
          {results.length > 0 ? (
            results.map(patient => (
              <button
                key={patient.id}
                type="button"
                onClick={() => handleSelect(patient)}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-right transition-colors"
              >
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{patient.phone} • {patient.fileNumber}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              لا نتائج — يمكنك إضافة مريض جديد
            </div>
          )}
        </div>
      )}
    </div>
  )
}
