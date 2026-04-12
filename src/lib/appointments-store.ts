import { db } from '@/lib/db'

export type AppointmentStatus = 'scheduled' | 'cancelled' | 'completed'

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
  notes: string | null
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
  notes: string | null
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

function asIsoDate(value: Date | string) {
  if (value instanceof Date) return value.toISOString()
  return new Date(value).toISOString()
}

function asStatus(value: string): AppointmentStatus {
  if (value === 'completed') return 'completed'
  if (value === 'cancelled') return 'cancelled'
  return 'scheduled'
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
    notes: row.notes,
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
        "notes" TEXT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

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
        "notes"
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'scheduled',$14)
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
        "notes",
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
        "notes",
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

export async function listDaySlots(dateIso: string) {
  await ensureAppointmentsStore()
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
        "notes",
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
