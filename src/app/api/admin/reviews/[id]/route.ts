import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { db } from '@/lib/db'

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

    const review = await db.review.update({
      where: { id },
      data: {
        ...(body.rating !== undefined ? { rating: Number(body.rating) } : {}),
        ...(body.title !== undefined ? { title: String(body.title || '') || null } : {}),
        ...(body.comment !== undefined ? { comment: String(body.comment || '') } : {}),
        ...(body.author !== undefined ? { author: String(body.author || '') || null } : {}),
        ...(body.verified !== undefined ? { verified: Boolean(body.verified) } : {}),
        ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
      },
      include: {
        product: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    return NextResponse.json({ review })
  } catch (error) {
    console.error('Erro ao atualizar comentario:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar comentario' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await ensureAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = await params
    await db.review.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao remover comentario:', error)
    return NextResponse.json(
      { error: 'Erro ao remover comentario' },
      { status: 500 }
    )
  }
}

