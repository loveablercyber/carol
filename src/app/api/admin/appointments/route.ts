import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { deleteAppointments, listAppointments } from '@/lib/appointments-store'
import { releaseDonationHairByAppointment } from '@/lib/donation-campaign-store'

async function ensureAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'admin') {
    return null
  }
  return session
}

export async function GET(request: NextRequest) {
  try {
    const session = await ensureAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'all'
    const from = searchParams.get('from') || undefined
    const to = searchParams.get('to') || undefined
    const q = String(searchParams.get('q') || '').trim().toLowerCase()
    const client = String(searchParams.get('client') || '').trim().toLowerCase()
    const phone = String(searchParams.get('phone') || '').trim().toLowerCase()
    const service = String(searchParams.get('service') || '').trim().toLowerCase()
    const date = String(searchParams.get('date') || '').trim()

    let appointments = await listAppointments({
      status: status as any,
      from,
      to,
    })

    if (date) {
      appointments = appointments.filter((item) => item.scheduledAt.slice(0, 10) === date)
    }

    if (client) {
      appointments = appointments.filter((item) =>
        item.customerName.toLowerCase().includes(client)
      )
    }

    if (phone) {
      appointments = appointments.filter((item) =>
        item.customerPhone.toLowerCase().includes(phone)
      )
    }

    if (service) {
      appointments = appointments.filter((item) =>
        item.serviceName.toLowerCase().includes(service)
      )
    }

    if (q) {
      appointments = appointments.filter((item) =>
        [
          item.customerName,
          item.customerEmail,
          item.customerPhone,
          item.serviceName,
          item.status,
        ]
          .join(' ')
          .toLowerCase()
          .includes(q)
      )
    }

    const summary = {
      total: appointments.length,
      pending: appointments.filter((item) => item.status === 'pending' || item.status === 'scheduled').length,
      confirmed: appointments.filter((item) => item.status === 'confirmed').length,
      scheduled: appointments.filter((item) => item.status === 'scheduled').length,
      completed: appointments.filter((item) => item.status === 'completed').length,
      cancelled: appointments.filter((item) => item.status === 'cancelled').length,
    }

    return NextResponse.json({ appointments, summary })
  } catch (error) {
    console.error('Erro ao buscar agendamentos (admin):', error)
    return NextResponse.json(
      { error: 'Erro ao buscar agendamentos' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await ensureAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const ids = Array.isArray(body?.ids)
      ? body.ids.map((id: unknown) => String(id || '').trim()).filter(Boolean)
      : []

    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum agendamento selecionado' },
        { status: 400 }
      )
    }

    const deleted = await deleteAppointments(ids)
    for (const id of ids) {
      await releaseDonationHairByAppointment(id).catch((error) => {
        console.error('Erro ao liberar cabelo da doacao apos remocao em lote:', error)
      })
    }
    return NextResponse.json({ deleted })
  } catch (error) {
    console.error('Erro ao remover agendamentos em lote:', error)
    return NextResponse.json(
      { error: 'Erro ao remover agendamentos' },
      { status: 500 }
    )
  }
}
