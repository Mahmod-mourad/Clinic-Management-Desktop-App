import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  variant?: 'danger' | 'warning'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'تأكيد',
  variant = 'danger',
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4',
            variant === 'danger' ? 'bg-red-100' : 'bg-amber-100',
          )}
        >
          <AlertTriangle
            className={cn('w-6 h-6', variant === 'danger' ? 'text-red-600' : 'text-amber-600')}
          />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">{title}</h3>
        <p className="text-sm text-gray-500 text-center mt-2">{description}</p>
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="btn-secondary flex-1">
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'flex-1 font-medium px-4 py-2 rounded-lg transition-colors text-white',
              variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
