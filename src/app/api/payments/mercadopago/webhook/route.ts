import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const MERCADO_PAGO_API = 'https://api.mercadopago.com/v1/payments'

export async function POST(request: NextRequest) {
  try {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!token) {
      return NextResponse.json(
        { error: 'Mercado Pago nao configurado' },
        { status: 501 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { searchParams } = new URL(request.url)
    const paymentId =
      body?.data?.id ||
      body?.id ||
      searchParams.get('id') ||
      searchParams.get('data.id')

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID ausente' }, { status: 400 })
    }

    const response = await fetch(`${MERCADO_PAGO_API}/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const data = await response.json()
    if (!response.ok) {
      return NextResponse.json(
        { error: data?.message || 'Falha ao consultar pagamento' },
        { status: response.status }
      )
    }

    const status = data.status
    const externalReference =
      (data?.external_reference ||
        data?.metadata?.external_reference ||
        data?.metadata?.orderNumber ||
        data?.metadata?.order_number ||
        '') as string
    const paymentStatusMap: Record<string, string> = {
      approved: 'APPROVED',
      pending: 'PENDING',
      rejected: 'REJECTED',
      refunded: 'REFUNDED',
    }

    const orderStatusMap: Record<string, string> = {
      approved: 'PAID',
      pending: 'PENDING',
      rejected: 'CANCELLED',
      refunded: 'REFUNDED',
    }

    const where: any = {
      OR: [{ paymentId: String(paymentId) }],
    }
    if (externalReference && String(externalReference).trim()) {
      where.OR.push({ orderNumber: String(externalReference).trim() })
    }

    await db.order.updateMany({
      where,
      data: {
        paymentId: String(paymentId),
        paymentStatus: paymentStatusMap[status] || 'PENDING',
        status: orderStatusMap[status] || 'PENDING',
      },
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro ao processar webhook Mercado Pago:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}
