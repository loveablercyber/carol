import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { db } from '@/lib/db'

async function resolveProductId(idOrSlug: string) {
  const product = await db.product.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    select: { id: true },
  })
  return product?.id || null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = await resolveProductId(id)
    if (!productId) {
      return NextResponse.json({ error: 'Produto nao encontrado' }, { status: 404 })
    }

    const reviews = await db.review.findMany({
      where: { productId, isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Erro ao listar comentarios do produto:', error)
    return NextResponse.json(
      { error: 'Erro ao listar comentarios' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const { id } = await params
    const productId = await resolveProductId(id)
    if (!productId) {
      return NextResponse.json({ error: 'Produto nao encontrado' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const rating = Number(body?.rating || 0)
    const comment = String(body?.comment || '').trim()
    const title = String(body?.title || '').trim()

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Nota invalida' }, { status: 400 })
    }

    if (!comment) {
      return NextResponse.json({ error: 'Comentario obrigatorio' }, { status: 400 })
    }

    const [user, purchasedCount] = await Promise.all([
      db.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true },
      }),
      db.order.count({
        where: {
          userId: session.user.id,
          paymentStatus: 'APPROVED',
          items: {
            some: { productId },
          },
        },
      }),
    ])

    const review = await db.review.create({
      data: {
        productId,
        userId: session.user.id,
        author: user?.name || user?.email || 'Cliente',
        rating,
        title: title || null,
        comment,
        verified: purchasedCount > 0,
        isActive: true,
      },
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar comentario:', error)
    return NextResponse.json(
      { error: 'Erro ao criar comentario' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const { id } = await params
    const productId = await resolveProductId(id)
    if (!productId) {
      return NextResponse.json({ error: 'Produto nao encontrado' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const reviewId = String(body?.reviewId || '').trim()
    const rating = Number(body?.rating || 0)
    const comment = String(body?.comment || '').trim()
    const title = String(body?.title || '').trim()

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId obrigatorio' }, { status: 400 })
    }

    const existing = await db.review.findUnique({ where: { id: reviewId } })
    if (!existing || existing.productId !== productId) {
      return NextResponse.json({ error: 'Comentario nao encontrado' }, { status: 404 })
    }

    const isAdmin = session.user.role === 'admin'
    if (!isAdmin && existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const review = await db.review.update({
      where: { id: reviewId },
      data: {
        ...(rating >= 1 && rating <= 5 ? { rating } : {}),
        ...(title !== undefined ? { title: title || null } : {}),
        ...(comment ? { comment } : {}),
      },
    })

    return NextResponse.json({ review })
  } catch (error) {
    console.error('Erro ao editar comentario:', error)
    return NextResponse.json(
      { error: 'Erro ao editar comentario' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const { id } = await params
    const productId = await resolveProductId(id)
    if (!productId) {
      return NextResponse.json({ error: 'Produto nao encontrado' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const reviewId = String(body?.reviewId || '').trim()
    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId obrigatorio' }, { status: 400 })
    }

    const existing = await db.review.findUnique({ where: { id: reviewId } })
    if (!existing || existing.productId !== productId) {
      return NextResponse.json({ error: 'Comentario nao encontrado' }, { status: 404 })
    }

    const isAdmin = session.user.role === 'admin'
    if (!isAdmin && existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    await db.review.delete({ where: { id: reviewId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao remover comentario:', error)
    return NextResponse.json(
      { error: 'Erro ao remover comentario' },
      { status: 500 }
    )
  }
}

