import { useEffect, useCallback, useRef } from 'react'

interface DraftData<T> {
  data: T
  savedAt: string
}

export function useDraftSave<T>(key: string, data: T) {
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const dataRef = useRef<T>(data)
  dataRef.current = data

  useEffect(() => {
    timerRef.current = setInterval(() => {
      try {
        localStorage.setItem(
          `draft_${key}`,
          JSON.stringify({ data: dataRef.current, savedAt: new Date().toISOString() } satisfies DraftData<T>),
        )
      } catch {
        /* storage full — ignore */
      }
    }, 30_000)

    return () => clearInterval(timerRef.current)
  }, [key])

  const clearDraft = useCallback(() => {
    localStorage.removeItem(`draft_${key}`)
  }, [key])

  const loadDraft = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(`draft_${key}`)
      if (!raw) return null
      const parsed: DraftData<T> = JSON.parse(raw)
      const ageHours = (Date.now() - new Date(parsed.savedAt).getTime()) / 3_600_000
      if (ageHours > 24) {
        clearDraft()
        return null
      }
      return parsed.data
    } catch {
      return null
    }
  }, [key, clearDraft])

  return { clearDraft, loadDraft }
}
