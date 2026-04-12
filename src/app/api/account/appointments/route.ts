import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { listAppointments } from '@/lib/appointments-store'

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

    const appointments = Array.from(mergedMap.values()).sort((a, b) =>
      b.scheduledAt.localeCompare(a.scheduledAt)
    )

    return NextResponse.json({
      appointments,
      summary: {
        total: appointments.length,
        upcoming: appointments.filter(
          (item) =>
            item.status === 'scheduled' &&
            new Date(item.scheduledAt).getTime() >= Date.now()
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

