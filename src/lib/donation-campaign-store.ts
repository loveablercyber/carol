import { db } from '@/lib/db'
import type { AppointmentRecord } from '@/lib/appointments-store'
import { appointmentConflictsWithSlot, normalizeDurationMinutes } from '@/lib/scheduling-availability'

export type DonationHairStatus =
  | 'available'
  | 'awaiting_payment'
  | 'paid'
  | 'reserved'
  | 'unavailable'

export type DonationCampaignStatus =
  | 'inactive'
  | 'scheduled'
  | 'open'
  | 'sold_out'
  | 'closed'

export type DonationHairOption = {
  id: string
  name: string
  description: string
  color: string
  length: string
  observations: string
  imageUrl: string
  status: DonationHairStatus
  appointmentId?: string | null
  customerName?: string | null
  customerEmail?: string | null
  scheduledAt?: string | null
  paidAt?: string | null
  pendingPaymentExpiresAt?: string | null
  order: number
  active: boolean
}

export type DonationScheduleSlot = {
  id: string
  date: string
  start: string
  end: string
  active: boolean
  notes?: string
}

export type DonationCampaignTexts = {
  countdownTitle: string
  countdownDescription: string
  openTitle: string
  openDescription: string
  soldOutTitle: string
  soldOutDescription: string
  paymentNotice: string
}

export type DonationCampaignConfig = {
  active: boolean
  openingAt: string
  closingAt: string
  nextOpeningAt: string
  texts: DonationCampaignTexts
  hairOptions: DonationHairOption[]
  scheduleSlots: DonationScheduleSlot[]
  updatedAt?: string
}

export type DonationCampaignSnapshot = DonationCampaignConfig & {
  status: DonationCampaignStatus
  statusLabel: string
  now: string
  availableCount: number
  totalActiveHairOptions: number
  countdownTarget: string
  isOpen: boolean
}

type DonationCampaignRow = {
  id: string
  content_json: unknown
  updated_at: Date | string
}

const CONFIG_ID = 'current'
const HOLD_MINUTES = 60
let bootstrapPromise: Promise<void> | null = null

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

function toIso(value: Date | string) {
  if (value instanceof Date) return value.toISOString()
  return new Date(value).toISOString()
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
  if (typeof value === 'object') return value as T
  return fallback
}

function defaultHairOptions(): DonationHairOption[] {
  return [
    {
      id: 'hair_marsala',
      name: 'Cabelo Marsala',
      description: 'Opção de cabelo com tonalidade marsala para aplicação da campanha.',
      color: 'Marsala',
      length: 'Comprimento conforme disponibilidade da campanha',
      observations: 'Escolha sujeita a encaixe de cor e avaliação no atendimento.',
      imageUrl: '/images/Bio Proteína Marsala.jpeg',
      status: 'available',
      appointmentId: null,
      customerName: null,
      customerEmail: null,
      scheduledAt: null,
      paidAt: null,
      pendingPaymentExpiresAt: null,
      order: 1,
      active: true,
    },
    {
      id: 'hair_loiro_mel',
      name: 'Cabelo Loiro Mel',
      description: 'Opção de cabelo loiro mel para aplicação da campanha.',
      color: 'Loiro mel',
      length: 'Comprimento conforme disponibilidade da campanha',
      observations: 'Escolha sujeita a encaixe de cor e avaliação no atendimento.',
      imageUrl: '/images/Bio Proteína Loiro Mel.jpeg',
      status: 'available',
      appointmentId: null,
      customerName: null,
      customerEmail: null,
      scheduledAt: null,
      paidAt: null,
      pendingPaymentExpiresAt: null,
      order: 2,
      active: true,
    },
    {
      id: 'hair_loiro_dourado',
      name: 'Cabelo Loiro Dourado',
      description: 'Opção de cabelo loiro dourado para aplicação da campanha.',
      color: 'Loiro dourado',
      length: 'Comprimento conforme disponibilidade da campanha',
      observations: 'Escolha sujeita a encaixe de cor e avaliação no atendimento.',
      imageUrl: '/images/Bio Proteína Loiro Dourado.jpeg',
      status: 'available',
      appointmentId: null,
      customerName: null,
      customerEmail: null,
      scheduledAt: null,
      paidAt: null,
      pendingPaymentExpiresAt: null,
      order: 3,
      active: true,
    },
  ]
}

function defaultDonationCampaignConfig(): DonationCampaignConfig {
  return {
    active: true,
    openingAt: '2026-05-04T09:00:00-03:00',
    closingAt: '2026-05-04T18:00:00-03:00',
    nextOpeningAt: '2026-06-04T09:00:00-03:00',
    texts: {
      countdownTitle: 'Abertura da agenda em breve',
      countdownDescription: 'Faltam alguns dias para abertura da doação. Volte no horário indicado para escolher seu cabelo.',
      openTitle: 'Escolha uma das 3 opções de cabelo disponíveis',
      openDescription: 'Selecione o cabelo, escolha a técnica de aplicação e finalize o agendamento pelo chatbot.',
      soldOutTitle: 'Todos os cabelos desta campanha já foram reservados',
      soldOutDescription: 'A próxima abertura será exibida aqui assim que estiver configurada no painel admin.',
      paymentNotice: 'Para garantir seu horário, é necessário o pagamento antecipado do valor total no painel do cliente.',
    },
    hairOptions: defaultHairOptions(),
    scheduleSlots: [
      { id: 'slot_20260504_0900', date: '2026-05-04', start: '09:00', end: '11:30', active: true, notes: 'Manhã' },
      { id: 'slot_20260504_1200', date: '2026-05-04', start: '12:00', end: '14:30', active: true, notes: 'Meio do dia' },
      { id: 'slot_20260504_1500', date: '2026-05-04', start: '15:00', end: '17:30', active: true, notes: 'Tarde' },
    ],
  }
}

function normalizeStatus(value: unknown): DonationHairStatus {
  if (
    value === 'available' ||
    value === 'awaiting_payment' ||
    value === 'paid' ||
    value === 'reserved' ||
    value === 'unavailable'
  ) {
    return value
  }
  return 'available'
}

function normalizeDateTime(value: unknown, fallback: string) {
  if (typeof value !== 'string' || !value.trim()) return fallback
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? fallback : value
}

function normalizeConfig(input: Partial<DonationCampaignConfig> | null | undefined): DonationCampaignConfig {
  const fallback = defaultDonationCampaignConfig()
  const texts = input?.texts && typeof input.texts === 'object' ? input.texts : fallback.texts
  const hairInput = Array.isArray(input?.hairOptions) ? input?.hairOptions || [] : fallback.hairOptions
  const scheduleInput = Array.isArray(input?.scheduleSlots) ? input?.scheduleSlots || [] : fallback.scheduleSlots

  return {
    active: typeof input?.active === 'boolean' ? input.active : fallback.active,
    openingAt: normalizeDateTime(input?.openingAt, fallback.openingAt),
    closingAt: normalizeDateTime(input?.closingAt, fallback.closingAt),
    nextOpeningAt: normalizeDateTime(input?.nextOpeningAt, fallback.nextOpeningAt),
    texts: {
      ...fallback.texts,
      ...texts,
    },
    hairOptions: hairInput
      .map((item, index) => ({
        id: typeof item.id === 'string' && item.id ? item.id : `hair_${Date.now()}_${index}`,
        name: typeof item.name === 'string' ? item.name : `Cabelo ${index + 1}`,
        description: typeof item.description === 'string' ? item.description : '',
        color: typeof item.color === 'string' ? item.color : '',
        length: typeof item.length === 'string' ? item.length : '',
        observations: typeof item.observations === 'string' ? item.observations : '',
        imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : '',
        status: normalizeStatus(item.status),
        appointmentId: typeof item.appointmentId === 'string' ? item.appointmentId : null,
        customerName: typeof item.customerName === 'string' ? item.customerName : null,
        customerEmail: typeof item.customerEmail === 'string' ? item.customerEmail : null,
        scheduledAt: typeof item.scheduledAt === 'string' ? item.scheduledAt : null,
        paidAt: typeof item.paidAt === 'string' ? item.paidAt : null,
        pendingPaymentExpiresAt:
          typeof item.pendingPaymentExpiresAt === 'string' ? item.pendingPaymentExpiresAt : null,
        order: Number.isFinite(Number(item.order)) ? Number(item.order) : index + 1,
        active: typeof item.active === 'boolean' ? item.active : true,
      }))
      .sort((a, b) => a.order - b.order)
      .slice(0, 12),
    scheduleSlots: scheduleInput
      .map((item, index) => ({
        id: typeof item.id === 'string' && item.id ? item.id : `slot_${Date.now()}_${index}`,
        date: typeof item.date === 'string' ? item.date : '',
        start: typeof item.start === 'string' ? item.start : '09:00',
        end: typeof item.end === 'string' ? item.end : '10:00',
        active: typeof item.active === 'boolean' ? item.active : true,
        notes: typeof item.notes === 'string' ? item.notes : '',
      }))
      .filter((item) => item.date && item.start && item.end)
      .slice(0, 80),
  }
}

async function ensureDonationCampaignStore() {
  if (bootstrapPromise) return bootstrapPromise

  bootstrapPromise = (async () => {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DonationCampaignConfig" (
        "id" TEXT PRIMARY KEY,
        "content_json" JSONB NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
  })()

  return bootstrapPromise
}

function computeSnapshot(config: DonationCampaignConfig, now = new Date()): DonationCampaignSnapshot {
  const activeHair = config.hairOptions.filter((item) => item.active)
  const availableCount = activeHair.filter((item) => item.status === 'available').length
  const openingAt = new Date(config.openingAt)
  const closingAt = config.closingAt ? new Date(config.closingAt) : null
  const allUnavailable = activeHair.length > 0 && availableCount === 0
  let status: DonationCampaignStatus = 'open'

  if (!config.active) status = 'inactive'
  else if (Number.isNaN(openingAt.getTime()) || now < openingAt) status = 'scheduled'
  else if (closingAt && !Number.isNaN(closingAt.getTime()) && now > closingAt) status = 'closed'
  else if (allUnavailable) status = 'sold_out'
  else status = 'open'

  const statusLabel: Record<DonationCampaignStatus, string> = {
    inactive: 'Campanha desativada',
    scheduled: 'Abertura em breve',
    open: 'Campanha aberta',
    sold_out: 'Campanha esgotada',
    closed: 'Campanha encerrada',
  }

  const target = status === 'sold_out' || status === 'closed' ? config.nextOpeningAt : config.openingAt

  return {
    ...config,
    status,
    statusLabel: statusLabel[status],
    now: now.toISOString(),
    availableCount,
    totalActiveHairOptions: activeHair.length,
    countdownTarget: target,
    isOpen: status === 'open',
  }
}

export async function getDonationCampaignConfig(): Promise<DonationCampaignConfig> {
  await ensureDonationCampaignStore()
  await releaseExpiredDonationHairHolds()

  const rows = await db.$queryRawUnsafe<DonationCampaignRow[]>(
    `SELECT "id", "content_json", "updated_at" FROM "DonationCampaignConfig" WHERE "id" = $1 LIMIT 1`,
    CONFIG_ID
  )

  if (!rows[0]) {
    const initial = defaultDonationCampaignConfig()
    await saveDonationCampaignConfig(initial)
    return initial
  }

  const parsed = parseJsonField<Partial<DonationCampaignConfig>>(rows[0].content_json, {})
  return {
    ...normalizeConfig(parsed),
    updatedAt: toIso(rows[0].updated_at),
  }
}

export async function getDonationCampaignSnapshot(now = new Date()) {
  const config = await getDonationCampaignConfig()
  return computeSnapshot(config, now)
}

export async function saveDonationCampaignConfig(input: Partial<DonationCampaignConfig>) {
  await ensureDonationCampaignStore()
  const rows = await db.$queryRawUnsafe<DonationCampaignRow[]>(
    `SELECT "id", "content_json", "updated_at" FROM "DonationCampaignConfig" WHERE "id" = $1 LIMIT 1`,
    CONFIG_ID
  )
  const current = rows[0]
    ? normalizeConfig(parseJsonField<Partial<DonationCampaignConfig>>(rows[0].content_json, {}))
    : defaultDonationCampaignConfig()
  const next = normalizeConfig({ ...current, ...input })

  await db.$executeRawUnsafe(
    `
      INSERT INTO "DonationCampaignConfig" ("id", "content_json", "updated_at")
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT ("id")
      DO UPDATE SET "content_json" = EXCLUDED."content_json", "updated_at" = NOW()
    `,
    CONFIG_ID,
    JSON.stringify(next)
  )

  return computeSnapshot(next)
}

export async function releaseExpiredDonationHairHolds(now = new Date()) {
  await ensureDonationCampaignStore()
  const rows = await db.$queryRawUnsafe<DonationCampaignRow[]>(
    `SELECT "id", "content_json", "updated_at" FROM "DonationCampaignConfig" WHERE "id" = $1 LIMIT 1`,
    CONFIG_ID
  )
  if (!rows[0]) return 0

  const config = normalizeConfig(parseJsonField<Partial<DonationCampaignConfig>>(rows[0].content_json, {}))
  let released = 0
  const nextHairOptions = config.hairOptions.map((item) => {
    if (item.status !== 'awaiting_payment' || !item.pendingPaymentExpiresAt) return item
    const expiresAt = new Date(item.pendingPaymentExpiresAt)
    if (Number.isNaN(expiresAt.getTime()) || expiresAt > now) return item
    released += 1
    return {
      ...item,
      status: 'available' as DonationHairStatus,
      appointmentId: null,
      customerName: null,
      customerEmail: null,
      scheduledAt: null,
      pendingPaymentExpiresAt: null,
    }
  })

  if (released > 0) {
    await db.$executeRawUnsafe(
      `UPDATE "DonationCampaignConfig" SET "content_json" = $2::jsonb, "updated_at" = NOW() WHERE "id" = $1`,
      CONFIG_ID,
      JSON.stringify({ ...config, hairOptions: nextHairOptions })
    )
  }

  return released
}

export function isDonationCampaignOpen(snapshot: DonationCampaignSnapshot) {
  return snapshot.status === 'open'
}

export function findDonationHairOption(config: DonationCampaignConfig, hairOptionId: string) {
  return config.hairOptions.find((item) => item.id === hairOptionId && item.active)
}

function timeToMinutes(value: string) {
  const [hours, minutes] = String(value || '00:00').split(':').map(Number)
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0)
}

function minuteTime(value: Date) {
  return value.getHours() * 60 + value.getMinutes()
}

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10)
}

export function validateDonationScheduleSlot(input: {
  config: DonationCampaignConfig
  scheduledAt: Date
  durationMinutes: number
}) {
  const day = dateKey(input.scheduledAt)
  const startMinutes = minuteTime(input.scheduledAt)
  const duration = normalizeDurationMinutes(input.durationMinutes, 120)
  const endMinutes = startMinutes + duration

  const slot = input.config.scheduleSlots.find((item) => {
    if (!item.active || item.date !== day) return false
    const slotStart = timeToMinutes(item.start)
    const slotEnd = timeToMinutes(item.end)
    return startMinutes >= slotStart && endMinutes <= slotEnd
  })

  if (!slot) {
    return {
      available: false,
      reason: 'Horario nao liberado para a campanha de doacao. Escolha um dos horarios configurados pelo admin.',
    }
  }

  return { available: true, reason: '', slot }
}

export async function buildDonationAvailableSlots(input: {
  date: Date
  durationMinutes: number
  appointments: AppointmentRecord[]
}) {
  const snapshot = await getDonationCampaignSnapshot()
  if (!isDonationCampaignOpen(snapshot)) return []

  const key = dateKey(input.date)
  const duration = normalizeDurationMinutes(input.durationMinutes, 120)
  const now = new Date()

  return snapshot.scheduleSlots
    .filter((slot) => slot.active && slot.date === key)
    .map((slot) => {
      const [hours, minutes] = slot.start.split(':').map(Number)
      const startsAt = new Date(input.date)
      startsAt.setHours(hours || 0, minutes || 0, 0, 0)
      const validWindow = validateDonationScheduleSlot({
        config: snapshot,
        scheduledAt: startsAt,
        durationMinutes: duration,
      })
      const hasConflict = input.appointments.some((appointment) =>
        appointmentConflictsWithSlot({
          start: startsAt,
          durationMinutes: duration,
          appointment,
        })
      )
      const available = startsAt > now && validWindow.available && !hasConflict
      return {
        time: startsAt.toISOString(),
        displayTime: slot.start,
        available,
        reason: hasConflict
          ? 'Horario ocupado por outro agendamento.'
          : validWindow.reason || (!available ? 'Horario indisponivel.' : ''),
      }
    })
}

export async function validateDonationBooking(input: {
  hairOptionId: string
  scheduledAt: Date
  durationMinutes: number
}) {
  const snapshot = await getDonationCampaignSnapshot()
  if (!isDonationCampaignOpen(snapshot)) {
    return {
      ok: false,
      error:
        snapshot.status === 'sold_out'
          ? 'Todos os cabelos desta campanha ja foram reservados.'
          : 'A campanha de doacao ainda nao esta aberta para agendamento.',
      snapshot,
    }
  }

  const hairOption = findDonationHairOption(snapshot, input.hairOptionId)
  if (!hairOption) {
    return { ok: false, error: 'Opcao de cabelo da doacao nao encontrada.', snapshot }
  }

  if (hairOption.status !== 'available') {
    return { ok: false, error: 'Este cabelo nao esta mais disponivel para agendamento.', snapshot }
  }

  const slot = validateDonationScheduleSlot({
    config: snapshot,
    scheduledAt: input.scheduledAt,
    durationMinutes: input.durationMinutes,
  })
  if (!slot.available) {
    return { ok: false, error: slot.reason, snapshot }
  }

  return { ok: true, error: '', snapshot, hairOption }
}

async function mutateHairOption(
  hairOptionId: string,
  updater: (item: DonationHairOption) => DonationHairOption | null
) {
  const config = await getDonationCampaignConfig()
  let changed = false
  const hairOptions = config.hairOptions.map((item) => {
    if (item.id !== hairOptionId) return item
    const next = updater(item)
    if (!next) return item
    changed = true
    return next
  })

  if (!changed) return null
  return saveDonationCampaignConfig({ ...config, hairOptions })
}

export async function markDonationHairAwaitingPayment(input: {
  hairOptionId: string
  appointmentId: string
  customerName: string
  customerEmail: string
  scheduledAt: string
}) {
  return mutateHairOption(input.hairOptionId, (item) => {
    if (item.status !== 'available') return null
    return {
      ...item,
      status: 'awaiting_payment',
      appointmentId: input.appointmentId,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      scheduledAt: input.scheduledAt,
      paidAt: null,
      pendingPaymentExpiresAt: addMinutes(new Date(), HOLD_MINUTES).toISOString(),
    }
  })
}

export async function markDonationHairPaymentStatus(input: {
  appointmentId: string
  paymentStatus: string
}) {
  const config = await getDonationCampaignConfig()
  const normalized = String(input.paymentStatus || '').toUpperCase()
  let changed = false
  const hairOptions = config.hairOptions.map((item) => {
    if (item.appointmentId !== input.appointmentId) return item

    if (normalized === 'APPROVED') {
      changed = true
      return {
        ...item,
        status: 'paid' as DonationHairStatus,
        paidAt: new Date().toISOString(),
        pendingPaymentExpiresAt: null,
      }
    }

    if (['REJECTED', 'CANCELLED', 'REFUNDED'].includes(normalized)) {
      changed = true
      return {
        ...item,
        status: 'available' as DonationHairStatus,
        appointmentId: null,
        customerName: null,
        customerEmail: null,
        scheduledAt: null,
        paidAt: null,
        pendingPaymentExpiresAt: null,
      }
    }

    return item
  })

  if (!changed) return computeSnapshot(config)
  return saveDonationCampaignConfig({ ...config, hairOptions })
}

export async function releaseDonationHairByAppointment(appointmentId: string) {
  const config = await getDonationCampaignConfig()
  let changed = false
  const hairOptions = config.hairOptions.map((item) => {
    if (item.appointmentId !== appointmentId) return item
    if (item.status === 'paid' || item.status === 'reserved') return item
    changed = true
    return {
      ...item,
      status: 'available' as DonationHairStatus,
      appointmentId: null,
      customerName: null,
      customerEmail: null,
      scheduledAt: null,
      paidAt: null,
      pendingPaymentExpiresAt: null,
    }
  })

  if (!changed) return computeSnapshot(config)
  return saveDonationCampaignConfig({ ...config, hairOptions })
}
