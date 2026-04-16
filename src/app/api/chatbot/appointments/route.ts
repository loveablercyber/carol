import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import {
  createAppointment,
  hasAppointmentConflict,
  listDaySlots,
} from '@/lib/appointments-store'
import { dispatchAppointmentNotification } from '@/lib/appointment-notifications'
import { buildGoogleCalendarUrl } from '@/lib/appointment-calendar'
import { getAdminOperationalConfig } from '@/lib/admin-config-store'
import {
  buildAvailableSlots,
  normalizeDurationMinutes,
  validateScheduleWindow,
} from '@/lib/scheduling-availability'

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function isEvaluationAppointment(input: {
  serviceName?: string | null
  questionnaireData?: unknown
}) {
  const serviceName = normalizeText(String(input.serviceName || ''))
  const questionnaireData =
    input.questionnaireData && typeof input.questionnaireData === 'object'
      ? (input.questionnaireData as Record<string, unknown>)
      : {}
  const primaryFlow = normalizeText(String(questionnaireData.primaryFlow || ''))
  const primaryCategory = normalizeText(String(questionnaireData.primaryCategory || ''))

  return (
    primaryFlow === 'evaluation' ||
    serviceName.includes('avaliacao') ||
    primaryCategory.includes('avaliacao')
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Conta obrigatoria: faca login ou crie sua conta para concluir o agendamento.',
        },
        { status: 401 }
      )
    }

    const {
      customer,
      service,
      scheduledDate,
      durationMinutes,
      totalPrice,
      grams,
      length,
      paymentMethod,
      questionnaireData,
    } = body

    const hasTotalPrice =
      totalPrice !== undefined &&
      totalPrice !== null &&
      String(totalPrice).trim() !== ''
    const numericTotalPrice = Number(totalPrice)

    if (!customer || !service || !scheduledDate || !hasTotalPrice || !Number.isFinite(numericTotalPrice)) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatorios ausentes para criar o agendamento.' },
        { status: 400 }
      )
    }

    const config = await getAdminOperationalConfig()
    const safeDuration = normalizeDurationMinutes(
      durationMinutes,
      config.schedulingSettings.defaultDurationMinutes
    )
    const scheduledAt = new Date(scheduledDate)
    const scheduleWindow = validateScheduleWindow({
      start: scheduledAt,
      durationMinutes: safeDuration,
      settings: config.schedulingSettings,
    })

    if (!scheduleWindow.available) {
      return NextResponse.json(
        {
          success: false,
          error: scheduleWindow.reason || 'Horario indisponivel para agendamento',
        },
        { status: 409 }
      )
    }

    const hasConflict = await hasAppointmentConflict({
      scheduledAt: scheduledAt.toISOString(),
      durationMinutes: safeDuration,
    })

    if (hasConflict) {
      return NextResponse.json(
        {
          success: false,
          error: 'Este horario ja esta ocupado para a duracao do servico escolhido.',
        },
        { status: 409 }
      )
    }

    const serviceName = String(service.name || service.title || service.serviceName || service || '').trim()
    const depositRequired = !isEvaluationAppointment({
      serviceName,
      questionnaireData,
    })

    const appointment = await createAppointment({
      userId: session.user.id,
      customerName: String(customer.name || '').trim(),
      customerEmail: String(customer.email || '').trim(),
      customerPhone: String(customer.phone || '').trim(),
      serviceName,
      scheduledAt: scheduledAt.toISOString(),
      durationMinutes: safeDuration,
      grams: grams ? String(grams) : null,
      lengthLabel: length ? String(length) : null,
      totalPrice: numericTotalPrice,
      paymentMethod: depositRequired && paymentMethod ? String(paymentMethod) : null,
      paymentStatus: depositRequired ? 'pending' : 'not_required',
      questionnaireData:
        questionnaireData && typeof questionnaireData === 'object'
          ? questionnaireData
          : null,
      notes: null,
    })

    const googleCalendarUrl = appointment
      ? buildGoogleCalendarUrl({
          serviceName: appointment.serviceName,
          customerName: appointment.customerName,
          scheduledAt: appointment.scheduledAt,
          durationMinutes: appointment.durationMinutes,
          notes: appointment.notes,
        })
      : null

    if (appointment) {
      await dispatchAppointmentNotification({
        appointment,
        type: 'confirmation',
      }).catch((error) => {
        console.error('Erro ao disparar notificacao de confirmacao:', error)
      })
    }

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment?.id,
        customer: {
          id: session?.user?.id || null,
          name: appointment?.customerName,
          email: appointment?.customerEmail,
          phone: appointment?.customerPhone,
        },
        service: appointment?.serviceName,
        scheduledDate: appointment?.scheduledAt,
        durationMinutes: appointment?.durationMinutes,
        grams: appointment?.grams,
        length: appointment?.lengthLabel,
        totalPrice: appointment?.totalPrice,
        paymentMethod: appointment?.paymentMethod,
        paymentStatus: appointment?.paymentStatus,
        status: appointment?.status,
        confirmationSentAt: appointment?.confirmationSentAt || null,
        questionnaireData: appointment?.questionnaireData || null,
        createdAt: appointment?.createdAt,
        googleCalendarUrl,
      },
      googleCalendarUrl,
      message: 'Agendamento realizado com sucesso!'
    })
  } catch (error) {
    console.error('Appointment creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar agendamento' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const durationMinutes = searchParams.get('durationMinutes')

  if (!date) {
    return NextResponse.json(
      { success: false, error: 'Date parameter required' },
      { status: 400 }
    )
  }

  const selectedDate = new Date(date)
  const config = await getAdminOperationalConfig()
  const scheduled = await listDaySlots(selectedDate.toISOString())
  const availableSlots = buildAvailableSlots({
    date: selectedDate,
    durationMinutes: normalizeDurationMinutes(
      durationMinutes,
      config.schedulingSettings.defaultDurationMinutes
    ),
    settings: config.schedulingSettings,
    appointments: scheduled,
  })
  
  return NextResponse.json({
    success: true,
    date: date,
    availableSlots
  })
}
