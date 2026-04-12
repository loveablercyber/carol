import { NextRequest, NextResponse } from 'next/server'
import { OrderStatus, PaymentStatus } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { db } from '@/lib/db'
import { resolveMercadoPagoConfig } from '@/lib/mercadopago-config'

const MERCADO_PAGO_PAYMENTS_URL = 'https://api.mercadopago.com/v1/payments'
const MERCADO_PAGO_TEST_PAYER_EMAIL = 'cliente.teste.carolsol@example.com'

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
  rejected: OrderStatus.PENDING,
  cancelled: OrderStatus.CANCELLED,
  refunded: OrderStatus.REFUNDED,
  charged_back: OrderStatus.REFUNDED,
}

const statusDetailMessages: Record<string, string> = {
  cc_amount_rate_limit_exceeded:
    'O Mercado Pago recusou por regra de valor/limite do teste. No modo teste, preencha o nome do titular exatamente como APRO e use CPF 12345678909. Se ja usou APRO, aguarde alguns minutos ou refaca o pedido.',
  cc_rejected_duplicated_payment:
    'O Mercado Pago identificou pagamento duplicado no mesmo valor. Use outro cartao ou aguarde alguns minutos antes de tentar novamente.',
  cc_rejected_max_attempts:
    'Voce atingiu o limite de tentativas permitidas para este cartao. Use outro cartao ou tente novamente mais tarde.',
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

  return MERCADO_PAGO_TEST_PAYER_EMAIL
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

function resolveStatusDetailMessage(statusDetail: string, env: MercadoPagoEnv) {
  if (statusDetail === 'cc_rejected_high_risk') {
    if (env === 'test') {
      return 'Pagamento recusado por risco no modo teste. Use cartao de teste, titular APRO, CPF 12345678909 e um comprador de teste diferente da conta vendedora.'
    }

    return 'O Mercado Pago recusou por analise de risco. Em producao, use dados reais do titular (nome, CPF, email e telefone), evite repetidas tentativas em sequencia e tente outro cartao/banco.'
  }

  return statusDetailMessages[statusDetail]
}

function splitFullName(fullName: string) {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) {
    return { firstName: '', lastName: '' }
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ') || parts[0],
  }
}

function parseShippingAddress(rawAddress: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(rawAddress)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function normalizeDigits(value: string) {
  return value.replace(/\D/g, '')
}

function resolvePhoneParts(rawPhone: string) {
  const digits = normalizeDigits(rawPhone)
  if (!digits || digits.length < 10) {
    return null
  }

  return {
    areaCode: digits.slice(0, 2),
    number: digits.slice(2, 11),
  }
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

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    })
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
    const { firstName, lastName } = splitFullName(order.customerName)
    const shippingAddress = parseShippingAddress(order.shippingAddress)
    const phoneParts = resolvePhoneParts(order.customerPhone)
    const payerAddressZipCode = asString(shippingAddress.zipCode)
    const payerAddressStreetName = asString(shippingAddress.street)
    const payerAddressStreetNumber = asString(shippingAddress.number)

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
        ...(firstName ? { first_name: firstName } : {}),
        ...(lastName ? { last_name: lastName } : {}),
        ...(phoneParts
          ? {
              phone: {
                area_code: phoneParts.areaCode,
                number: phoneParts.number,
              },
            }
          : {}),
        ...(payerAddressZipCode || payerAddressStreetName || payerAddressStreetNumber
          ? {
              address: {
                ...(payerAddressZipCode ? { zip_code: payerAddressZipCode } : {}),
                ...(payerAddressStreetName ? { street_name: payerAddressStreetName } : {}),
                ...(payerAddressStreetNumber ? { street_number: payerAddressStreetNumber } : {}),
              },
            }
          : {}),
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
      additional_info: {
        items: order.items.map((item) => ({
          id: item.productId,
          title: item.productName,
          quantity: item.quantity,
          unit_price: Number(item.price),
        })),
        ...(firstName || lastName || phoneParts || payerAddressZipCode || payerAddressStreetName || payerAddressStreetNumber
          ? {
              payer: {
                ...(firstName ? { first_name: firstName } : {}),
                ...(lastName ? { last_name: lastName } : {}),
                ...(phoneParts
                  ? {
                      phone: {
                        area_code: phoneParts.areaCode,
                        number: phoneParts.number,
                      },
                    }
                  : {}),
                ...(payerAddressZipCode || payerAddressStreetName || payerAddressStreetNumber
                  ? {
                      address: {
                        ...(payerAddressZipCode ? { zip_code: payerAddressZipCode } : {}),
                        ...(payerAddressStreetName ? { street_name: payerAddressStreetName } : {}),
                        ...(payerAddressStreetNumber
                          ? { street_number: payerAddressStreetNumber }
                          : {}),
                      },
                    }
                  : {}),
              },
            }
          : {}),
        ...(payerAddressZipCode || payerAddressStreetName || payerAddressStreetNumber
          ? {
              shipments: {
                receiver_address: {
                  ...(payerAddressZipCode ? { zip_code: payerAddressZipCode } : {}),
                  ...(payerAddressStreetName ? { street_name: payerAddressStreetName } : {}),
                  ...(payerAddressStreetNumber ? { street_number: payerAddressStreetNumber } : {}),
                  ...(asString(shippingAddress.city)
                    ? { city_name: asString(shippingAddress.city) }
                    : {}),
                  ...(asString(shippingAddress.state)
                    ? { state_name: asString(shippingAddress.state) }
                    : {}),
                },
              },
            }
          : {}),
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
      message:
        resolveStatusDetailMessage(String(data?.status_detail || ''), config.env) ||
        (nextPaymentStatus === PaymentStatus.REJECTED
          ? 'Pagamento recusado pelo Mercado Pago. Use outro cartao ou tente novamente mais tarde.'
          : undefined),
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
