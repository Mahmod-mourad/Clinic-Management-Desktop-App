import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useUIStore } from './stores/uiStore'

export default function App() {
  const { darkMode } = useUIStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return <RouterProvider router={router} />
}
