import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight,
  User,
  Phone,
  Calendar,
  FileText,
  Pencil,
  Plus,
  ClipboardList,
  Receipt,
  Lock,
} from 'lucide-react'
import { formatDate, calculateAge } from '@/lib/dates'
import { formatEGP } from '@/lib/currency'
import PatientForm from './PatientForm'
import MedicalRecordForm from './MedicalRecordForm'
import { useCan } from '@/hooks/useCan'

const genderLabels: Record<string, string> = { male: 'ذكر', female: 'أنثى' }
const bloodTypeColors: Record<string, string> = {
  'A+': 'bg-red-100 text-red-700',
  'A-': 'bg-red-100 text-red-700',
  'B+': 'bg-blue-100 text-blue-700',
  'B-': 'bg-blue-100 text-blue-700',
  'AB+': 'bg-purple-100 text-purple-700',
  'AB-': 'bg-purple-100 text-purple-700',
  'O+': 'bg-green-100 text-green-700',
  'O-': 'bg-green-100 text-green-700',
}

export default function PatientProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const patientId = parseInt(id!)
  const [tab, setTab] = useState<'info' | 'records' | 'invoices'>('info')
  const [showEdit, setShowEdit] = useState(false)
  const [showRecordForm, setShowRecordForm] = useState(false)
  const canViewMedical = useCan('medical_records:view')

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      const r = await window.api.patients.getById(patientId)
      return r.success ? (r.data as any) : null
    },
  })

  const { data: records = [] } = useQuery({
    queryKey: ['medical-records', patientId],
    queryFn: async () => {
      const r = await window.api.medicalRecords.getByPatient(patientId)
      return r.success ? (r.data as any[]) : []
    },
    enabled: tab === 'records',
  })

  const { data: invoices = [] } = useQuery({
    queryKey: ['patient-invoices', patientId],
    queryFn: async () => {
      const r = await window.api.invoices.getByPatient(patientId)
      return r.success ? (r.data as any[]) : []
    },
    enabled: tab === 'invoices',
  })

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="page-content flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="page-container">
        <div className="page-content flex flex-col items-center justify-center">
          <p className="text-gray-500">لم يتم العثور على المريض</p>
          <button onClick={() => navigate('/patients')} className="btn-primary mt-4">
            العودة للقائمة
          </button>
        </div>
      </div>
    )
  }

  const tabs = [
    { key: 'info',     label: 'البيانات الشخصية', icon: User },
    { key: 'records',  label: 'السجل الطبي',       icon: ClipboardList },
    { key: 'invoices', label: 'الفواتير',           icon: Receipt },
  ] as const

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
        <button
          onClick={() => navigate('/patients')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-primary-600" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {patient.firstName} {patient.lastName}
            </h1>
            <span className="text-sm text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
              {patient.fileNumber}
            </span>
            {patient.bloodType && patient.bloodType !== 'unknown' && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bloodTypeColors[patient.bloodType] ?? 'bg-gray-100 text-gray-600'}`}>
                {patient.bloodType}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-0.5 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> {patient.phone}
            </span>
            {patient.dateOfBirth && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {calculateAge(patient.dateOfBirth)} سنة
              </span>
            )}
            {patient.gender && <span>{genderLabels[patient.gender]}</span>}
          </div>
        </div>

        <button
          onClick={() => setShowEdit(true)}
          className="btn-secondary flex items-center gap-2"
        >
          <Pencil className="w-4 h-4" />
          تعديل
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 flex-shrink-0">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="page-content">
        {tab === 'info' && <PatientInfo patient={patient} />}

        {tab === 'records' && canViewMedical && (
          <RecordsTab
            records={records}
            onAddRecord={() => setShowRecordForm(true)}
          />
        )}
        {tab === 'records' && !canViewMedical && (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Lock className="w-10 h-10 mb-3 opacity-40" />
            <p className="font-medium">غير مصرح</p>
            <p className="text-sm mt-1">ليس لديك صلاحية عرض السجل الطبي</p>
          </div>
        )}

        {tab === 'invoices' && <InvoicesTab invoices={invoices} />}
      </div>

      {/* Edit modal */}
      {showEdit && (
        <PatientForm
          patient={patient}
          onClose={() => setShowEdit(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['patient', patientId] })
          }}
        />
      )}

      {/* Medical record form */}
      {showRecordForm && (
        <MedicalRecordForm
          patientId={patientId}
          onClose={() => setShowRecordForm(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['medical-records', patientId] })
            setShowRecordForm(false)
          }}
        />
      )}
    </div>
  )
}

// ─── Patient Info Tab ───────────────────────────────────────────

function PatientInfo({ patient }: { patient: any }) {
  const fields = [
    { label: 'رقم الهاتف الاحتياطي', value: patient.phone2 },
    { label: 'الرقم القومي', value: patient.nationalId },
    { label: 'العنوان', value: patient.address },
    { label: 'جهة الاتصال للطوارئ', value: patient.emergencyContact },
    { label: 'الحساسية', value: patient.allergies },
    { label: 'الأمراض المزمنة', value: patient.chronicDiseases },
    { label: 'ملاحظات', value: patient.notes },
  ].filter(f => f.value)

  if (fields.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p>لا توجد بيانات إضافية</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="card divide-y divide-gray-100 dark:divide-gray-700">
        {fields.map(({ label, value }) => (
          <div key={label} className="flex items-start gap-4 px-5 py-3">
            <span className="text-sm text-gray-500 w-40 flex-shrink-0">{label}</span>
            <span className="text-sm text-gray-900 dark:text-white flex-1">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Medical Records Tab ────────────────────────────────────────

function RecordsTab({ records, onAddRecord }: { records: any[]; onAddRecord: () => void }) {
  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={onAddRecord} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          إضافة زيارة
        </button>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">لا يوجد سجل طبي</p>
          <p className="text-sm mt-1">اضغط على "إضافة زيارة" لتسجيل أول زيارة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((rec: any) => (
            <div key={rec.id} className="card p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDate(rec.visitDate ?? rec.visit_date)}
                  </span>
                  {(rec.doctorName ?? rec.doctor_name) && (
                    <span className="text-sm text-gray-500 mr-2">
                      — د. {rec.doctorName ?? rec.doctor_name}
                    </span>
                  )}
                </div>
              </div>
              {(rec.chiefComplaint ?? rec.chief_complaint) && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span className="font-medium">الشكوى: </span>
                  {rec.chiefComplaint ?? rec.chief_complaint}
                </p>
              )}
              <p className="text-sm text-gray-800 dark:text-gray-200">
                <span className="font-medium">التشخيص: </span>
                {rec.diagnosis}
              </p>
              {rec.treatment && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <span className="font-medium">العلاج: </span>
                  {rec.treatment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Invoices Tab ───────────────────────────────────────────────

function InvoicesTab({ invoices }: { invoices: any[] }) {
  const statusLabels: Record<string, { label: string; className: string }> = {
    issued:    { label: 'صادرة',  className: 'bg-blue-100 text-blue-700' },
    paid:      { label: 'مدفوعة', className: 'bg-green-100 text-green-700' },
    partial:   { label: 'جزئي',   className: 'bg-amber-100 text-amber-700' },
    cancelled: { label: 'ملغاة',  className: 'bg-red-100 text-red-700' },
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Receipt className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="font-medium">لا توجد فواتير</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {invoices.map((inv: any) => {
        const cfg = statusLabels[inv.status] ?? { label: inv.status, className: 'bg-gray-100 text-gray-600' }
        return (
          <div key={inv.id} className="card px-4 py-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {inv.invoiceNumber ?? inv.invoice_number}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.className}`}>
                  {cfg.label}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {formatDate(inv.issueDate ?? inv.issue_date)}
              </p>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">
                {formatEGP(inv.total)}
              </p>
              {inv.paid_amount < inv.total && (
                <p className="text-xs text-amber-600">
                  متبقي: {formatEGP(inv.total - (inv.paidAmount ?? inv.paid_amount ?? 0))}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
