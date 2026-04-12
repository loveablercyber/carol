import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { createSavedCard, listSavedCards } from '@/lib/saved-cards-store'

async function ensureAuthenticated() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return null
  }
  return session
}

export async function GET() {
  try {
    const session = await ensureAuthenticated()
    if (!session) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const cards = await listSavedCards(session.user.id)
    return NextResponse.json({ cards })
  } catch (error) {
    console.error('Erro ao listar cartoes salvos:', error)
    return NextResponse.json(
      { error: 'Erro ao listar cartoes salvos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await ensureAuthenticated()
    if (!session) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const holderName = String(body.holderName || '').trim()
    const brand = String(body.brand || '').trim()
    const last4 = String(body.last4 || '').replace(/\D/g, '').slice(-4)
    const expiryMonth = Number(body.expiryMonth || 0)
    const expiryYear = Number(body.expiryYear || 0)

    if (!holderName || !brand || last4.length !== 4 || expiryMonth < 1 || expiryMonth > 12 || expiryYear < new Date().getFullYear()) {
      return NextResponse.json(
        { error: 'Dados do cartao invalidos' },
        { status: 400 }
      )
    }

    const card = await createSavedCard({
      userId: session.user.id,
      label: String(body.label || 'Cartao'),
      holderName,
      brand,
      last4,
      expiryMonth,
      expiryYear,
      documentNumber:
        typeof body.documentNumber === 'string' ? body.documentNumber : null,
      isDefault: Boolean(body.isDefault),
    })

    return NextResponse.json({ card }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar cartao salvo:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar cartao' },
      { status: 500 }
    )
  }
}
