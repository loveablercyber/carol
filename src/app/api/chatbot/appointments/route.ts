import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import {
  createAppointment,
  hasAppointmentConflict,
  listDaySlots,
  updateAppointmentStatus,
} from '@/lib/appointments-store'
import { dispatchAppointmentNotification } from '@/lib/appointment-notifications'
import { buildGoogleCalendarUrl } from '@/lib/appointment-calendar'
import { getAdminOperationalConfig } from '@/lib/admin-config-store'
import {
  buildDonationAvailableSlots,
  markDonationHairAwaitingPayment,
  validateDonationBooking,
} from '@/lib/donation-campaign-store'
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

function rangesOverlap(startA: Date, durationA: number, startB: Date, durationB: number) {
  const aStart = startA.getTime()
  const aEnd = aStart + durationA * 60 * 1000
  const bStart = startB.getTime()
  const bEnd = bStart + durationB * 60 * 1000
  return aStart < bEnd && aEnd > bStart
}

function dateOnly(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

function daysBetweenCalendarDates(previous: Date, next: Date) {
  const dayMs = 24 * 60 * 60 * 1000
  return Math.round((dateOnly(next).getTime() - dateOnly(previous).getTime()) / dayMs)
}

function validateCronogramaSpacing(input: {
  mainStart: Date
  related: Array<{
    type: string
    serviceName: string
    scheduledAt: Date
  }>
}) {
  const cronogramaItems = input.related.filter((item) => item.type === 'cronograma')
  let previous = input.mainStart

  for (const item of cronogramaItems) {
    const days = daysBetweenCalendarDates(previous, item.scheduledAt)
    if (days < 10 || days > 30) {
      return {
        ok: false,
        error: `${item.serviceName}: o cronograma precisa respeitar intervalo de 10 a 30 dias após o procedimento anterior.`,
      }
    }
    previous = item.scheduledAt
  }

  return { ok: true, error: '' }
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
      relatedAppointments,
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
    const questionnaire =
      questionnaireData && typeof questionnaireData === 'object'
        ? (questionnaireData as Record<string, unknown>)
        : {}
    const isDonationAppointment = questionnaire.campaignSource === 'hair-donation'
    const donationHairOptionId = String(questionnaire.donationHairOptionId || '').trim()

    if (Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Data de agendamento invalida.' },
        { status: 400 }
      )
    }

    if (isDonationAppointment) {
      if (!donationHairOptionId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Escolha uma opcao de cabelo da doacao antes de agendar.',
          },
          { status: 400 }
        )
      }

      const donationValidation = await validateDonationBooking({
        hairOptionId: donationHairOptionId,
        scheduledAt,
        durationMinutes: safeDuration,
      })

      if (!donationValidation.ok) {
        return NextResponse.json(
          {
            success: false,
            error: donationValidation.error || 'Campanha de doacao indisponivel.',
          },
          { status: 409 }
        )
      }
    } else {
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

    const relatedInput = Array.isArray(relatedAppointments)
      ? relatedAppointments
          .map((item: any) => {
            const relatedDate = new Date(item?.scheduledAt || item?.scheduledDate || '')
            const relatedDuration = normalizeDurationMinutes(
              item?.durationMinutes,
              config.schedulingSettings.defaultDurationMinutes
            )
            return {
              type: String(item?.type || 'related'),
              serviceName: String(item?.serviceName || item?.name || 'Agendamento vinculado').trim(),
              scheduledAt: relatedDate,
              durationMinutes: relatedDuration,
              totalPrice: Number(item?.totalPrice || 0),
              notes: String(item?.notes || '').trim(),
            }
          })
          .filter((item) => item.serviceName && !Number.isNaN(item.scheduledAt.getTime()))
      : []

    for (const related of relatedInput) {
      const relatedWindow = validateScheduleWindow({
        start: related.scheduledAt,
        durationMinutes: related.durationMinutes,
        settings: config.schedulingSettings,
      })
      if (!relatedWindow.available) {
        return NextResponse.json(
          {
            success: false,
            error: `${related.serviceName}: ${relatedWindow.reason || 'Horario indisponivel'}`,
          },
          { status: 409 }
        )
      }

      const relatedConflict = await hasAppointmentConflict({
        scheduledAt: related.scheduledAt.toISOString(),
        durationMinutes: related.durationMinutes,
      })
      if (relatedConflict) {
        return NextResponse.json(
          {
            success: false,
            error: `${related.serviceName}: horario ja ocupado para a duracao do procedimento.`,
          },
          { status: 409 }
        )
      }

      if (rangesOverlap(scheduledAt, safeDuration, related.scheduledAt, related.durationMinutes)) {
        return NextResponse.json(
          {
            success: false,
            error: `${related.serviceName}: horario conflita com o atendimento principal.`,
          },
          { status: 409 }
        )
      }
    }

    for (let i = 0; i < relatedInput.length; i += 1) {
      for (let j = i + 1; j < relatedInput.length; j += 1) {
        if (
          rangesOverlap(
            relatedInput[i].scheduledAt,
            relatedInput[i].durationMinutes,
            relatedInput[j].scheduledAt,
            relatedInput[j].durationMinutes
          )
        ) {
          return NextResponse.json(
            {
              success: false,
              error: `${relatedInput[i].serviceName} conflita com ${relatedInput[j].serviceName}.`,
            },
            { status: 409 }
          )
        }
      }
    }

    const cronogramaValidation = validateCronogramaSpacing({
      mainStart: scheduledAt,
      related: relatedInput,
    })

    if (!cronogramaValidation.ok) {
      return NextResponse.json(
        {
          success: false,
          error: cronogramaValidation.error,
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

    const relatedCreated: any[] = []
    if (appointment) {
      for (const related of relatedInput) {
        const relatedAppointment = await createAppointment({
          userId: session.user.id,
          customerName: String(customer.name || '').trim(),
          customerEmail: String(customer.email || '').trim(),
          customerPhone: String(customer.phone || '').trim(),
          serviceName: related.serviceName,
          scheduledAt: related.scheduledAt.toISOString(),
          durationMinutes: related.durationMinutes,
          grams: null,
          lengthLabel: null,
          totalPrice: related.totalPrice,
          paymentMethod: null,
          paymentStatus: 'included_in_parent',
          questionnaireData: {
            ...(questionnaireData && typeof questionnaireData === 'object'
              ? questionnaireData
              : {}),
            parentAppointmentId: appointment.id,
            relatedAppointmentType: related.type,
          },
          notes: related.notes || `Agendamento vinculado ao atendimento ${appointment.id}`,
        })

        if (relatedAppointment) {
          relatedCreated.push({
            ...relatedAppointment,
            googleCalendarUrl: buildGoogleCalendarUrl({
              serviceName: relatedAppointment.serviceName,
              customerName: relatedAppointment.customerName,
              scheduledAt: relatedAppointment.scheduledAt,
              durationMinutes: relatedAppointment.durationMinutes,
              notes: relatedAppointment.notes,
            }),
          })
        }
      }
    }

    if (appointment) {
      if (isDonationAppointment) {
        const reserved = await markDonationHairAwaitingPayment({
          hairOptionId: donationHairOptionId,
          appointmentId: appointment.id,
          customerName: appointment.customerName,
          customerEmail: appointment.customerEmail,
          scheduledAt: appointment.scheduledAt,
        })

        if (!reserved) {
          await updateAppointmentStatus(
            appointment.id,
            'cancelled',
            'Cancelado automaticamente porque o cabelo selecionado deixou de estar disponivel antes do pagamento.'
          )

          return NextResponse.json(
            {
              success: false,
              error: 'Este cabelo acabou de ficar indisponivel. Escolha outra opcao.',
            },
            { status: 409 }
          )
        }
      }

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
        relatedAppointments: relatedCreated,
      },
      googleCalendarUrl,
      relatedAppointments: relatedCreated,
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
  const source = searchParams.get('source')

  if (!date) {
    return NextResponse.json(
      { success: false, error: 'Date parameter required' },
      { status: 400 }
    )
  }

  const selectedDate = new Date(date)
  const config = await getAdminOperationalConfig()
  const scheduled = await listDaySlots(selectedDate.toISOString())
  if (source === 'hair-donation') {
    const availableSlots = await buildDonationAvailableSlots({
      date: selectedDate,
      durationMinutes: normalizeDurationMinutes(durationMinutes, 120),
      appointments: scheduled,
    })

    return NextResponse.json({
      success: true,
      date,
      availableSlots,
    })
  }

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
