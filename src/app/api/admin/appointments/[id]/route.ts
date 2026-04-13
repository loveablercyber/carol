import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import {
  AppointmentMaintenanceEntry,
  AppointmentQuestionnaire,
  getAppointmentById,
  updateAppointmentAdminDetails,
} from '@/lib/appointments-store'
import { dispatchAppointmentNotification } from '@/lib/appointment-notifications'

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

    if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Status invalido' },
        { status: 400 }
      )
    }

    const previous = await getAppointmentById(id)
    const appointment = await updateAppointmentAdminDetails({
      id,
      status: status as 'scheduled' | 'completed' | 'cancelled',
      notes,
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

    if (previous && previous.status !== appointment.status) {
      if (appointment.status === 'cancelled') {
        await dispatchAppointmentNotification({
          appointment,
          type: 'cancellation',
        }).catch((error) => {
          console.error('Erro ao disparar notificacao de cancelamento:', error)
        })
      }

      if (appointment.status === 'scheduled') {
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
