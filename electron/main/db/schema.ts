import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql, relations } from 'drizzle-orm'

const timestamps = {
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}

// ─── SETTINGS ─────────────────────────────────────────────────
export const settings = sqliteTable('settings', {
  id:    integer('id').primaryKey({ autoIncrement: true }),
  key:   text('key').notNull().unique(),
  value: text('value'),
  ...timestamps,
})

// ─── USERS ────────────────────────────────────────────────────
export const users = sqliteTable('users', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  name:         text('name').notNull(),
  username:     text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role:         text('role', { enum: ['admin', 'doctor', 'receptionist'] }).notNull().default('receptionist'),
  isActive:     integer('is_active', { mode: 'boolean' }).notNull().default(true),
  ...timestamps,
})

// ─── PATIENTS ─────────────────────────────────────────────────
export const patients = sqliteTable('patients', {
  id:              integer('id').primaryKey({ autoIncrement: true }),
  fileNumber:      text('file_number').notNull().unique(),
  firstName:       text('first_name').notNull(),
  lastName:        text('last_name').notNull(),
  firstNameEn:     text('first_name_en'),
  lastNameEn:      text('last_name_en'),
  phone:           text('phone').notNull(),
  phone2:          text('phone2'),
  nationalId:      text('national_id'),
  dateOfBirth:     text('date_of_birth'),
  gender:          text('gender', { enum: ['male', 'female'] }),
  address:         text('address'),
  bloodType:       text('blood_type', {
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'],
  }).default('unknown'),
  allergies:        text('allergies'),
  chronicDiseases:  text('chronic_diseases'),
  emergencyContact: text('emergency_contact'),
  notes:            text('notes'),
  isActive:         integer('is_active', { mode: 'boolean' }).notNull().default(true),
  searchIndex:      text('search_index'),
  deletedAt:        text('deleted_at'),
  deletedBy:        integer('deleted_by').references(() => users.id),
  deleteReason:     text('delete_reason'),
  ...timestamps,
})

// ─── APPOINTMENTS ──────────────────────────────────────────────
export const appointments = sqliteTable('appointments', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  patientId:      integer('patient_id').notNull().references(() => patients.id),
  doctorId:       integer('doctor_id').references(() => users.id),
  date:           text('date').notNull(),
  timeSlot:       text('time_slot').notNull(),
  duration:       integer('duration').notNull().default(30),
  type:           text('type', {
    enum: ['first-visit', 'follow-up', 'consultation', 'procedure', 'checkup'],
  }).notNull().default('follow-up'),
  status:         text('status', {
    enum: ['scheduled', 'confirmed', 'arrived', 'in-progress', 'completed', 'cancelled', 'no-show'],
  }).notNull().default('scheduled'),
  chiefComplaint: text('chief_complaint'),
  notes:          text('notes'),
  cancelReason:   text('cancel_reason'),
  ...timestamps,
})

// ─── MEDICAL RECORDS ───────────────────────────────────────────
export const medicalRecords = sqliteTable('medical_records', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  patientId:      integer('patient_id').notNull().references(() => patients.id),
  appointmentId:  integer('appointment_id').references(() => appointments.id),
  doctorId:       integer('doctor_id').references(() => users.id),
  visitDate:      text('visit_date').notNull(),
  chiefComplaint: text('chief_complaint'),
  history:        text('history'),
  vitalSigns:     text('vital_signs'),
  examination:    text('examination'),
  diagnosis:      text('diagnosis').notNull(),
  diagnosisCode:  text('diagnosis_code'),
  treatment:      text('treatment'),
  prescription:   text('prescription'),
  labRequests:    text('lab_requests'),
  followUpDate:   text('follow_up_date'),
  followUpNotes:  text('follow_up_notes'),
  attachments:    text('attachments'),
  notes:          text('notes'),
  ...timestamps,
})

// ─── SERVICES CATALOG ──────────────────────────────────────────
export const services = sqliteTable('services', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  name:        text('name').notNull(),
  nameEn:      text('name_en'),
  category:    text('category'),
  price:       integer('price').notNull().default(0),
  duration:    integer('duration').default(30),
  description: text('description'),
  isActive:    integer('is_active', { mode: 'boolean' }).notNull().default(true),
  sortOrder:   integer('sort_order').default(0),
  ...timestamps,
})

// ─── INVOICES ──────────────────────────────────────────────────
export const invoices = sqliteTable('invoices', {
  id:            integer('id').primaryKey({ autoIncrement: true }),
  invoiceNumber: text('invoice_number').notNull().unique(),
  patientId:     integer('patient_id').notNull().references(() => patients.id),
  appointmentId: integer('appointment_id').references(() => appointments.id),
  issueDate:     text('issue_date').notNull(),
  subtotal:      integer('subtotal').notNull().default(0),
  discount:      integer('discount').notNull().default(0),
  discountType:  text('discount_type', { enum: ['fixed', 'percentage'] }).default('fixed'),
  discountNote:  text('discount_note'),
  tax:           integer('tax').notNull().default(0),
  total:         integer('total').notNull().default(0),
  status:        text('status', {
    enum: ['draft', 'issued', 'paid', 'partial', 'cancelled'],
  }).notNull().default('issued'),
  paidAmount:    integer('paid_amount').notNull().default(0),
  notes:         text('notes'),
  ...timestamps,
})

// ─── INVOICE ITEMS ─────────────────────────────────────────────
export const invoiceItems = sqliteTable('invoice_items', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  invoiceId:   integer('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  serviceId:   integer('service_id').references(() => services.id),
  description: text('description').notNull(),
  quantity:    integer('quantity').notNull().default(1),
  unitPrice:   integer('unit_price').notNull(),
  total:       integer('total').notNull(),
  createdAt:   text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
})

// ─── PAYMENTS ──────────────────────────────────────────────────
export const payments = sqliteTable('payments', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  invoiceId:   integer('invoice_id').notNull().references(() => invoices.id),
  amount:      integer('amount').notNull(),
  paymentDate: text('payment_date').notNull(),
  method:      text('method', {
    enum: ['cash', 'card', 'insurance', 'bank-transfer', 'other'],
  }).notNull().default('cash'),
  reference:   text('reference'),
  receivedBy:  integer('received_by').references(() => users.id),
  notes:       text('notes'),
  createdAt:   text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
})

// ─── EXPENSES ──────────────────────────────────────────────────
export const expenses = sqliteTable('expenses', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  category:    text('category').notNull(),
  description: text('description').notNull(),
  amount:      integer('amount').notNull(),
  date:        text('date').notNull(),
  receipt:     text('receipt'),
  notes:       text('notes'),
  ...timestamps,
})

// ─── AUDIT LOG ─────────────────────────────────────────────────
export const auditLog = sqliteTable('audit_log', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  userId:    integer('user_id').references(() => users.id),
  action:    text('action').notNull(),
  entity:    text('entity').notNull(),
  entityId:  integer('entity_id'),
  summary:   text('summary'),
  oldValue:  text('old_value'),
  newValue:  text('new_value'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
})

// ─── RELATIONS ─────────────────────────────────────────────────
export const patientsRelations = relations(patients, ({ many }) => ({
  appointments:   many(appointments),
  medicalRecords: many(medicalRecords),
  invoices:       many(invoices),
}))

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  patient:       one(patients, { fields: [appointments.patientId], references: [patients.id] }),
  doctor:        one(users, { fields: [appointments.doctorId], references: [users.id] }),
  medicalRecord: one(medicalRecords, { fields: [appointments.id], references: [medicalRecords.appointmentId] }),
  invoice:       one(invoices, { fields: [appointments.id], references: [invoices.appointmentId] }),
}))

export const medicalRecordsRelations = relations(medicalRecords, ({ one }) => ({
  patient:     one(patients, { fields: [medicalRecords.patientId], references: [patients.id] }),
  appointment: one(appointments, { fields: [medicalRecords.appointmentId], references: [appointments.id] }),
  doctor:      one(users, { fields: [medicalRecords.doctorId], references: [users.id] }),
}))

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  patient:     one(patients, { fields: [invoices.patientId], references: [patients.id] }),
  appointment: one(appointments, { fields: [invoices.appointmentId], references: [appointments.id] }),
  items:       many(invoiceItems),
  payments:    many(payments),
}))

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, { fields: [invoiceItems.invoiceId], references: [invoices.id] }),
  service: one(services, { fields: [invoiceItems.serviceId], references: [services.id] }),
}))

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, { fields: [payments.invoiceId], references: [invoices.id] }),
}))
