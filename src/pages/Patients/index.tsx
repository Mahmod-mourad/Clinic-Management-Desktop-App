import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, User, Phone, Eye, Pencil, Trash2, ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate, calculateAge } from '@/lib/dates'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import EmptyState from '@/components/shared/EmptyState'
import PatientForm from './PatientForm'
import { useAuthStore } from '@/stores/authStore'

export default function PatientsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editPatient, setEditPatient] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [unpaidWarning, setUnpaidWarning] = useState<{ patientName: string; count: number } | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 20

  const { data, isLoading } = useQuery({
    queryKey: ['patients', search, page],
    queryFn: async () => {
      const r = await window.api.patients.getAll({ search, page, pageSize } as any)
      return r.success ? (r.data as any) : { data: [], total: 0 }
    },
  })

  const patients: any[] = data?.data ?? []
  const total: number = data?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)

  const requestDelete = async (patientId: number, patientName: string) => {
    const r = await window.api.invoices.getByPatient(patientId)
    if (r.success) {
      const unpaid = (r.data as any[]).filter(
        (inv: any) => inv.status === 'issued' || inv.status === 'partial'
      )
      if (unpaid.length > 0) {
        setUnpaidWarning({ patientName, count: unpaid.length })
        return
      }
    }
    setDeleteTarget(patientId)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const r = await window.api.patients.softDelete(deleteTarget, user?.id)
    if (r.success) {
      toast.success('تم حذف المريض')
      queryClient.invalidateQueries({ queryKey: ['patients'] })
    } else {
      toast.error(r.error ?? 'فشل حذف المريض')
    }
    setDeleteTarget(null)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="ابحث بالاسم أو الهاتف أو رقم الملف..."
              className="input-field pr-9"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {total > 0 && (
            <span className="text-sm text-gray-500">{total} مريض</span>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            مريض جديد
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="page-content">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : patients.length === 0 ? (
          <EmptyState
            icon={<User className="w-12 h-12" />}
            title="لا يوجد مرضى"
            description={search ? 'لم يتم العثور على نتائج' : 'ابدأ بإضافة أول مريض'}
            action={!search ? { label: '+ إضافة مريض', onClick: () => setShowForm(true) } : undefined}
          />
        ) : (
          <>
            <div className="space-y-2">
              {patients.map((patient: any) => (
                <div
                  key={patient.id}
                  className="card px-4 py-3 flex items-center gap-4 hover:border-primary-200 dark:hover:border-primary-700 transition-colors cursor-pointer"
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {patient.first_name} {patient.last_name}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                        {patient.file_number}
                      </span>
                      {patient.visit_count > 0 && (
                        <span className="text-xs text-gray-400">
                          {patient.visit_count} زيارة
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-0.5">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {patient.phone}
                      </span>
                      {patient.date_of_birth && (
                        <span className="text-sm text-gray-500">
                          {calculateAge(patient.date_of_birth)} سنة
                        </span>
                      )}
                      {patient.last_visit && (
                        <span className="text-sm text-gray-400">
                          آخر زيارة: {formatDate(patient.last_visit)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/patients/${patient.id}`)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
                      title="عرض الملف"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditPatient(patient)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                      title="تعديل"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => requestDelete(patient.id, `${patient.first_name} ${patient.last_name}`)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  صفحة {page} من {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Form */}
      {(showForm || editPatient) && (
        <PatientForm
          patient={editPatient ?? undefined}
          onClose={() => { setShowForm(false); setEditPatient(null) }}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف المريض"
        description="هل أنت متأكد؟ سيتم إخفاء ملف المريض. يمكن الاسترجاع لاحقاً."
        confirmLabel="حذف"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Unpaid Invoices Warning */}
      {unpaidWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">لا يمكن حذف المريض</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              المريض <span className="font-medium text-gray-900 dark:text-white">{unpaidWarning.patientName}</span> لديه{' '}
              <span className="font-medium text-amber-600">{unpaidWarning.count} {unpaidWarning.count === 1 ? 'فاتورة غير مدفوعة' : 'فواتير غير مدفوعة'}</span>.
              <br />
              يجب تسديد أو إلغاء جميع الفواتير قبل حذف المريض.
            </p>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setUnpaidWarning(null)}
                className="btn-primary"
              >
                حسناً
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
