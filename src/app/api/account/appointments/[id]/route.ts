import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import {
  confirmAppointmentByCustomer,
  getAppointmentById,
  getAppointmentConfirmationDeadline,
  getAppointmentConfirmationPolicy,
  releaseExpiredUnconfirmedAppointments,
  updateAppointmentStatus,
} from '@/lib/appointments-store'
import { dispatchAppointmentNotification } from '@/lib/appointment-notifications'
import { buildGoogleCalendarUrl } from '@/lib/appointment-calendar'

type PatchBody = {
  action?: 'confirm' | 'cancel'
  notes?: string
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function isEvaluationAppointment(appointment: {
  serviceName?: string | null
  questionnaireData?: unknown
}) {
  const serviceName = normalizeText(String(appointment.serviceName || ''))
  const questionnaireData =
    appointment.questionnaireData && typeof appointment.questionnaireData === 'object'
      ? (appointment.questionnaireData as Record<string, unknown>)
      : {}
  const primaryFlow = normalizeText(String(questionnaireData.primaryFlow || ''))
  const primaryCategory = normalizeText(String(questionnaireData.primaryCategory || ''))

  return (
    primaryFlow === 'evaluation' ||
    serviceName.includes('avaliacao') ||
    primaryCategory.includes('avaliacao')
  )
}

function withPresentation(appointment: Awaited<ReturnType<typeof getAppointmentById>>) {
  if (!appointment) return null

  const now = Date.now()
  const deadlineAt = getAppointmentConfirmationDeadline(appointment.scheduledAt)
  const deadlineMs = deadlineAt ? new Date(deadlineAt).getTime() : 0
  const scheduledMs = new Date(appointment.scheduledAt).getTime()
  const normalizedPaymentStatus = String(appointment.paymentStatus || '').toLowerCase()
  const depositRequired =
    !isEvaluationAppointment(appointment) &&
    !['not_required', 'included_in_parent'].includes(normalizedPaymentStatus)
  const paymentApproved =
    String(appointment.paymentStatus || '').toUpperCase() === 'APPROVED'
  const depositApproved = !depositRequired || paymentApproved
  const canConfirm =
    ['pending', 'scheduled'].includes(appointment.status) &&
    depositApproved &&
    !appointment.clientConfirmedAt &&
    Boolean(deadlineMs) &&
    now <= deadlineMs
  const canCancel =
    ['pending', 'scheduled', 'confirmed'].includes(appointment.status) &&
    scheduledMs > now

  return {
    ...appointment,
    confirmationDeadlineAt: deadlineAt,
    canConfirmFromClient: canConfirm,
    canCancelFromClient: canCancel,
    confirmationWindowHours: getAppointmentConfirmationPolicy().hoursBefore,
    depositRequired,
    depositAmount: depositRequired ? appointment.totalPrice : 0,
    depositApproved,
    googleCalendarUrl: buildGoogleCalendarUrl({
      serviceName: appointment.serviceName,
      customerName: appointment.customerName,
      scheduledAt: appointment.scheduledAt,
      durationMinutes: appointment.durationMinutes,
      notes: appointment.notes,
    }),
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const { id } = await context.params
    const body = (await request.json().catch(() => ({}))) as PatchBody
    const action = body.action

    if (action !== 'confirm' && action !== 'cancel') {
      return NextResponse.json(
        { error: 'Acao invalida. Use "confirm" ou "cancel".' },
        { status: 400 }
      )
    }

    await releaseExpiredUnconfirmedAppointments()
    const current = await getAppointmentById(id)
    if (!current) {
      return NextResponse.json({ error: 'Agendamento nao encontrado' }, { status: 404 })
    }

    const isOwnerById = Boolean(current.userId && current.userId === session.user.id)
    const isOwnerByEmail = Boolean(
      session.user.email &&
        current.customerEmail &&
        current.customerEmail.toLowerCase() === session.user.email.toLowerCase()
    )
    const isAdmin = session.user.role === 'admin'

    if (!isOwnerById && !isOwnerByEmail && !isAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    if (!['pending', 'scheduled', 'confirmed'].includes(current.status)) {
      return NextResponse.json(
        {
          error: 'Somente agendamentos ativos podem ser alterados.',
          appointment: withPresentation(current),
        },
        { status: 409 }
      )
    }

    if (action === 'confirm') {
      const depositRequired = !isEvaluationAppointment(current)
      const normalizedPaymentStatus = String(current.paymentStatus || '').toLowerCase()
      const paymentApproved =
        ['not_required', 'included_in_parent'].includes(normalizedPaymentStatus) ||
        String(current.paymentStatus || '').toUpperCase() === 'APPROVED'
      if (depositRequired && !paymentApproved) {
        return NextResponse.json(
          {
            error:
              'Para confirmar o agendamento, realize primeiro o pagamento pelo Mercado Pago.',
            appointment: withPresentation(current),
          },
          { status: 409 }
        )
      }

      if (current.clientConfirmedAt) {
        return NextResponse.json({
          ok: true,
          appointment: withPresentation(current),
          message: 'Agendamento ja estava confirmado.',
        })
      }

      const deadlineAt = getAppointmentConfirmationDeadline(current.scheduledAt)
      const deadlineMs = deadlineAt ? new Date(deadlineAt).getTime() : 0
      if (!deadlineMs || Date.now() > deadlineMs) {
        const cancelled = await updateAppointmentStatus(
          current.id,
          'cancelled',
          `Cancelado automaticamente por falta de confirmacao no prazo (${getAppointmentConfirmationPolicy().hoursBefore}h antes do horario).`
        )

        if (cancelled) {
          await dispatchAppointmentNotification({
            appointment: cancelled,
            type: 'cancellation',
          }).catch((error) => {
            console.error('Erro ao notificar cancelamento automatico:', error)
          })
        }

        return NextResponse.json(
          {
            error:
              'O prazo de confirmacao expirou e o horario foi liberado para novo agendamento.',
            appointment: withPresentation(cancelled),
          },
          { status: 409 }
        )
      }

      const confirmed = await confirmAppointmentByCustomer(id)
      if (!confirmed) {
        return NextResponse.json(
          { error: 'Nao foi possivel confirmar o agendamento.' },
          { status: 500 }
        )
      }

      await dispatchAppointmentNotification({
        appointment: confirmed,
        type: 'confirmation',
      }).catch((error) => {
        console.error('Erro ao notificar confirmacao da cliente:', error)
      })

      return NextResponse.json({
        ok: true,
        appointment: withPresentation(confirmed),
        message: 'Agendamento confirmado com sucesso.',
      })
    }

    const note =
      body.notes?.trim() ||
      'Cancelado pela cliente via painel para liberar o horario.'
    const cancelled = await updateAppointmentStatus(id, 'cancelled', note)

    if (!cancelled) {
      return NextResponse.json(
        { error: 'Nao foi possivel cancelar o agendamento.' },
        { status: 500 }
      )
    }

    await dispatchAppointmentNotification({
      appointment: cancelled,
      type: 'cancellation',
    }).catch((error) => {
      console.error('Erro ao notificar cancelamento pela cliente:', error)
    })

    return NextResponse.json({
      ok: true,
      appointment: withPresentation(cancelled),
      message: 'Agendamento cancelado com sucesso. Horario liberado.',
    })
  } catch (error) {
    console.error('Erro ao atualizar agendamento da cliente:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar agendamento' },
      { status: 500 }
    )
  }
}
