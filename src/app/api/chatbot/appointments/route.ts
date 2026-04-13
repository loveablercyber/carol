import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import {
  createAppointment,
  listDaySlots,
} from '@/lib/appointments-store'
import { dispatchAppointmentNotification } from '@/lib/appointment-notifications'
import { buildGoogleCalendarUrl } from '@/lib/appointment-calendar'

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

    if (!customer || !service || !scheduledDate || !totalPrice) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const appointment = await createAppointment({
      userId: session.user.id,
      customerName: String(customer.name || '').trim(),
      customerEmail: String(customer.email || '').trim(),
      customerPhone: String(customer.phone || '').trim(),
      serviceName: String(service.name || service.title || service.serviceName || service || '').trim(),
      scheduledAt: new Date(scheduledDate).toISOString(),
      durationMinutes: Number(durationMinutes || 60),
      grams: grams ? String(grams) : null,
      lengthLabel: length ? String(length) : null,
      totalPrice: Number(totalPrice || 0),
      paymentMethod: paymentMethod ? String(paymentMethod) : null,
      paymentStatus: 'pending',
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

  if (!date) {
    return NextResponse.json(
      { success: false, error: 'Date parameter required' },
      { status: 400 }
    )
  }

  const selectedDate = new Date(date)
  const now = new Date()
  const isToday = selectedDate.toDateString() === now.toDateString()

  const availableSlots: any[] = []
  const startHour = 9
  const endHour = 19
  const scheduled = await listDaySlots(selectedDate.toISOString())
  const taken = new Set(
    scheduled.map((item) => new Date(item.scheduledAt).toTimeString().slice(0, 5))
  )

  for (let hour = startHour; hour < endHour; hour++) {
    for (const minute of ['00']) {
      const slotTime = new Date(selectedDate)
      slotTime.setHours(hour, parseInt(minute), 0, 0)

      if (isToday && slotTime <= now) {
        continue
      }

      const dayOfWeek = slotTime.getDay()
      if (dayOfWeek === 0) {
        continue
      }

      const isTaken = taken.has(`${hour.toString().padStart(2, '0')}:${minute}`)

      availableSlots.push({
        time: slotTime.toISOString(),
        displayTime: `${hour.toString().padStart(2, '0')}:${minute}`,
        available: !isTaken
      })
    }
  }
  
  return NextResponse.json({
    success: true,
    date: date,
    availableSlots
  })
}
