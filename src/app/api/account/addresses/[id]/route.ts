import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { authOptions } from '@/lib/auth-options'

// PUT /api/account/addresses/[id] - Atualizar endereco
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const existing = await db.address.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Endereco nao encontrado' }, { status: 404 })
    }

    if (body.isDefault) {
      await db.address.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      })
    }

    const address = await db.address.update({
      where: { id },
      data: {
        ...(body.recipient && { recipient: body.recipient }),
        ...(body.zipCode && { zipCode: body.zipCode }),
        ...(body.street && { street: body.street }),
        ...(body.number && { number: body.number }),
        ...(body.complement !== undefined && { complement: body.complement }),
        ...(body.neighborhood && { neighborhood: body.neighborhood }),
        ...(body.city && { city: body.city }),
        ...(body.state && { state: body.state }),
        ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
      },
    })

    return NextResponse.json({ address })
  } catch (error) {
    console.error('Erro ao atualizar endereco:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar endereco' },
      { status: 500 }
    )
  }
}

// DELETE /api/account/addresses/[id] - Deletar endereco
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id } = await params
    const existing = await db.address.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Endereco nao encontrado' }, { status: 404 })
    }

    await db.address.delete({ where: { id } })

    return NextResponse.json({ message: 'Endereco removido' })
  } catch (error) {
    console.error('Erro ao deletar endereco:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar endereco' },
      { status: 500 }
    )
  }
}
