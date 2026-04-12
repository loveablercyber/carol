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

export async function GET(request: NextRequest) {
  try {
    const session = await ensureAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'all'
    const search = (searchParams.get('search') || '').trim()
    const productId = (searchParams.get('productId') || '').trim()

    const where: any = {}
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false
    if (productId) where.productId = productId

    if (search) {
      where.OR = [
        { author: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { comment: { contains: search, mode: 'insensitive' } },
        {
          product: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      ]
    }

    const reviews = await db.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        product: {
          select: { id: true, name: true, slug: true },
        },
      },
      take: 300,
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Erro ao listar comentarios (admin):', error)
    return NextResponse.json(
      { error: 'Erro ao listar comentarios' },
      { status: 500 }
    )
  }
}

