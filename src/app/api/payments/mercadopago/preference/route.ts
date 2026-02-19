import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveMercadoPagoConfig } from '@/lib/mercadopago-config'

const MERCADO_PAGO_PREFERENCES_URL = 'https://api.mercadopago.com/checkout/preferences'
const DEFAULT_TEST_PAYER_EMAIL = 'test_user_123@testuser.com'

function emailDomain(value: string) {
  const parts = value.split('@')
  return parts.length > 1 ? parts[1] : ''
}

export async function POST(request: NextRequest) {
  try {
    const config = resolveMercadoPagoConfig({ requestOrigin: request.nextUrl.origin })
    const token = config.accessToken
    if (!token) {
      return NextResponse.json(
        { error: `Mercado Pago nao configurado para modo ${config.env}` },
        { status: 501 }
      )
    }
    if (!config.publicKey) {
      return NextResponse.json(
        { error: `Chave publica Mercado Pago ausente para modo ${config.env}` },
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

    let resolvedPayerEmail = (payerEmail || order.customerEmail || '').trim().toLowerCase()
    if (config.env === 'test' && !resolvedPayerEmail.endsWith('@testuser.com')) {
      resolvedPayerEmail = DEFAULT_TEST_PAYER_EMAIL
    }

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
      notification_url: `${config.baseUrl}/api/payments/mercadopago/webhook`,
      back_urls: {
        success: `${config.baseUrl}/pagamento/sucesso`,
        failure: `${config.baseUrl}/pagamento/erro`,
        pending: `${config.baseUrl}/pagamento/pendente`,
      },
      auto_return: 'approved',
      ...(resolvedPayerEmail ? { payer: { email: resolvedPayerEmail } } : {}),
    }

    console.info('[MP] Preference create request', {
      env: config.env,
      redirectField: config.redirectField,
      orderId: order.id,
      orderNumber: order.orderNumber,
      baseUrl: config.baseUrl,
      payerEmailDomain: resolvedPayerEmail ? emailDomain(resolvedPayerEmail) : '',
      payload: {
        external_reference: preference.external_reference,
        auto_return: preference.auto_return,
        back_urls: preference.back_urls,
        notification_url: preference.notification_url,
        itemCount: preference.items.length,
        total: preference.items[0]?.unit_price,
      },
    })

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

    const redirectUrl = data?.[config.redirectField] as string | undefined

    if (!redirectUrl) {
      return NextResponse.json(
        {
          error: `Preferencia criada, mas ${config.redirectField} nao foi retornado.`,
          details: {
            preferenceId: data?.id,
            initPointExists: Boolean(data?.init_point),
            sandboxInitPointExists: Boolean(data?.sandbox_init_point),
          },
        },
        { status: 502 }
      )
    }

    console.info('[MP] Preference create response', {
      env: config.env,
      redirectField: config.redirectField,
      preferenceId: data?.id,
      initPoint: data?.init_point,
      sandboxInitPoint: data?.sandbox_init_point,
    })

    return NextResponse.json({
      environment: config.env,
      redirectField: config.redirectField,
      preferenceId: data.id,
      initPoint: data.init_point,
      sandboxInitPoint: data.sandbox_init_point,
      redirectUrl,
    })
  } catch (error) {
    console.error('Erro ao criar preferencia Mercado Pago:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar preferencia' },
      { status: 500 }
    )
  }
}
