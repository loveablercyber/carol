import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const MERCADO_PAGO_URL = 'https://api.mercadopago.com/v1/payments'
const MERCADO_PAGO_TEST_USER_URL = 'https://api.mercadopago.com/users/test_user'

async function createTestUser(accessToken: string) {
  const response = await fetch(MERCADO_PAGO_TEST_USER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ site_id: 'MLB' }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.message || 'Falha ao criar usuario de teste')
  }

  return response.json()
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
    let resolvedPayerEmail = payerEmail || order.customerEmail
    const cleanedIdentificationNumber = identificationNumber
      ? String(identificationNumber).replace(/\D/g, '')
      : undefined
    let resolvedIdentificationNumber = cleanedIdentificationNumber || identificationNumber

    if (isTestToken && (!resolvedPayerEmail || !resolvedPayerEmail.includes('@testuser.com'))) {
      try {
        const testUser = await createTestUser(token)
        resolvedPayerEmail = testUser?.email || resolvedPayerEmail
        if (!resolvedIdentificationNumber && testUser?.identification?.number) {
          resolvedIdentificationNumber = testUser.identification.number
        }
      } catch (error) {
        console.error('Erro ao criar usuario de teste Mercado Pago:', error)
      }
    }

    if (!resolvedPayerEmail) {
      return NextResponse.json({ error: 'Email do pagador nao informado' }, { status: 400 })
    }

    if (isTestToken && !resolvedPayerEmail.includes('@testuser.com')) {
      return NextResponse.json(
        { error: 'Email do pagador deve ser um usuario de teste do Mercado Pago.' },
        { status: 400 }
      )
    }

    if (!isTestToken && resolvedPayerEmail.includes('@testuser.com')) {
      return NextResponse.json(
        { error: 'Email de teste usado com credenciais de producao.' },
        { status: 400 }
      )
    }

    resolvedPayerEmail = resolvedPayerEmail.trim().toLowerCase()

    const finalAmount = Number(order.total)
    const isCardPayment = Boolean(cardToken && paymentMethodId)

    if (isCardPayment) {
      if (!resolvedIdentificationNumber) {
        return NextResponse.json(
          { error: 'CPF obrigatório para pagamento com cartão' },
          { status: 400 }
        )
      }
    }

    const idempotencyKey = orderId ? `order-${orderId}` : crypto.randomUUID()
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
              installments: Number(installments || 1),
              payment_method_id: paymentMethodId,
              issuer_id: issuerId ? Number(issuerId) : undefined,
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

    const data = await response.json()
    if (!response.ok) {
      return NextResponse.json(
        {
          error: data?.message || 'Erro ao gerar pagamento',
          details: {
            status: data?.status,
            status_detail: data?.status_detail,
            cause: data?.cause,
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
