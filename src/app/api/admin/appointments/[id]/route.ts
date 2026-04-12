import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { updateAppointmentStatus } from '@/lib/appointments-store'

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

    if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Status invalido' },
        { status: 400 }
      )
    }

    const appointment = await updateAppointmentStatus(
      id,
      status as 'scheduled' | 'completed' | 'cancelled',
      notes
    )

    if (!appointment) {
      return NextResponse.json(
        { error: 'Agendamento nao encontrado' },
        { status: 404 }
      )
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

