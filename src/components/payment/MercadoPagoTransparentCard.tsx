'use client'

import { useEffect, useRef, useState } from 'react'
import { loadMercadoPago } from '@mercadopago/sdk-js'

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: Record<string, unknown>) => {
      bricks: () => {
        create: (
          type: string,
          containerId: string,
          settings: Record<string, unknown>
        ) => Promise<{ unmount?: () => void }>
      }
    }
  }
}

type MercadoPagoTransparentCardProps = {
  order: {
    id: string
    orderNumber: string
    total: number
  }
  paymentEndpoint?: string
  extraPayload?: Record<string, unknown>
  payerEmail?: string | null
  payerProfile?: {
    name?: string | null
    email?: string | null
    cpf?: string | null
    phone?: string | null
    address?: {
      zipCode?: string | null
      street?: string | null
      number?: string | null
      city?: string | null
      state?: string | null
    }
  }
  disabled?: boolean
  onSuccess: (orderNumber: string) => void
  onPending: (orderNumber: string) => void
  onError: (message: string) => void
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeDigits(value: string) {
  return value.replace(/\D/g, '')
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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function unwrapPaymentBrickPayload(payload: unknown) {
  const safePayload = isObject(payload) ? payload : {}
  const wrappedFormData = safePayload.formData
  if (isObject(wrappedFormData)) {
    return {
      formData: wrappedFormData,
      selectedPaymentMethod: asString(safePayload.selectedPaymentMethod),
    }
  }

  return {
    formData: safePayload,
    selectedPaymentMethod: '',
  }
}

export function MercadoPagoTransparentCard({
  order,
  paymentEndpoint = '/api/payments/mercadopago/transparent',
  extraPayload,
  payerEmail,
  payerProfile,
  disabled,
  onSuccess,
  onPending,
  onError,
}: MercadoPagoTransparentCardProps) {
  const controllerRef = useRef<{ unmount?: () => void } | null>(null)
  const submittingRef = useRef(false)
  const onSuccessRef = useRef(onSuccess)
  const onPendingRef = useRef(onPending)
  const onErrorRef = useRef(onError)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [setupError, setSetupError] = useState('')
  const [testMode, setTestMode] = useState(false)

  useEffect(() => {
    onSuccessRef.current = onSuccess
    onPendingRef.current = onPending
    onErrorRef.current = onError
  }, [onSuccess, onPending, onError])

  useEffect(() => {
    let cancelled = false
    const containerId = `mp-payment-${order.id}`

    const renderBrick = async () => {
      setLoading(true)
      setSetupError('')
      let timeoutId: number | undefined

      try {
        timeoutId = window.setTimeout(() => {
          if (!cancelled) {
            setLoading(false)
            setSetupError(
              'O formulário do Mercado Pago demorou para carregar. Verifique se as credenciais de produção pertencem ao Checkout Transparente e tente recarregar a página.'
            )
          }
        }, 12000)

        const configResponse = await fetch('/api/payments/mercadopago/config')
        const config = await configResponse.json().catch(() => ({}))
        if (!configResponse.ok || !config?.publicKey) {
          throw new Error(config?.error || 'Mercado Pago nao configurado.')
        }
        setTestMode(config?.environment === 'test')

        await loadMercadoPago()
        if (!window.MercadoPago) {
          throw new Error('SDK do Mercado Pago indisponivel.')
        }

        const effectivePayerEmail =
          config?.testBuyerEmail ||
          asString(payerProfile?.email) ||
          asString(payerEmail) ||
          undefined
        if (config?.environment === 'prod' && !effectivePayerEmail) {
          throw new Error('E-mail do pagador ausente. Atualize seu cadastro antes de pagar.')
        }

        const profileName = asString(payerProfile?.name)
        const { firstName, lastName } = splitFullName(profileName)
        const cpf = normalizeDigits(asString(payerProfile?.cpf))

        const mp = new window.MercadoPago(config.publicKey, { locale: 'pt-BR' })
        const bricksBuilder = mp.bricks()

        controllerRef.current?.unmount?.()
        controllerRef.current = await bricksBuilder.create('payment', containerId, {
          initialization: {
            amount: Number(order.total),
            payer: effectivePayerEmail
              ? {
                  email: effectivePayerEmail,
                  ...(firstName ? { firstName } : {}),
                  ...(lastName ? { lastName } : {}),
                  ...(cpf
                    ? {
                        identification: {
                          type: 'CPF',
                          number: cpf,
                        },
                      }
                    : {}),
                }
              : undefined,
          },
          customization: {
            paymentMethods: {
              creditCard: 'all',
              debitCard: 'all',
              ticket: 'all',
              bankTransfer: 'all',
              mercadoPago: 'none',
            },
            visual: {
              style: {
                theme: 'default',
              },
            },
          },
          callbacks: {
            onReady: () => {
              window.clearTimeout(timeoutId)
              if (!cancelled) {
                setLoading(false)
                setSetupError('')
              }
            },
            onSubmit: (submitPayload: unknown) => {
              if (disabled || submittingRef.current) {
                return Promise.reject(new Error('Pagamento ja esta em processamento.'))
              }

              submittingRef.current = true
              setSubmitting(true)
              onErrorRef.current('')
              const { formData, selectedPaymentMethod } = unwrapPaymentBrickPayload(submitPayload)
              const existingPayer = isObject(formData.payer) ? formData.payer : {}
              const fallbackPayer = {
                ...existingPayer,
                ...(effectivePayerEmail ? { email: effectivePayerEmail } : {}),
                ...(cpf && !isObject(existingPayer.identification)
                  ? {
                      identification: {
                        type: 'CPF',
                        number: cpf,
                      },
                    }
                  : {}),
              }

              return fetch(paymentEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...formData,
                  payer: fallbackPayer,
                  orderId: order.id,
                  ...(extraPayload || {}),
                  payerEmail: effectivePayerEmail,
                  selectedPaymentMethod,
                  payerProfile: {
                    name: profileName || undefined,
                    cpf: cpf || undefined,
                    phone: asString(payerProfile?.phone) || undefined,
                    address: payerProfile?.address || undefined,
                  },
                }),
              })
                .then(async (response) => {
                  const data = await response.json().catch(() => ({}))
                  if (!response.ok) {
                    throw new Error(data?.error || 'Erro ao processar pagamento.')
                  }

                  if (data.paymentStatus === 'APPROVED') {
                    onSuccessRef.current(order.orderNumber)
                    return
                  }

                  if (data.paymentStatus === 'PENDING') {
                    const ticketUrl = asString(data?.ticketUrl)
                    if (ticketUrl && typeof window !== 'undefined') {
                      window.open(ticketUrl, '_blank', 'noopener,noreferrer')
                    }
                    onPendingRef.current(order.orderNumber)
                    return
                  }

                  throw new Error(
                    data?.message ||
                      data?.statusDetail ||
                      data?.error ||
                      'Pagamento recusado pelo Mercado Pago.'
                  )
                })
                .catch((error) => {
                  onErrorRef.current(error instanceof Error ? error.message : 'Erro ao processar pagamento.')
                  throw error
                })
                .finally(() => {
                  submittingRef.current = false
                  setSubmitting(false)
                })
            },
            onError: (error: unknown) => {
              console.error('[MP] Payment Brick error', error)
              if (!cancelled) {
                setSetupError('Erro ao carregar o formulário de pagamento do Mercado Pago.')
                setLoading(false)
              }
            },
          },
        })
      } catch (error) {
        if (timeoutId) {
          window.clearTimeout(timeoutId)
        }
        if (!cancelled) {
          setSetupError(error instanceof Error ? error.message : 'Erro ao carregar Mercado Pago.')
          setLoading(false)
        }
      }
    }

    renderBrick()

    return () => {
      cancelled = true
      controllerRef.current?.unmount?.()
      controllerRef.current = null
    }
  }, [
    disabled,
    paymentEndpoint,
    JSON.stringify(extraPayload || {}),
    order.id,
    order.orderNumber,
    order.total,
    payerEmail,
    payerProfile?.name,
    payerProfile?.email,
    payerProfile?.cpf,
    payerProfile?.phone,
    payerProfile?.address?.zipCode,
    payerProfile?.address?.street,
    payerProfile?.address?.number,
    payerProfile?.address?.city,
    payerProfile?.address?.state,
  ])

  return (
    <div className="space-y-3">
      {loading && (
        <div className="rounded-xl border border-pink-100 bg-pink-50 p-4 text-sm text-muted-foreground">
          Carregando opcoes de pagamento do Mercado Pago...
        </div>
      )}
      {setupError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {setupError}
        </div>
      )}
      {submitting && (
        <div className="rounded-xl border border-pink-100 bg-pink-50 p-4 text-sm text-muted-foreground">
          Processando pagamento, aguarde...
        </div>
      )}
      {testMode && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-900">
          <p className="font-semibold">Modo teste ativo</p>
          <p>Para pagamento com cartao de teste, use titular APRO e CPF 12345678909.</p>
          <p>CPF: 12345678909. Vencimento: 11/30. CVV: 123 para Visa/Master ou 1234 para Amex.</p>
        </div>
      )}
      <div id={`mp-payment-${order.id}`} className={disabled ? 'pointer-events-none opacity-60' : ''} />
    </div>
  )
}
