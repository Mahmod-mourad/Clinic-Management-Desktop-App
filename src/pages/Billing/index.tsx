import { useState } from 'react'
import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Receipt, CreditCard, Download, Printer } from 'lucide-react'
import { formatDate } from '@/lib/dates'
import { formatEGP } from '@/lib/currency'
import { cn } from '@/lib/utils'
import StatusBadge from '@/components/shared/StatusBadge'
import EmptyState from '@/components/shared/EmptyState'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import CreateInvoiceModal from './CreateInvoiceModal'
import PaymentModal from './PaymentModal'
import { toast } from 'sonner'
import { pdf } from '@react-pdf/renderer'
import { InvoicePDF } from './InvoicePDF'
import { generateQRBase64, buildInvoiceQRContent } from '@/lib/qrcode'

const STATUS_FILTERS = [
  { value: '',        label: 'الكل' },
  { value: 'issued',  label: 'صادرة' },
  { value: 'partial', label: 'جزئي' },
  { value: 'paid',    label: 'مدفوعة' },
  { value: 'cancelled', label: 'ملغاة' },
]

async function buildAndDownload(inv: any, settings: any, open: boolean) {
  const patientName = [inv.patientName, inv.patientLastName].filter(Boolean).join(' ') || inv.patient_name || '—'
  const invoiceNumber = inv.invoiceNumber ?? inv.invoice_number ?? ''
  const issueDate = inv.issueDate ?? inv.issue_date ?? new Date().toISOString()
  const clinicName = settings?.clinic_name ?? 'العيادة'

  // Fetch full invoice (items)
  const detail = await window.api.invoices.getById(inv.id)
  const items: any[] = (detail.data as any)?.items ?? []

  // Generate QR (non-fatal — PDF still renders if this fails)
  let qrBase64: string | undefined
  try {
    const qrContent = buildInvoiceQRContent({
      invoiceNumber,
      patientName,
      totalPiasters: inv.total,
      issueDate,
      clinicName,
    })
    qrBase64 = await generateQRBase64(qrContent)
  } catch {
    // skip QR silently
  }

  const pdfData = {
    invoiceNumber,
    issueDate,
    patientName,
    patientPhone:      inv.patientPhone ?? inv.patient_phone ?? undefined,
    patientFileNumber: inv.patientFileNumber ?? inv.patient_file_number ?? undefined,
    clinicName,
    clinicPhone:  settings?.clinic_phone ?? '',
    doctorName:   settings?.doctor_name ?? '',
    items: items.map((it: any) => ({
      description: it.description,
      quantity:    it.quantity,
      unitPrice:   it.unitPrice ?? it.unit_price ?? 0,
      total:       it.total,
    })),
    subtotal:   inv.subtotal ?? 0,
    discount:   inv.discount ?? 0,
    total:      inv.total,
    paidAmount: inv.paidAmount ?? inv.paid_amount ?? 0,
    notes:      inv.notes ?? undefined,
    status:     inv.status,
    qrBase64,
  }

  const blob = await pdf(
    React.createElement(InvoicePDF, { data: pdfData })
  ).toBlob()
  const url = URL.createObjectURL(blob)

  if (open) {
    // Print: open in new window then print
    const win = window.open(url)
    win?.addEventListener('load', () => win.print())
  } else {
    // Download
    const a = document.createElement('a')
    a.href = url
    a.download = `فاتورة_${invoiceNumber}.pdf`
    a.click()
  }
  URL.revokeObjectURL(url)
}

export default function BillingPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [payTarget, setPayTarget] = useState<any>(null)
  const [cancelTarget, setCancelTarget] = useState<number | null>(null)
  const [pdfLoading, setPdfLoading] = useState<number | null>(null)

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const r = await window.api.settings.getAll()
      return r.data as any
    },
  })

  const handlePDF = async (inv: any, open: boolean) => {
    setPdfLoading(inv.id)
    try {
      await buildAndDownload(inv, settings, open)
    } catch (err) {
      console.error('[PDF]', err)
      toast.error(`فشل إنشاء PDF: ${String(err)}`)
    } finally {
      setPdfLoading(null)
    }
  }

  const { data = [], isLoading } = useQuery({
    queryKey: ['invoices', statusFilter],
    queryFn: async () => {
      const filters = statusFilter ? { status: statusFilter } : undefined
      const r = await window.api.invoices.getAll(filters as any)
      return r.success ? (r.data as any[]) : []
    },
  })

  const handleCancel = async () => {
    if (!cancelTarget) return
    const r = await window.api.invoices.cancel(cancelTarget)
    if (r.success) {
      toast.success('تم إلغاء الفاتورة')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    }
    setCancelTarget(null)
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
        <div className="flex items-center gap-2">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg transition-colors',
                statusFilter === f.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          فاتورة جديدة
        </button>
      </div>

      {/* List */}
      <div className="page-content">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            icon={<Receipt className="w-12 h-12" />}
            title="لا توجد فواتير"
            description="ابدأ بإنشاء أول فاتورة"
            action={{ label: '+ فاتورة جديدة', onClick: () => setShowCreate(true) }}
          />
        ) : (
          <div className="space-y-2">
            {data.map((inv: any) => {
              const patientName = inv.patientName
                ? `${inv.patientName} ${inv.patientLastName ?? ''}`
                : inv.patient_name ?? '—'
              const invoiceNum = inv.invoiceNumber ?? inv.invoice_number
              const paidAmount = inv.paidAmount ?? inv.paid_amount ?? 0
              const remaining = inv.total - paidAmount
              const canPay = inv.status === 'issued' || inv.status === 'partial'
              const canCancel = inv.status !== 'cancelled' && inv.status !== 'paid'

              return (
                <div key={inv.id} className="card px-4 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 dark:text-white">{patientName}</span>
                      <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                        {invoiceNum}
                      </span>
                      <StatusBadge type="invoice" status={inv.status} />
                    </div>
                    <div className="flex items-center gap-4 mt-0.5 text-sm text-gray-500">
                      <span>{formatDate(inv.issueDate ?? inv.issue_date)}</span>
                      <span>{formatEGP(inv.total)}</span>
                      {remaining > 0 && inv.status !== 'cancelled' && (
                        <span className="text-red-500">متبقي: {formatEGP(remaining)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {canPay && (
                      <button
                        onClick={() => setPayTarget(inv)}
                        className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium px-3 py-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                      >
                        <CreditCard className="w-4 h-4" />
                        دفع
                      </button>
                    )}
                    <button
                      onClick={() => handlePDF(inv, false)}
                      disabled={pdfLoading === inv.id}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 px-2 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-40"
                      title="تحميل PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePDF(inv, true)}
                      disabled={pdfLoading === inv.id}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-40"
                      title="طباعة"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    {canCancel && (
                      <button
                        onClick={() => setCancelTarget(inv.id)}
                        className="text-sm text-red-500 hover:text-red-600 px-2 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        إلغاء
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateInvoiceModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false)
            queryClient.invalidateQueries({ queryKey: ['invoices'] })
          }}
        />
      )}

      {payTarget && (
        <PaymentModal
          invoice={payTarget}
          onClose={() => setPayTarget(null)}
          onSuccess={() => {
            setPayTarget(null)
            queryClient.invalidateQueries({ queryKey: ['invoices'] })
          }}
        />
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        title="إلغاء الفاتورة"
        description="هل أنت متأكد من إلغاء هذه الفاتورة؟"
        confirmLabel="إلغاء الفاتورة"
        variant="warning"
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  )
}
