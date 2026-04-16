import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import {
  getAppointmentById,
  updateAppointmentPaymentStatus,
} from '@/lib/appointments-store'
import { resolveMercadoPagoConfig } from '@/lib/mercadopago-config'

const MERCADO_PAGO_PAYMENTS_URL = 'https://api.mercadopago.com/v1/payments'
const DEPOSIT_AMOUNT = 50
const MERCADO_PAGO_TEST_PAYER_EMAIL = 'cliente.teste.carolsol@example.com'

type MercadoPagoEnv = 'test' | 'prod'

const appointmentPaymentStatusMap: Record<string, string> = {
  approved: 'APPROVED',
  pending: 'PENDING',
  in_process: 'PENDING',
  authorized: 'PENDING',
  rejected: 'REJECTED',
  cancelled: 'REJECTED',
  refunded: 'REFUNDED',
  charged_back: 'REFUNDED',
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeDigits(value: string) {
  return value.replace(/\D/g, '')
}

function resolvePayerEmail(env: MercadoPagoEnv, candidateEmail: string) {
  const normalizedCandidateEmail = candidateEmail.trim().toLowerCase()
  return env === 'prod' ? normalizedCandidateEmail : MERCADO_PAGO_TEST_PAYER_EMAIL
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ') || parts[0],
  }
}

function resolvePhoneParts(rawPhone: string) {
  const digits = normalizeDigits(rawPhone)
  if (!digits || digits.length < 10) return null
  return {
    areaCode: digits.slice(0, 2),
    number: digits.slice(2, 11),
  }
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

function isOfflinePayment(paymentTypeId: string, paymentMethodId: string) {
  const normalizedType = paymentTypeId.trim()
  return (
    normalizedType === 'ticket' ||
    normalizedType === 'bank_transfer' ||
    normalizedType === 'bankTransfer' ||
    paymentMethodId === 'pix' ||
    paymentMethodId.startsWith('bol')
  )
}

function resolveStatusDetailMessage(statusDetail: string, env: MercadoPagoEnv) {
  if (statusDetail === 'cc_rejected_high_risk') {
    return env === 'test'
      ? 'Pagamento recusado por risco no modo teste. Use cartao de teste, titular APRO, CPF 12345678909 e comprador de teste diferente da conta vendedora.'
      : 'O Mercado Pago recusou por analise de risco. Use dados reais do titular e tente outro cartao/banco.'
  }

  if (statusDetail === 'cc_amount_rate_limit_exceeded') {
    return 'O Mercado Pago recusou por limite temporario do cartao. Tente outro meio de pagamento ou aguarde alguns minutos.'
  }

  return ''
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const config = resolveMercadoPagoConfig({ requestOrigin: request.nextUrl.origin })
    const body = await request.json().catch(() => ({} as any))
    const appointmentId = asString(body?.appointmentId)

    if (!appointmentId) {
      return NextResponse.json({ error: 'appointmentId obrigatorio' }, { status: 400 })
    }

    const appointment = await getAppointmentById(appointmentId)
    if (!appointment) {
      return NextResponse.json({ error: 'Agendamento nao encontrado' }, { status: 404 })
    }

    const isOwnerById = Boolean(appointment.userId && appointment.userId === session.user.id)
    const isOwnerByEmail = Boolean(
      session.user.email &&
        appointment.customerEmail &&
        appointment.customerEmail.toLowerCase() === session.user.email.toLowerCase()
    )
    const isAdmin = session.user.role === 'admin'

    if (!isOwnerById && !isOwnerByEmail && !isAdmin) {
      return NextResponse.json({ error: 'Acesso negado ao agendamento' }, { status: 403 })
    }

    if (String(appointment.paymentStatus || '').toUpperCase() === 'APPROVED') {
      return NextResponse.json({
        paymentStatus: 'APPROVED',
        orderNumber: appointment.id,
        message: 'Adiantamento ja aprovado.',
      })
    }

    const token = asString(body?.token)
    const paymentMethodId = asString(body?.payment_method_id || body?.paymentMethodId)
    const paymentTypeId = asString(
      body?.payment_type_id || body?.paymentTypeId || body?.selectedPaymentMethod
    )
    const issuerId = asString(body?.issuer_id || body?.issuerId)
    const installments = Math.max(1, asNumber(body?.installments, 1))
    const payerProfile = body?.payerProfile || {}
    const profileName = asString(payerProfile?.name || appointment.customerName)
    const { firstName, lastName } = splitFullName(profileName)
    const phoneParts = resolvePhoneParts(asString(payerProfile?.phone || appointment.customerPhone))
    const payerEmail = resolvePayerEmail(
      config.env,
      asString(
        body?.payer?.email ||
          body?.payerEmail ||
          payerProfile?.email ||
          appointment.customerEmail
      )
    )
    const cpf = normalizeDigits(asString(payerProfile?.cpf))
    const identification =
      resolveIdentification(body) ||
      (cpf
        ? {
            type: 'CPF',
            number: cpf,
          }
        : undefined)
    const offlinePayment = isOfflinePayment(paymentTypeId, paymentMethodId)

    if (!paymentMethodId || !payerEmail) {
      return NextResponse.json(
        { error: 'Dados do pagamento incompletos. Confira o formulario.' },
        { status: 400 }
      )
    }

    if (!offlinePayment && !token) {
      return NextResponse.json(
        { error: 'Token do cartao ausente. Recarregue o formulario e tente novamente.' },
        { status: 400 }
      )
    }

    const paymentPayload: Record<string, unknown> = {
      transaction_amount: DEPOSIT_AMOUNT,
      description: `Adiantamento agendamento - ${appointment.serviceName}`,
      payment_method_id: paymentMethodId,
      external_reference: `appointment:${appointment.id}`,
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
        appointment_id: appointment.id,
        payment_purpose: 'appointment_deposit',
      },
      additional_info: {
        items: [
          {
            id: `appointment-deposit-${appointment.id}`,
            title: `Adiantamento - ${appointment.serviceName}`,
            quantity: 1,
            unit_price: DEPOSIT_AMOUNT,
          },
        ],
      },
    }

    if (token) paymentPayload.token = token
    if (!offlinePayment) paymentPayload.installments = installments
    if (paymentTypeId) paymentPayload.payment_type_id = paymentTypeId
    if (issuerId) paymentPayload.issuer_id = issuerId

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

    const data = await response.json().catch(() => null)
    const mpRequestId =
      response.headers.get('x-request-id') ||
      response.headers.get('x-correlation-id') ||
      response.headers.get('x-trace-id') ||
      undefined

    if (!response.ok) {
      console.error('[MP] Appointment deposit failed', {
        status: response.status,
        mpRequestId,
        appointmentId: appointment.id,
        cause: data?.cause,
        message: data?.message,
        error: data?.error,
      })

      return NextResponse.json(
        {
          error: data?.message || data?.error || 'Erro ao processar adiantamento.',
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
    const nextPaymentStatus = appointmentPaymentStatusMap[status] || 'PENDING'
    const paymentMethod = `MERCADO_PAGO_${String(
      data?.payment_method_id || paymentMethodId
    ).toUpperCase()}`

    await updateAppointmentPaymentStatus({
      id: appointment.id,
      paymentStatus: nextPaymentStatus,
      paymentMethod,
    })

    const ticketUrl = asString(
      data?.transaction_details?.external_resource_url ||
        data?.point_of_interaction?.transaction_data?.ticket_url
    )
    const qrCode = asString(data?.point_of_interaction?.transaction_data?.qr_code)
    const qrCodeBase64 = asString(data?.point_of_interaction?.transaction_data?.qr_code_base64)

    return NextResponse.json({
      paymentId: data?.id,
      status,
      statusDetail: data?.status_detail,
      paymentMethodId: data?.payment_method_id,
      paymentTypeId: data?.payment_type_id,
      ticketUrl: ticketUrl || undefined,
      qrCode: qrCode || undefined,
      qrCodeBase64: qrCodeBase64 || undefined,
      message:
        resolveStatusDetailMessage(String(data?.status_detail || ''), config.env) ||
        (nextPaymentStatus === 'REJECTED'
          ? 'Pagamento recusado pelo Mercado Pago. Use outro cartao ou tente novamente mais tarde.'
          : undefined),
      paymentStatus: nextPaymentStatus,
      orderNumber: appointment.id,
      appointmentId: appointment.id,
      depositAmount: DEPOSIT_AMOUNT,
    })
  } catch (error) {
    console.error('Erro ao processar adiantamento Mercado Pago:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao processar adiantamento' },
      { status: 500 }
    )
  }
}
