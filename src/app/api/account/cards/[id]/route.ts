import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { deleteSavedCard, updateSavedCard } from '@/lib/saved-cards-store'

async function ensureAuthenticated() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return null
  }
  return session
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await ensureAuthenticated()
    if (!session) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    if (
      body.last4 !== undefined &&
      String(body.last4).replace(/\D/g, '').slice(-4).length !== 4
    ) {
      return NextResponse.json({ error: 'Ultimos 4 digitos invalidos' }, { status: 400 })
    }
    if (
      body.expiryMonth !== undefined &&
      (Number(body.expiryMonth) < 1 || Number(body.expiryMonth) > 12)
    ) {
      return NextResponse.json({ error: 'Mes de validade invalido' }, { status: 400 })
    }

    const card = await updateSavedCard(session.user.id, id, {
      label: body.label,
      holderName: body.holderName,
      brand: body.brand,
      last4: body.last4,
      expiryMonth: body.expiryMonth,
      expiryYear: body.expiryYear,
      documentNumber: body.documentNumber,
      isDefault: body.isDefault,
    })

    if (!card) {
      return NextResponse.json(
        { error: 'Cartao nao encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ card })
  } catch (error) {
    console.error('Erro ao atualizar cartao salvo:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar cartao' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await ensureAuthenticated()
    if (!session) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const { id } = await params
    const removed = await deleteSavedCard(session.user.id, id)
    if (!removed) {
      return NextResponse.json(
        { error: 'Cartao nao encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao remover cartao salvo:', error)
    return NextResponse.json(
      { error: 'Erro ao remover cartao' },
      { status: 500 }
    )
  }
}
