import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const MERCADO_PAGO_URL = 'https://api.mercadopago.com/v1/payments'

export async function POST(request: NextRequest) {
  try {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!token) {
      return NextResponse.json(
        { error: 'Mercado Pago nao configurado' },
        { status: 501 }
      )
    }

    const body = await request.json()
    const { orderId, amount, description, payerEmail } = body

    if (!orderId || !amount || !payerEmail) {
      return NextResponse.json(
        { error: 'Dados obrigatorios nao informados' },
        { status: 400 }
      )
    }

    const order = await db.order.findUnique({ where: { id: orderId } })
    if (!order) {
      return NextResponse.json({ error: 'Pedido nao encontrado' }, { status: 404 })
    }

    if (order.customerEmail !== payerEmail) {
      return NextResponse.json({ error: 'Email nao autorizado' }, { status: 403 })
    }

    const finalAmount = Number(order.total)

    const idempotencyKey = orderId ? `order-${orderId}` : crypto.randomUUID()
    const response = await fetch(MERCADO_PAGO_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        transaction_amount: finalAmount,
        description: description || `Pedido ${order.orderNumber}`,
        payment_method_id: 'pix',
        payer: {
          email: payerEmail,
        },
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      return NextResponse.json(
        { error: data?.message || 'Erro ao gerar pagamento' },
        { status: response.status }
      )
    }

    const paymentId = String(data.id)
    await db.order.update({
      where: { id: orderId },
      data: {
        paymentId,
        paymentStatus: data.status === 'approved' ? 'APPROVED' : 'PENDING',
      },
    })

    return NextResponse.json({
      paymentId,
      status: data.status,
      qrCode: data.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64,
    })
  } catch (error) {
    console.error('Erro ao gerar pagamento Mercado Pago:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar pagamento' },
      { status: 500 }
    )
  }
}
