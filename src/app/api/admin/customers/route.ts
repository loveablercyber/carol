import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth-options'
import { db } from '@/lib/db'

const ensureAdmin = async () => {
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

    const search = request.nextUrl.searchParams.get('search')?.trim()

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { cpf: { contains: search } },
          ],
        }
      : {}

    const customers = await db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        cpf: true,
        birthday: true,
        createdAt: true,
        _count: {
          select: { orders: true, addresses: true },
        },
      },
    })

    return NextResponse.json({
      customers: customers.map((customer) => ({
        ...customer,
        ordersCount: customer._count.orders,
        addressesCount: customer._count.addresses,
      })),
    })
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar clientes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await ensureAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '').trim()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const customer = await db.user.create({
      data: {
        name: body.name || null,
        email,
        password: hashedPassword,
        role: body.role === 'admin' ? 'admin' : 'customer',
        cpf: body.cpf || null,
        birthday: body.birthday ? new Date(body.birthday) : null,
      },
    })

    return NextResponse.json(
      {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        role: customer.role,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar cliente:', error)
    return NextResponse.json(
      { error: 'Erro ao criar cliente' },
      { status: 500 }
    )
  }
}
