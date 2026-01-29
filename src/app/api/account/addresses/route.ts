import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { authOptions } from '@/lib/auth-options'

// GET /api/account/addresses - Listar enderecos do usuario
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const addresses = await db.address.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ addresses })
  } catch (error) {
    console.error('Erro ao buscar enderecos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar enderecos' },
      { status: 500 }
    )
  }
}

// POST /api/account/addresses - Criar endereco
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      recipient,
      phone,
      zipCode,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      isDefault,
    } = body

    if (!recipient || !zipCode || !street || !number || !neighborhood || !city || !state) {
      return NextResponse.json(
        { error: 'Campos obrigatorios nao informados' },
        { status: 400 }
      )
    }

    if (isDefault) {
      await db.address.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      })
    }

    const address = await db.address.create({
      data: {
        userId: session.user.id,
        recipient,
        phone: phone || null,
        zipCode,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        isDefault: Boolean(isDefault),
      },
    })

    return NextResponse.json({ address }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar endereco:', error)
    return NextResponse.json(
      { error: 'Erro ao criar endereco' },
      { status: 500 }
    )
  }
}
