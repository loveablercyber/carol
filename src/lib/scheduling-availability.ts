import {
  getDefaultSchedulingSettings,
  SchedulingSettings,
} from '@/lib/admin-config-store'
import { AppointmentRecord } from '@/lib/appointments-store'

function timeToMinutes(value: string) {
  const [hours, minutes] = String(value || '00:00')
    .split(':')
    .map((item) => Number(item))
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0)
}

function minutesToTime(total: number) {
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10)
}

function rangeOverlaps(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && endA > startB
}

export function normalizeDurationMinutes(value?: number | string | null, fallback = 60) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(15, Math.min(600, Math.floor(parsed)))
}

export function getSchedulingSettingsOrDefault(
  settings?: SchedulingSettings | null
): SchedulingSettings {
  if (!settings || typeof settings !== 'object') return getDefaultSchedulingSettings()
  const fallback = getDefaultSchedulingSettings()
  return {
    ...fallback,
    ...settings,
    businessHours: Array.isArray(settings.businessHours)
      ? settings.businessHours
      : fallback.businessHours,
    manualBlocks: Array.isArray(settings.manualBlocks)
      ? settings.manualBlocks
      : fallback.manualBlocks,
  }
}

export function validateScheduleWindow(input: {
  start: Date
  durationMinutes: number
  settings: SchedulingSettings
}) {
  const settings = getSchedulingSettingsOrDefault(input.settings)
  const durationMinutes = normalizeDurationMinutes(input.durationMinutes, settings.defaultDurationMinutes)
  const slotStartMinutes = input.start.getHours() * 60 + input.start.getMinutes()
  const slotEndMinutes = slotStartMinutes + durationMinutes
  const day = input.start.getDay()
  const dayConfig = settings.businessHours.find((item) => Number(item.day) === day)

  if (!dayConfig || !dayConfig.active) {
    return { available: false, reason: 'Dia fechado para atendimento.' }
  }

  const businessStart = timeToMinutes(dayConfig.start)
  const businessEnd = timeToMinutes(dayConfig.end)
  if (slotStartMinutes < businessStart || slotEndMinutes > businessEnd) {
    return { available: false, reason: 'Horario fora do funcionamento da agenda.' }
  }

  const blockedBreak = (dayConfig.breaks || []).find((item) =>
    rangeOverlaps(slotStartMinutes, slotEndMinutes, timeToMinutes(item.start), timeToMinutes(item.end))
  )
  if (blockedBreak) {
    return { available: false, reason: 'Horario bloqueado por pausa interna.' }
  }

  const key = dateKey(input.start)
  const manualBlock = (settings.manualBlocks || []).find((item) => {
    if (!item.active || item.date !== key) return false
    return rangeOverlaps(slotStartMinutes, slotEndMinutes, timeToMinutes(item.start), timeToMinutes(item.end))
  })

  if (manualBlock) {
    return {
      available: false,
      reason: manualBlock.reason || 'Horario bloqueado manualmente.',
    }
  }

  return { available: true, reason: '' }
}

export function appointmentConflictsWithSlot(input: {
  start: Date
  durationMinutes: number
  appointment: AppointmentRecord
}) {
  const slotStart = input.start.getTime()
  const slotEnd = slotStart + normalizeDurationMinutes(input.durationMinutes) * 60 * 1000
  const appointmentStart = new Date(input.appointment.scheduledAt).getTime()
  const appointmentEnd =
    appointmentStart + normalizeDurationMinutes(input.appointment.durationMinutes) * 60 * 1000
  return slotStart < appointmentEnd && slotEnd > appointmentStart
}

export function buildAvailableSlots(input: {
  date: Date
  durationMinutes: number
  settings: SchedulingSettings
  appointments: AppointmentRecord[]
  now?: Date
}) {
  const settings = getSchedulingSettingsOrDefault(input.settings)
  const dayConfig = settings.businessHours.find((item) => Number(item.day) === input.date.getDay())
  if (!dayConfig || !dayConfig.active) return []

  const durationMinutes = normalizeDurationMinutes(input.durationMinutes, settings.defaultDurationMinutes)
  const interval = normalizeDurationMinutes(settings.slotIntervalMinutes, 60)
  const startMinutes = timeToMinutes(dayConfig.start)
  const endMinutes = timeToMinutes(dayConfig.end)
  const now = input.now || new Date()
  const slots: Array<{ time: string; displayTime: string; available: boolean; reason?: string }> = []

  for (let minutes = startMinutes; minutes + durationMinutes <= endMinutes; minutes += interval) {
    const slotTime = new Date(input.date)
    slotTime.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)

    if (slotTime <= now) {
      continue
    }

    const window = validateScheduleWindow({
      start: slotTime,
      durationMinutes,
      settings,
    })
    const hasConflict = input.appointments.some((appointment) =>
      appointmentConflictsWithSlot({
        start: slotTime,
        durationMinutes,
        appointment,
      })
    )

    slots.push({
      time: slotTime.toISOString(),
      displayTime: minutesToTime(minutes),
      available: window.available && !hasConflict,
      reason: hasConflict ? 'Horario ocupado por outro agendamento.' : window.reason,
    })
  }

  return slots
}
