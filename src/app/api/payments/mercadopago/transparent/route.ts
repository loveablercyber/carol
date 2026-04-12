import { NextRequest, NextResponse } from 'next/server'
import { OrderStatus, PaymentStatus } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { db } from '@/lib/db'
import { resolveMercadoPagoConfig } from '@/lib/mercadopago-config'

const MERCADO_PAGO_PAYMENTS_URL = 'https://api.mercadopago.com/v1/payments'

type MercadoPagoEnv = 'test' | 'prod'

const paymentStatusMap: Record<string, PaymentStatus> = {
  approved: PaymentStatus.APPROVED,
  pending: PaymentStatus.PENDING,
  in_process: PaymentStatus.PENDING,
  authorized: PaymentStatus.PENDING,
  rejected: PaymentStatus.REJECTED,
  cancelled: PaymentStatus.REJECTED,
  refunded: PaymentStatus.REFUNDED,
  charged_back: PaymentStatus.REFUNDED,
}

const orderStatusMap: Record<string, OrderStatus> = {
  approved: OrderStatus.PAID,
  pending: OrderStatus.PENDING,
  in_process: OrderStatus.PENDING,
  authorized: OrderStatus.PENDING,
  rejected: OrderStatus.CANCELLED,
  cancelled: OrderStatus.CANCELLED,
  refunded: OrderStatus.REFUNDED,
  charged_back: OrderStatus.REFUNDED,
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function resolvePayerEmail(env: MercadoPagoEnv, candidateEmail: string) {
  const normalizedCandidateEmail = candidateEmail.trim().toLowerCase()

  if (env === 'prod') {
    return normalizedCandidateEmail
  }

  const configuredTestBuyerEmail = (process.env.MERCADOPAGO_TEST_BUYER_EMAIL || '')
    .trim()
    .toLowerCase()

  if (configuredTestBuyerEmail) {
    if (!configuredTestBuyerEmail.endsWith('@testuser.com')) {
      throw new Error('MERCADOPAGO_TEST_BUYER_EMAIL deve ser um e-mail de usuario teste do Mercado Pago.')
    }
    return configuredTestBuyerEmail
  }

  if (normalizedCandidateEmail.endsWith('@testuser.com')) {
    return normalizedCandidateEmail
  }

  throw new Error(
    'MERCADOPAGO_TEST_BUYER_EMAIL obrigatorio em MP_ENV=test. Use o e-mail da conta Comprador de teste do Mercado Pago.'
  )
}

function resolveIdentification(body: any) {
  return (
    body?.payer?.identification ||
    body?.identification ||
    (body?.identificationType || body?.identificationNumber
      ? {
          type: body.identificationType,
          number: body.identificationNumber,
        }
      : undefined)
  )
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const config = resolveMercadoPagoConfig({ requestOrigin: request.nextUrl.origin })
    const body = await request.json().catch(() => ({} as any))
    const orderId = asString(body?.orderId)

    if (!orderId) {
      return NextResponse.json({ error: 'orderId obrigatorio' }, { status: 400 })
    }

    const order = await db.order.findUnique({ where: { id: orderId } })
    if (!order) {
      return NextResponse.json({ error: 'Pedido nao encontrado' }, { status: 404 })
    }

    const isAdmin = session.user.role === 'admin'
    if (order.userId && order.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: 'Acesso negado ao pedido' }, { status: 403 })
    }

    if (order.paymentStatus === PaymentStatus.APPROVED) {
      return NextResponse.json({ error: 'Pedido ja esta pago.' }, { status: 409 })
    }

    const token = asString(body?.token)
    const paymentMethodId = asString(body?.payment_method_id || body?.paymentMethodId)
    const issuerId = asString(body?.issuer_id || body?.issuerId)
    const installments = asNumber(body?.installments, 1)
    const identification = resolveIdentification(body)
    const payerEmail = resolvePayerEmail(
      config.env,
      asString(body?.payer?.email || body?.payerEmail || order.customerEmail)
    )

    if (!token || !paymentMethodId || !installments || !payerEmail) {
      return NextResponse.json(
        { error: 'Dados do pagamento incompletos. Confira os dados do cartao.' },
        { status: 400 }
      )
    }

    const paymentPayload: Record<string, unknown> = {
      transaction_amount: Number(order.total),
      token,
      description: `Pedido ${order.orderNumber}`,
      installments,
      payment_method_id: paymentMethodId,
      external_reference: order.orderNumber,
      notification_url: `${config.baseUrl}/api/payments/mercadopago/webhook`,
      payer: {
        email: payerEmail,
        ...(identification
          ? {
              identification: {
                type: asString(identification.type),
                number: asString(identification.number),
              },
            }
          : {}),
      },
      metadata: {
        order_id: order.id,
        order_number: order.orderNumber,
      },
    }

    if (issuerId) {
      paymentPayload.issuer_id = issuerId
    }

    const idempotencyKey = crypto.randomUUID()
    const response = await fetch(MERCADO_PAGO_PAYMENTS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(paymentPayload),
    })

    const mpRequestId =
      response.headers.get('x-request-id') ||
      response.headers.get('x-correlation-id') ||
      response.headers.get('x-trace-id') ||
      undefined
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      console.error('[MP] Transparent payment failed', {
        status: response.status,
        mpRequestId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        cause: data?.cause,
        message: data?.message,
        error: data?.error,
      })

      return NextResponse.json(
        {
          error: data?.message || data?.error || 'Erro ao processar pagamento no Mercado Pago.',
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

    const status = String(data?.status || '')
    const nextPaymentStatus = paymentStatusMap[status] ?? PaymentStatus.PENDING
    const nextOrderStatus = orderStatusMap[status] ?? OrderStatus.PENDING

    await db.order.update({
      where: { id: order.id },
      data: {
        paymentId: String(data?.id || ''),
        paymentStatus: nextPaymentStatus,
        status: nextOrderStatus,
        paymentMethod: `MERCADO_PAGO_${String(data?.payment_method_id || paymentMethodId).toUpperCase()}`,
      },
    })

    console.info('[MP] Transparent payment processed', {
      env: config.env,
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId: data?.id,
      status,
      statusDetail: data?.status_detail,
      mpRequestId,
    })

    return NextResponse.json({
      paymentId: data?.id,
      status,
      statusDetail: data?.status_detail,
      paymentStatus: nextPaymentStatus,
      orderStatus: nextOrderStatus,
      orderNumber: order.orderNumber,
    })
  } catch (error) {
    console.error('Erro ao processar pagamento transparente Mercado Pago:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao processar pagamento' },
      { status: 500 }
    )
  }
}
