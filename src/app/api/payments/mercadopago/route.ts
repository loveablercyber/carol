import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const MERCADO_PAGO_URL = 'https://api.mercadopago.com/v1/payments'
// In TEST credentials, Mercado Pago rejects real buyer emails. A @testuser.com email is required.
// This default works across accounts and can be overridden by passing a custom @testuser.com email.
const MERCADO_PAGO_TEST_PAYER_EMAIL = 'test_user_123@testuser.com'
const MERCADO_PAGO_TEST_PAYER_CPF = '19119119100'

function toSafeInt(value: unknown) {
  if (value === null || value === undefined) return null
  const raw = String(value).trim()
  if (!raw) return null
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : null
}

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
    const {
      orderId,
      amount,
      description,
      payerEmail,
      token: cardToken,
      paymentMethodId,
      issuerId,
      installments,
      identificationType,
      identificationNumber,
    } = body

    if (!orderId || !amount) {
      return NextResponse.json(
        { error: 'Dados obrigatorios nao informados' },
        { status: 400 }
      )
    }

    const order = await db.order.findUnique({ where: { id: orderId } })
    if (!order) {
      return NextResponse.json({ error: 'Pedido nao encontrado' }, { status: 404 })
    }

    const isTestToken = token.startsWith('TEST-')
    const cleanedIdentificationNumber = identificationNumber
      ? String(identificationNumber).replace(/\D/g, '')
      : undefined
    let resolvedIdentificationNumber = cleanedIdentificationNumber || identificationNumber
    const isCardPayment = Boolean(cardToken && paymentMethodId)

    // Mercado Pago test mode: do not send the store user's real email; use a test buyer email instead.
    let resolvedPayerEmail = (payerEmail || order.customerEmail || '').trim().toLowerCase()
    if (isTestToken) {
      if (!resolvedPayerEmail.endsWith('@testuser.com')) {
        resolvedPayerEmail = MERCADO_PAGO_TEST_PAYER_EMAIL
      }
      if (isCardPayment && !resolvedIdentificationNumber) {
        resolvedIdentificationNumber = MERCADO_PAGO_TEST_PAYER_CPF
      }
    }

    if (!resolvedPayerEmail) {
      return NextResponse.json({ error: 'Email do pagador nao informado' }, { status: 400 })
    }

    if (!isTestToken && resolvedPayerEmail.endsWith('@testuser.com')) {
      return NextResponse.json(
        { error: 'Email de teste usado com credenciais de producao.' },
        { status: 400 }
      )
    }

    const finalAmount = Number(order.total)

    if (isCardPayment) {
      if (!resolvedIdentificationNumber) {
        return NextResponse.json(
          { error: 'CPF obrigatório para pagamento com cartão' },
          { status: 400 }
        )
      }
    }

    const idempotencyKey = crypto.randomUUID()
    const safeInstallments = toSafeInt(installments) || 1
    const safeIssuerId = toSafeInt(issuerId)

    const response = await fetch(MERCADO_PAGO_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(
        isCardPayment
          ? {
              transaction_amount: finalAmount,
              token: cardToken,
              description: description || `Pedido ${order.orderNumber}`,
              installments: safeInstallments,
              payment_method_id: paymentMethodId,
              issuer_id: safeIssuerId || undefined,
              payer: {
                email: resolvedPayerEmail,
                identification: {
                  type: identificationType || 'CPF',
                  number: resolvedIdentificationNumber,
                },
              },
            }
          : {
              transaction_amount: finalAmount,
              description: description || `Pedido ${order.orderNumber}`,
              payment_method_id: 'pix',
              payer: {
                email: resolvedPayerEmail,
              },
            }
      ),
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
          error: data?.message || data?.error || 'Erro ao gerar pagamento',
          details: {
            status: data?.status,
            status_detail: data?.status_detail,
            cause: data?.cause,
            mp_request_id: mpRequestId,
            idempotency_key: idempotencyKey,
          },
        },
        { status: response.status }
      )
    }

    const paymentId = String(data.id)
    const paymentStatus =
      data.status === 'approved'
        ? 'APPROVED'
        : data.status === 'rejected'
        ? 'REJECTED'
        : 'PENDING'
    await db.order.update({
      where: { id: orderId },
      data: {
        paymentId,
        paymentStatus,
        ...(paymentStatus === 'APPROVED' ? { status: 'PAID' } : {}),
      },
    })

    return NextResponse.json({
      paymentId,
      status: data.status,
      paymentType: isCardPayment ? 'CARD' : 'PIX',
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
