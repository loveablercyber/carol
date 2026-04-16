import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import {
  getAppointmentConfirmationDeadline,
  getAppointmentConfirmationPolicy,
  listAppointments,
} from '@/lib/appointments-store'
import { buildGoogleCalendarUrl } from '@/lib/appointment-calendar'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const byUser = await listAppointments({
      userId: session.user.id,
      status: 'all',
    })

    const byEmail =
      session.user.email
        ? await listAppointments({
            customerEmail: session.user.email,
            status: 'all',
          })
        : []

    const mergedMap = new Map<string, (typeof byUser)[number]>()
    for (const item of [...byUser, ...byEmail]) {
      mergedMap.set(item.id, item)
    }

    const now = Date.now()
    const policy = getAppointmentConfirmationPolicy()
    const appointments = Array.from(mergedMap.values())
      .map((item) => {
        const confirmationDeadlineAt = getAppointmentConfirmationDeadline(
          item.scheduledAt,
          policy.hoursBefore
        )
        const scheduledMs = new Date(item.scheduledAt).getTime()
        const deadlineMs = confirmationDeadlineAt
          ? new Date(confirmationDeadlineAt).getTime()
          : 0
        const canConfirmFromClient =
          ['pending', 'scheduled'].includes(item.status) &&
          !item.clientConfirmedAt &&
          Boolean(deadlineMs) &&
          now <= deadlineMs
        const canCancelFromClient =
          ['pending', 'scheduled', 'confirmed'].includes(item.status) &&
          scheduledMs > now

        return {
          ...item,
          confirmationDeadlineAt,
          canConfirmFromClient,
          canCancelFromClient,
          confirmationWindowHours: policy.hoursBefore,
          googleCalendarUrl: buildGoogleCalendarUrl({
            serviceName: item.serviceName,
            customerName: item.customerName,
            scheduledAt: item.scheduledAt,
            durationMinutes: item.durationMinutes,
            notes: item.notes,
          }),
        }
      })
      .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))

    return NextResponse.json({
      appointments,
      summary: {
        total: appointments.length,
        upcoming: appointments.filter(
          (item) =>
            ['pending', 'scheduled', 'confirmed'].includes(item.status) &&
            new Date(item.scheduledAt).getTime() >= Date.now()
        ).length,
        confirmed: appointments.filter(
          (item) => item.status === 'confirmed' || Boolean(item.clientConfirmedAt)
        ).length,
        pendingConfirmation: appointments.filter(
          (item) =>
            ['pending', 'scheduled'].includes(item.status) &&
            !item.clientConfirmedAt
        ).length,
        completed: appointments.filter((item) => item.status === 'completed').length,
      },
    })
  } catch (error) {
    console.error('Erro ao buscar historico de agendamentos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar historico de agendamentos' },
      { status: 500 }
    )
  }
}
