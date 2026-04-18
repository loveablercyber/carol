import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import {
  AppointmentMaintenanceEntry,
  AppointmentQuestionnaire,
  AppointmentStatus,
  deleteAppointment,
  getAppointmentById,
  hasAppointmentConflict,
  updateAppointmentAdminDetails,
} from '@/lib/appointments-store'
import { dispatchAppointmentNotification } from '@/lib/appointment-notifications'
import { getAdminOperationalConfig } from '@/lib/admin-config-store'
import {
  normalizeDurationMinutes,
  validateScheduleWindow,
} from '@/lib/scheduling-availability'
import { releaseDonationHairByAppointment } from '@/lib/donation-campaign-store'

async function ensureAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'admin') {
    return null
  }
  return session
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await ensureAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const status = String(body?.status || '').toLowerCase()
    const notes = typeof body?.notes === 'string' ? body.notes : undefined
    const scheduledAt =
      typeof body?.scheduledAt === 'string' && body.scheduledAt
        ? body.scheduledAt
        : undefined
    const durationMinutes =
      body?.durationMinutes === null || body?.durationMinutes === undefined
        ? undefined
        : Number(body.durationMinutes)
    const beforeImageUrl =
      body?.beforeImageUrl === null
        ? null
        : typeof body?.beforeImageUrl === 'string'
          ? body.beforeImageUrl
          : undefined
    const afterImageUrl =
      body?.afterImageUrl === null
        ? null
        : typeof body?.afterImageUrl === 'string'
          ? body.afterImageUrl
          : undefined
    const questionnaireData =
      body?.questionnaireData === null
        ? null
        : body?.questionnaireData && typeof body.questionnaireData === 'object'
          ? (body.questionnaireData as AppointmentQuestionnaire)
          : undefined
    const maintenanceHistory =
      body?.maintenanceHistory === null
        ? []
        : Array.isArray(body?.maintenanceHistory)
          ? (body.maintenanceHistory as AppointmentMaintenanceEntry[])
          : undefined

    if (!['pending', 'scheduled', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Status invalido' },
        { status: 400 }
      )
    }

    const previous = await getAppointmentById(id)
    if (!previous) {
      return NextResponse.json(
        { error: 'Agendamento nao encontrado' },
        { status: 404 }
      )
    }

    const nextScheduledAt = scheduledAt || previous.scheduledAt
    const nextDuration = normalizeDurationMinutes(
      durationMinutes,
      previous.durationMinutes
    )

    if (['pending', 'scheduled', 'confirmed'].includes(status)) {
      const config = await getAdminOperationalConfig()
      const scheduleWindow = validateScheduleWindow({
        start: new Date(nextScheduledAt),
        durationMinutes: nextDuration,
        settings: config.schedulingSettings,
      })

      if (!scheduleWindow.available) {
        return NextResponse.json(
          { error: scheduleWindow.reason || 'Horario indisponivel' },
          { status: 409 }
        )
      }

      const hasConflict = await hasAppointmentConflict({
        scheduledAt: nextScheduledAt,
        durationMinutes: nextDuration,
        excludeId: id,
      })

      if (hasConflict) {
        return NextResponse.json(
          { error: 'Existe outro agendamento conflitante neste horario.' },
          { status: 409 }
        )
      }
    }

    const appointment = await updateAppointmentAdminDetails({
      id,
      status: status as AppointmentStatus,
      notes,
      scheduledAt: nextScheduledAt,
      durationMinutes: nextDuration,
      beforeImageUrl,
      afterImageUrl,
      questionnaireData,
      maintenanceHistory,
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Agendamento nao encontrado' },
        { status: 404 }
      )
    }

    if (appointment.status === 'cancelled') {
      await releaseDonationHairByAppointment(appointment.id).catch((error) => {
        console.error('Erro ao liberar cabelo da doacao pelo admin:', error)
      })
    }

    if (previous && previous.status !== appointment.status) {
      if (appointment.status === 'cancelled') {
        await dispatchAppointmentNotification({
          appointment,
          type: 'cancellation',
        }).catch((error) => {
          console.error('Erro ao disparar notificacao de cancelamento:', error)
        })
      }

      if (appointment.status === 'scheduled' || appointment.status === 'confirmed') {
        await dispatchAppointmentNotification({
          appointment,
          type: 'confirmation',
        }).catch((error) => {
          console.error('Erro ao disparar notificacao de confirmacao (reativado):', error)
        })
      }
    }

    return NextResponse.json({ appointment })
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar agendamento' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await ensureAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = await params
    const deleted = await deleteAppointment(id)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Agendamento nao encontrado' },
        { status: 404 }
      )
    }

    await releaseDonationHairByAppointment(id).catch((error) => {
      console.error('Erro ao liberar cabelo da doacao apos remocao:', error)
    })

    return NextResponse.json({ deleted })
  } catch (error) {
    console.error('Erro ao remover agendamento:', error)
    return NextResponse.json(
      { error: 'Erro ao remover agendamento' },
      { status: 500 }
    )
  }
}
