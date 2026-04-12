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

async function safeQueryTable(tableName: string) {
  try {
    return await db.$queryRawUnsafe<any[]>(`SELECT * FROM "${tableName}"`)
  } catch {
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await ensureAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const [users, categories, products, orders, orderItems, coupons, addresses, reviews] =
      await Promise.all([
        db.user.findMany({
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            name: true,
            email: true,
            cpf: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        db.category.findMany({ orderBy: { createdAt: 'asc' } }),
        db.product.findMany({ orderBy: { createdAt: 'asc' } }),
        db.order.findMany({ orderBy: { createdAt: 'asc' } }),
        db.orderItem.findMany({ orderBy: { createdAt: 'asc' } }),
        db.coupon.findMany({ orderBy: { createdAt: 'asc' } }),
        db.address.findMany({ orderBy: { createdAt: 'asc' } }),
        db.review.findMany({ orderBy: { createdAt: 'asc' } }),
      ])

    const [homeModules, internalPages, customerAppointments, shippingConfig, shippingRules, customerSavedCards] =
      await Promise.all([
        safeQueryTable('HomeModuleConfig'),
        safeQueryTable('InternalPageConfig'),
        safeQueryTable('CustomerAppointment'),
        safeQueryTable('ShippingConfig'),
        safeQueryTable('ShippingRule'),
        safeQueryTable('CustomerSavedCard'),
      ])

    const payload = {
      meta: {
        exportedAt: new Date().toISOString(),
        exportedBy: session.user.email || session.user.id,
        version: 'backup-v1',
      },
      data: {
        users,
        categories,
        products,
        orders,
        orderItems,
        coupons,
        addresses,
        reviews,
        homeModules,
        internalPages,
        customerAppointments,
        shippingConfig,
        shippingRules,
        customerSavedCards,
      },
    }

    const shouldDownload = request.nextUrl.searchParams.get('download') === '1'
    if (!shouldDownload) {
      return NextResponse.json(payload)
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="carolsol-backup-${timestamp}.json"`,
      },
    })
  } catch (error) {
    console.error('Erro ao gerar backup:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar backup' },
      { status: 500 }
    )
  }
}

