import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { listAppointmentsForReminder } from '@/lib/appointments-store'
import { dispatchAppointmentNotification } from '@/lib/appointment-notifications'

function isAuthorizedByCronSecret(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return request.headers.get('x-vercel-cron') === '1'
  }
  const auth = request.headers.get('authorization') || ''
  return auth === `Bearer ${cronSecret}`
}

async function ensureAuthorized(request: NextRequest) {
  if (isAuthorizedByCronSecret(request)) {
    return true
  }

  const session = await getServerSession(authOptions)
  return Boolean(session?.user?.role === 'admin')
}

async function runReminderDispatch(request: NextRequest) {
  const authorized = await ensureAuthorized(request)
  if (!authorized) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const hoursAhead = Math.min(
    72,
    Math.max(1, Number(searchParams.get('hours') || 24))
  )
  const leadMinutes = Math.min(
    180,
    Math.max(0, Number(searchParams.get('leadMinutes') || 30))
  )

  const from = new Date(Date.now() + leadMinutes * 60 * 1000)
  const to = new Date(Date.now() + hoursAhead * 60 * 60 * 1000)

  const appointments = await listAppointmentsForReminder({
    fromIso: from.toISOString(),
    toIso: to.toISOString(),
  })

  const results = await Promise.allSettled(
    appointments.map((appointment) =>
      dispatchAppointmentNotification({
        appointment,
        type: 'reminder',
      })
    )
  )

  const sent = results.filter(
    (item) => item.status === 'fulfilled' && item.value.sent
  ).length
  const failed = results.length - sent

  return NextResponse.json({
    ok: true,
    scanned: appointments.length,
    sent,
    failed,
    window: {
      from: from.toISOString(),
      to: to.toISOString(),
      hoursAhead,
      leadMinutes,
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    return await runReminderDispatch(request)
  } catch (error) {
    console.error('Erro ao processar lembretes de agendamento:', error)
    return NextResponse.json(
      { error: 'Erro ao processar lembretes de agendamento' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    return await runReminderDispatch(request)
  } catch (error) {
    console.error('Erro ao processar lembretes de agendamento:', error)
    return NextResponse.json(
      { error: 'Erro ao processar lembretes de agendamento' },
      { status: 500 }
    )
  }
}
