import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { RotateCcw, Trash2, User } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/dates'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

export default function RecycleBin() {
  const queryClient = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const { data: deleted = [] } = useQuery({
    queryKey: ['recycle-bin'],
    queryFn: async () => {
      const r = await window.api.recycle.getDeletedPatients()
      return r.success ? (r.data as any[]) : []
    },
  })

  const restore = async (id: number) => {
    const r = await window.api.recycle.restorePatient(id)
    if (r.success) {
      toast.success('تم استعادة المريض')
      queryClient.invalidateQueries({ queryKey: ['recycle-bin'] })
      queryClient.invalidateQueries({ queryKey: ['patients'] })
    } else {
      toast.error(r.error ?? 'فشلت الاستعادة')
    }
  }

  const permanentDelete = async () => {
    if (!deleteTarget) return
    const r = await window.api.recycle.permanentDelete(deleteTarget)
    if (r.success) {
      toast.success('تم الحذف النهائي')
      queryClient.invalidateQueries({ queryKey: ['recycle-bin'] })
    } else {
      toast.error(r.error ?? 'فشل الحذف')
    }
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-3 max-w-2xl">
      <p className="text-sm text-gray-500">
        السجلات المحذوفة تُحذف نهائياً بعد 30 يوم تلقائياً.
      </p>

      {deleted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Trash2 className="w-10 h-10 mb-3" />
          <p className="text-sm">سلة المحذوفات فارغة</p>
        </div>
      ) : (
        deleted.map((p: any) => (
          <div key={p.id} className="card px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {p.first_name} {p.last_name}
                </p>
                <p className="text-xs text-gray-400">
                  حُذف {p.deleted_at ? formatDate(p.deleted_at) : '—'} بواسطة{' '}
                  {p.deleted_by_name ?? 'غير معروف'}
                  {p.delete_reason ? ` — ${p.delete_reason}` : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => restore(p.id)}
                className="flex items-center gap-1 text-xs text-green-600 hover:bg-green-50 px-2 py-1 rounded"
              >
                <RotateCcw className="w-3.5 h-3.5" /> استعادة
              </button>
              <button
                onClick={() => setDeleteTarget(p.id)}
                className="flex items-center gap-1 text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" /> حذف نهائي
              </button>
            </div>
          </div>
        ))
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف نهائي"
        description="هذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد؟"
        confirmLabel="حذف نهائياً"
        variant="danger"
        onConfirm={permanentDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
