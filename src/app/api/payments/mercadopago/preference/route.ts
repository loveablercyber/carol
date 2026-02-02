import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const MERCADO_PAGO_PREFERENCES_URL = 'https://api.mercadopago.com/checkout/preferences'
const DEFAULT_TEST_PAYER_EMAIL = 'test_user_123@testuser.com'

export async function POST(request: NextRequest) {
  try {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!token) {
      return NextResponse.json(
        { error: 'Mercado Pago nao configurado' },
        { status: 501 }
      )
    }

    const body = await request.json().catch(() => ({} as any))
    const { orderId, payerEmail } = body as { orderId?: string; payerEmail?: string }

    if (!orderId) {
      return NextResponse.json({ error: 'orderId obrigatorio' }, { status: 400 })
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })
    if (!order) {
      return NextResponse.json({ error: 'Pedido nao encontrado' }, { status: 404 })
    }

    const isTestToken = token.startsWith('TEST-')
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXTAUTH_URL ||
      request.nextUrl.origin

    let resolvedPayerEmail = (payerEmail || order.customerEmail || '').trim().toLowerCase()
    if (isTestToken && !resolvedPayerEmail.endsWith('@testuser.com')) {
      resolvedPayerEmail = DEFAULT_TEST_PAYER_EMAIL
    }

    // Keep the preference simple and always match the store order total.
    // The order items are kept in our DB; Mercado Pago will show a single line item.
    const preference = {
      items: [
        {
          title: `Pedido ${order.orderNumber}`,
          quantity: 1,
          unit_price: Number(order.total),
          currency_id: 'BRL',
        },
      ],
      external_reference: order.orderNumber,
      notification_url: `${baseUrl}/api/payments/mercadopago/webhook`,
      back_urls: {
        success: `${baseUrl}/checkout/return`,
        failure: `${baseUrl}/checkout/return`,
        pending: `${baseUrl}/checkout/return`,
      },
      auto_return: 'approved',
      ...(resolvedPayerEmail ? { payer: { email: resolvedPayerEmail } } : {}),
    }

    const idempotencyKey = crypto.randomUUID()
    const response = await fetch(MERCADO_PAGO_PREFERENCES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(preference),
    })

    const mpRequestId =
      response.headers.get('x-request-id') ||
      response.headers.get('x-correlation-id') ||
      response.headers.get('x-trace-id') ||
      undefined

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      return NextResponse.json(
        {
          error: data?.message || data?.error || 'Erro ao criar preferencia',
          details: {
            status: data?.status,
            cause: data?.cause,
            mp_request_id: mpRequestId,
            idempotency_key: idempotencyKey,
          },
        },
        { status: response.status }
      )
    }

    const redirectUrl =
      (isTestToken ? data?.sandbox_init_point : data?.init_point) ||
      data?.init_point ||
      data?.sandbox_init_point

    if (!redirectUrl) {
      return NextResponse.json(
        { error: 'Preferencia criada, mas URL de checkout ausente.' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      preferenceId: data.id,
      initPoint: data.init_point,
      sandboxInitPoint: data.sandbox_init_point,
      redirectUrl,
    })
  } catch (error) {
    console.error('Erro ao criar preferencia Mercado Pago:', error)
    return NextResponse.json(
      { error: 'Erro ao criar preferencia' },
      { status: 500 }
    )
  }
}

