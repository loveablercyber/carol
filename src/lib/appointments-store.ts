import { db } from '@/lib/db'

export type AppointmentStatus = 'scheduled' | 'cancelled' | 'completed'
export type AppointmentNotificationType = 'confirmation' | 'reminder' | 'cancellation'

export type AppointmentQuestionnaire = {
  name?: string
  phone?: string
  email?: string
  age?: string
  allergies?: string
  megaHairHistory?: string
  hairType?: string
  hairColor?: string
  hairState?: string
  methods?: string
  primaryFlow?: string
  primaryCategory?: string
  maintenanceType?: string
  maintenanceBasePrice?: string
  hairSituation?: string
  additionalServices?: string
  maintenanceKit?: string
  cleanHairObservation?: string
}

export type AppointmentMaintenanceEntry = {
  id: string
  date: string
  notes: string
  createdAt: string
}

export type AppointmentRecord = {
  id: string
  userId: string | null
  customerName: string
  customerEmail: string
  customerPhone: string
  serviceName: string
  scheduledAt: string
  durationMinutes: number
  totalPrice: number
  grams: string | null
  lengthLabel: string | null
  paymentMethod: string | null
  paymentStatus: string
  status: AppointmentStatus
  clientConfirmedAt: string | null
  questionnaireData: AppointmentQuestionnaire | null
  beforeImageUrl: string | null
  afterImageUrl: string | null
  maintenanceHistory: AppointmentMaintenanceEntry[]
  notes: string | null
  confirmationSentAt: string | null
  reminderSentAt: string | null
  cancellationSentAt: string | null
  createdAt: string
  updatedAt: string
}

type AppointmentRow = {
  id: string
  user_id: string | null
  customer_name: string
  customer_email: string
  customer_phone: string
  service_name: string
  scheduled_at: Date | string
  duration_minutes: number
  total_price: number | string
  grams: string | null
  length_label: string | null
  payment_method: string | null
  payment_status: string
  status: string
  client_confirmed_at: Date | string | null
  questionnaire_data: unknown
  before_image_url: string | null
  after_image_url: string | null
  maintenance_history: unknown
  notes: string | null
  confirmation_sent_at: Date | string | null
  reminder_sent_at: Date | string | null
  cancellation_sent_at: Date | string | null
  created_at: Date | string
  updated_at: Date | string
}

type CreateAppointmentInput = {
  userId?: string | null
  customerName: string
  customerEmail: string
  customerPhone: string
  serviceName: string
  scheduledAt: string
  durationMinutes?: number
  totalPrice: number
  grams?: string | null
  lengthLabel?: string | null
  paymentMethod?: string | null
  paymentStatus?: string
  questionnaireData?: AppointmentQuestionnaire | null
  notes?: string | null
}

type ListAppointmentsFilters = {
  status?: AppointmentStatus | 'all'
  from?: string
  to?: string
  userId?: string
  customerEmail?: string
}

let bootstrapPromise: Promise<void> | null = null

function getConfirmationDeadlineHours() {
  const raw = Number(process.env.APPOINTMENT_CONFIRMATION_DEADLINE_HOURS || 12)
  if (!Number.isFinite(raw)) return 12
  return Math.min(72, Math.max(1, Math.floor(raw)))
}

export function getAppointmentConfirmationDeadline(
  scheduledAtIso: string,
  hoursBefore = getConfirmationDeadlineHours()
) {
  const scheduledAt = new Date(scheduledAtIso)
  if (Number.isNaN(scheduledAt.getTime())) return null
  return new Date(scheduledAt.getTime() - hoursBefore * 60 * 60 * 1000).toISOString()
}

export function getAppointmentConfirmationPolicy() {
  const hoursBefore = getConfirmationDeadlineHours()
  return {
    hoursBefore,
  }
}

function asIsoDate(value: Date | string) {
  if (value instanceof Date) return value.toISOString()
  return new Date(value).toISOString()
}

function asStatus(value: string): AppointmentStatus {
  if (value === 'completed') return 'completed'
  if (value === 'cancelled') return 'cancelled'
  return 'scheduled'
}

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }
  if (typeof value === 'object') {
    return value as T
  }
  return fallback
}

function sanitizeQuestionnaireData(
  value: unknown
): AppointmentQuestionnaire | null {
  const parsed = parseJsonField<Record<string, unknown> | null>(value, null)
  if (!parsed || typeof parsed !== 'object') return null

  const questionnaire: AppointmentQuestionnaire = {
    name: typeof parsed.name === 'string' ? parsed.name : undefined,
    phone: typeof parsed.phone === 'string' ? parsed.phone : undefined,
    email: typeof parsed.email === 'string' ? parsed.email : undefined,
    age: typeof parsed.age === 'string' ? parsed.age : undefined,
    allergies: typeof parsed.allergies === 'string' ? parsed.allergies : undefined,
    megaHairHistory:
      typeof parsed.megaHairHistory === 'string'
        ? parsed.megaHairHistory
        : undefined,
    hairType: typeof parsed.hairType === 'string' ? parsed.hairType : undefined,
    hairColor:
      typeof parsed.hairColor === 'string' ? parsed.hairColor : undefined,
    hairState:
      typeof parsed.hairState === 'string' ? parsed.hairState : undefined,
    methods: typeof parsed.methods === 'string' ? parsed.methods : undefined,
    primaryFlow:
      typeof parsed.primaryFlow === 'string' ? parsed.primaryFlow : undefined,
    primaryCategory:
      typeof parsed.primaryCategory === 'string' ? parsed.primaryCategory : undefined,
    maintenanceType:
      typeof parsed.maintenanceType === 'string'
        ? parsed.maintenanceType
        : undefined,
    maintenanceBasePrice:
      typeof parsed.maintenanceBasePrice === 'string'
        ? parsed.maintenanceBasePrice
        : undefined,
    hairSituation:
      typeof parsed.hairSituation === 'string'
        ? parsed.hairSituation
        : undefined,
    additionalServices:
      typeof parsed.additionalServices === 'string'
        ? parsed.additionalServices
        : undefined,
    maintenanceKit:
      typeof parsed.maintenanceKit === 'string'
        ? parsed.maintenanceKit
        : undefined,
    cleanHairObservation:
      typeof parsed.cleanHairObservation === 'string'
        ? parsed.cleanHairObservation
        : undefined,
  }

  const hasAny = Object.values(questionnaire).some((item) => Boolean(item))
  return hasAny ? questionnaire : null
}

function sanitizeMaintenanceHistory(value: unknown): AppointmentMaintenanceEntry[] {
  const parsed = parseJsonField<unknown[]>(value, [])
  if (!Array.isArray(parsed)) return []

  return parsed
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const obj = item as Record<string, unknown>
      const id = typeof obj.id === 'string' ? obj.id : `mnt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const date = typeof obj.date === 'string' ? obj.date : ''
      const notes = typeof obj.notes === 'string' ? obj.notes : ''
      const createdAt =
        typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString()
      if (!date) return null
      return { id, date, notes, createdAt } satisfies AppointmentMaintenanceEntry
    })
    .filter((item): item is AppointmentMaintenanceEntry => Boolean(item))
}

function mapRow(row: AppointmentRow): AppointmentRecord {
  return {
    id: row.id,
    userId: row.user_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    serviceName: row.service_name,
    scheduledAt: asIsoDate(row.scheduled_at),
    durationMinutes: Number(row.duration_minutes || 60),
    totalPrice: Number(row.total_price || 0),
    grams: row.grams,
    lengthLabel: row.length_label,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status || 'pending',
    status: asStatus(row.status),
    clientConfirmedAt: row.client_confirmed_at
      ? asIsoDate(row.client_confirmed_at)
      : null,
    questionnaireData: sanitizeQuestionnaireData(row.questionnaire_data),
    beforeImageUrl: row.before_image_url,
    afterImageUrl: row.after_image_url,
    maintenanceHistory: sanitizeMaintenanceHistory(row.maintenance_history),
    notes: row.notes,
    confirmationSentAt: row.confirmation_sent_at
      ? asIsoDate(row.confirmation_sent_at)
      : null,
    reminderSentAt: row.reminder_sent_at ? asIsoDate(row.reminder_sent_at) : null,
    cancellationSentAt: row.cancellation_sent_at
      ? asIsoDate(row.cancellation_sent_at)
      : null,
    createdAt: asIsoDate(row.created_at),
    updatedAt: asIsoDate(row.updated_at),
  }
}

async function ensureAppointmentsStore() {
  if (bootstrapPromise) return bootstrapPromise

  bootstrapPromise = (async () => {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CustomerAppointment" (
        "id" TEXT PRIMARY KEY,
        "user_id" TEXT NULL,
        "customer_name" TEXT NOT NULL,
        "customer_email" TEXT NOT NULL,
        "customer_phone" TEXT NOT NULL,
        "service_name" TEXT NOT NULL,
        "scheduled_at" TIMESTAMPTZ NOT NULL,
        "duration_minutes" INTEGER NOT NULL DEFAULT 60,
        "total_price" NUMERIC(10,2) NOT NULL DEFAULT 0,
        "grams" TEXT NULL,
        "length_label" TEXT NULL,
        "payment_method" TEXT NULL,
        "payment_status" TEXT NOT NULL DEFAULT 'pending',
        "status" TEXT NOT NULL DEFAULT 'scheduled',
        "client_confirmed_at" TIMESTAMPTZ NULL,
        "questionnaire_data" JSONB NULL,
        "before_image_url" TEXT NULL,
        "after_image_url" TEXT NULL,
        "maintenance_history" JSONB NOT NULL DEFAULT '[]'::jsonb,
        "notes" TEXT NULL,
        "confirmation_sent_at" TIMESTAMPTZ NULL,
        "reminder_sent_at" TIMESTAMPTZ NULL,
        "cancellation_sent_at" TIMESTAMPTZ NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    await db.$executeRawUnsafe(
      `ALTER TABLE "CustomerAppointment" ADD COLUMN IF NOT EXISTS "client_confirmed_at" TIMESTAMPTZ NULL`
    )
    await db.$executeRawUnsafe(
      `ALTER TABLE "CustomerAppointment" ADD COLUMN IF NOT EXISTS "questionnaire_data" JSONB NULL`
    )
    await db.$executeRawUnsafe(
      `ALTER TABLE "CustomerAppointment" ADD COLUMN IF NOT EXISTS "before_image_url" TEXT NULL`
    )
    await db.$executeRawUnsafe(
      `ALTER TABLE "CustomerAppointment" ADD COLUMN IF NOT EXISTS "after_image_url" TEXT NULL`
    )
    await db.$executeRawUnsafe(
      `ALTER TABLE "CustomerAppointment" ADD COLUMN IF NOT EXISTS "maintenance_history" JSONB NOT NULL DEFAULT '[]'::jsonb`
    )
    await db.$executeRawUnsafe(
      `ALTER TABLE "CustomerAppointment" ADD COLUMN IF NOT EXISTS "confirmation_sent_at" TIMESTAMPTZ NULL`
    )
    await db.$executeRawUnsafe(
      `ALTER TABLE "CustomerAppointment" ADD COLUMN IF NOT EXISTS "reminder_sent_at" TIMESTAMPTZ NULL`
    )
    await db.$executeRawUnsafe(
      `ALTER TABLE "CustomerAppointment" ADD COLUMN IF NOT EXISTS "cancellation_sent_at" TIMESTAMPTZ NULL`
    )

    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "idx_customer_appointment_scheduled_at" ON "CustomerAppointment" ("scheduled_at")`
    )
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "idx_customer_appointment_status" ON "CustomerAppointment" ("status")`
    )
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "idx_customer_appointment_user_id" ON "CustomerAppointment" ("user_id")`
    )
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "idx_customer_appointment_email" ON "CustomerAppointment" ("customer_email")`
    )
  })()

  return bootstrapPromise
}

export async function createAppointment(input: CreateAppointmentInput) {
  await ensureAppointmentsStore()
  const id = `apt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  const durationMinutes = Number.isFinite(input.durationMinutes)
    ? Number(input.durationMinutes)
    : 60

  await db.$executeRawUnsafe(
    `
      INSERT INTO "CustomerAppointment" (
        "id",
        "user_id",
        "customer_name",
        "customer_email",
        "customer_phone",
        "service_name",
        "scheduled_at",
        "duration_minutes",
        "total_price",
        "grams",
        "length_label",
        "payment_method",
        "payment_status",
        "status",
        "client_confirmed_at",
        "questionnaire_data",
        "before_image_url",
        "after_image_url",
        "maintenance_history",
        "notes"
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'scheduled',NULL,$14::jsonb,$15,$16,$17::jsonb,$18)
    `,
    id,
    input.userId || null,
    input.customerName,
    input.customerEmail.toLowerCase(),
    input.customerPhone,
    input.serviceName,
    new Date(input.scheduledAt),
    durationMinutes,
    Number(input.totalPrice || 0),
    input.grams || null,
    input.lengthLabel || null,
    input.paymentMethod || null,
    input.paymentStatus || 'pending',
    input.questionnaireData ? JSON.stringify(input.questionnaireData) : null,
    null,
    null,
    JSON.stringify([]),
    input.notes || null
  )

  return getAppointmentById(id)
}

export async function getAppointmentById(id: string) {
  await ensureAppointmentsStore()
  const rows = await db.$queryRawUnsafe<AppointmentRow[]>(
    `
      SELECT
        "id",
        "user_id",
        "customer_name",
        "customer_email",
        "customer_phone",
        "service_name",
        "scheduled_at",
        "duration_minutes",
        "total_price",
        "grams",
        "length_label",
        "payment_method",
        "payment_status",
        "status",
        "client_confirmed_at",
        "questionnaire_data",
        "before_image_url",
        "after_image_url",
        "maintenance_history",
        "notes",
        "confirmation_sent_at",
        "reminder_sent_at",
        "cancellation_sent_at",
        "created_at",
        "updated_at"
      FROM "CustomerAppointment"
      WHERE "id" = $1
      LIMIT 1
    `,
    id
  )

  const first = rows[0]
  return first ? mapRow(first) : null
}

export async function listAppointments(filters: ListAppointmentsFilters = {}) {
  await ensureAppointmentsStore()
  await releaseExpiredUnconfirmedAppointments()

  const whereParts: string[] = []
  const params: unknown[] = []

  if (filters.status && filters.status !== 'all') {
    params.push(filters.status)
    whereParts.push(`"status" = $${params.length}`)
  }

  if (filters.userId) {
    params.push(filters.userId)
    whereParts.push(`"user_id" = $${params.length}`)
  }

  if (filters.customerEmail) {
    params.push(filters.customerEmail.toLowerCase())
    whereParts.push(`LOWER("customer_email") = $${params.length}`)
  }

  if (filters.from) {
    params.push(new Date(filters.from))
    whereParts.push(`"scheduled_at" >= $${params.length}`)
  }

  if (filters.to) {
    params.push(new Date(filters.to))
    whereParts.push(`"scheduled_at" <= $${params.length}`)
  }

  const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : ''

  const rows = await db.$queryRawUnsafe<AppointmentRow[]>(
    `
      SELECT
        "id",
        "user_id",
        "customer_name",
        "customer_email",
        "customer_phone",
        "service_name",
        "scheduled_at",
        "duration_minutes",
        "total_price",
        "grams",
        "length_label",
        "payment_method",
        "payment_status",
        "status",
        "client_confirmed_at",
        "questionnaire_data",
        "before_image_url",
        "after_image_url",
        "maintenance_history",
        "notes",
        "confirmation_sent_at",
        "reminder_sent_at",
        "cancellation_sent_at",
        "created_at",
        "updated_at"
      FROM "CustomerAppointment"
      ${whereClause}
      ORDER BY "scheduled_at" DESC
    `,
    ...params
  )

  return rows.map(mapRow)
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus, notes?: string) {
  await ensureAppointmentsStore()

  await db.$executeRawUnsafe(
    `
      UPDATE "CustomerAppointment"
      SET
        "status" = $2,
        "client_confirmed_at" = CASE WHEN $2 = 'scheduled' THEN "client_confirmed_at" ELSE NULL END,
        "notes" = COALESCE($3, "notes"),
        "updated_at" = NOW()
      WHERE "id" = $1
    `,
    id,
    status,
    notes || null
  )

  return getAppointmentById(id)
}

export async function updateAppointmentAdminDetails(input: {
  id: string
  status: AppointmentStatus
  notes?: string | null
  questionnaireData?: AppointmentQuestionnaire | null
  beforeImageUrl?: string | null
  afterImageUrl?: string | null
  maintenanceHistory?: AppointmentMaintenanceEntry[]
}) {
  await ensureAppointmentsStore()
  const current = await getAppointmentById(input.id)
  if (!current) return null

  const nextNotes =
    input.notes === undefined ? current.notes : input.notes ? input.notes : null
  const nextQuestionnaire =
    input.questionnaireData === undefined
      ? current.questionnaireData
      : sanitizeQuestionnaireData(input.questionnaireData)
  const nextBeforeImage =
    input.beforeImageUrl === undefined
      ? current.beforeImageUrl
      : input.beforeImageUrl
        ? input.beforeImageUrl
        : null
  const nextAfterImage =
    input.afterImageUrl === undefined
      ? current.afterImageUrl
      : input.afterImageUrl
        ? input.afterImageUrl
        : null
  const nextMaintenance =
    input.maintenanceHistory === undefined
      ? current.maintenanceHistory
      : sanitizeMaintenanceHistory(input.maintenanceHistory)

  await db.$executeRawUnsafe(
    `
      UPDATE "CustomerAppointment"
      SET
        "status" = $2,
        "client_confirmed_at" = CASE WHEN $2 = 'scheduled' THEN "client_confirmed_at" ELSE NULL END,
        "notes" = $3,
        "questionnaire_data" = $4::jsonb,
        "before_image_url" = $5,
        "after_image_url" = $6,
        "maintenance_history" = $7::jsonb,
        "updated_at" = NOW()
      WHERE "id" = $1
    `,
    input.id,
    input.status,
    nextNotes,
    nextQuestionnaire ? JSON.stringify(nextQuestionnaire) : null,
    nextBeforeImage,
    nextAfterImage,
    JSON.stringify(nextMaintenance || [])
  )

  return getAppointmentById(input.id)
}

export async function listDaySlots(dateIso: string) {
  await ensureAppointmentsStore()
  await releaseExpiredUnconfirmedAppointments()
  const date = new Date(dateIso)
  if (Number.isNaN(date.getTime())) return []

  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  const rows = await db.$queryRawUnsafe<AppointmentRow[]>(
    `
      SELECT
        "id",
        "user_id",
        "customer_name",
        "customer_email",
        "customer_phone",
        "service_name",
        "scheduled_at",
        "duration_minutes",
        "total_price",
        "grams",
        "length_label",
        "payment_method",
        "payment_status",
        "status",
        "client_confirmed_at",
        "questionnaire_data",
        "before_image_url",
        "after_image_url",
        "maintenance_history",
        "notes",
        "confirmation_sent_at",
        "reminder_sent_at",
        "cancellation_sent_at",
        "created_at",
        "updated_at"
      FROM "CustomerAppointment"
      WHERE "scheduled_at" >= $1
        AND "scheduled_at" <= $2
        AND "status" = 'scheduled'
      ORDER BY "scheduled_at" ASC
    `,
    start,
    end
  )

  return rows.map(mapRow)
}

export async function listAppointmentsForReminder(input: {
  fromIso: string
  toIso: string
}) {
  await ensureAppointmentsStore()
  await releaseExpiredUnconfirmedAppointments()
  const from = new Date(input.fromIso)
  const to = new Date(input.toIso)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return []

  const rows = await db.$queryRawUnsafe<AppointmentRow[]>(
    `
      SELECT
        "id",
        "user_id",
        "customer_name",
        "customer_email",
        "customer_phone",
        "service_name",
        "scheduled_at",
        "duration_minutes",
        "total_price",
        "grams",
        "length_label",
        "payment_method",
        "payment_status",
        "status",
        "client_confirmed_at",
        "questionnaire_data",
        "before_image_url",
        "after_image_url",
        "maintenance_history",
        "notes",
        "confirmation_sent_at",
        "reminder_sent_at",
        "cancellation_sent_at",
        "created_at",
        "updated_at"
      FROM "CustomerAppointment"
      WHERE "status" = 'scheduled'
        AND "client_confirmed_at" IS NOT NULL
        AND "scheduled_at" >= $1
        AND "scheduled_at" <= $2
        AND "reminder_sent_at" IS NULL
      ORDER BY "scheduled_at" ASC
    `,
    from,
    to
  )

  return rows.map(mapRow)
}

export async function confirmAppointmentByCustomer(id: string) {
  await ensureAppointmentsStore()
  await db.$executeRawUnsafe(
    `
      UPDATE "CustomerAppointment"
      SET
        "client_confirmed_at" = NOW(),
        "updated_at" = NOW()
      WHERE "id" = $1
        AND "status" = 'scheduled'
    `,
    id
  )

  return getAppointmentById(id)
}

export async function releaseExpiredUnconfirmedAppointments(nowIso?: string) {
  await ensureAppointmentsStore()

  const now = nowIso ? new Date(nowIso) : new Date()
  if (Number.isNaN(now.getTime())) return 0

  const hoursBefore = getConfirmationDeadlineHours()
  const cutoff = new Date(now.getTime() + hoursBefore * 60 * 60 * 1000)
  const note = `Cancelado automaticamente por falta de confirmacao no prazo (${hoursBefore}h antes do horario).`

  const affected = await db.$executeRawUnsafe(
    `
      UPDATE "CustomerAppointment"
      SET
        "status" = 'cancelled',
        "notes" = CASE
          WHEN "notes" IS NULL OR "notes" = '' THEN $2
          WHEN POSITION($2 IN "notes") > 0 THEN "notes"
          ELSE "notes" || E'\\n' || $2
        END,
        "updated_at" = NOW()
      WHERE "status" = 'scheduled'
        AND "client_confirmed_at" IS NULL
        AND "scheduled_at" <= $1
    `,
    cutoff,
    note
  )

  return Number(affected || 0)
}

export async function markAppointmentNotificationSent(
  id: string,
  type: AppointmentNotificationType
) {
  await ensureAppointmentsStore()

  const columnByType: Record<AppointmentNotificationType, string> = {
    confirmation: 'confirmation_sent_at',
    reminder: 'reminder_sent_at',
    cancellation: 'cancellation_sent_at',
  }

  const column = columnByType[type]
  await db.$executeRawUnsafe(
    `
      UPDATE "CustomerAppointment"
      SET "${column}" = NOW(), "updated_at" = NOW()
      WHERE "id" = $1
    `,
    id
  )

  return getAppointmentById(id)
}
