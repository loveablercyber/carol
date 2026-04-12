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
  payerEmail?: string | null
  disabled?: boolean
  onSuccess: (orderNumber: string) => void
  onPending: (orderNumber: string) => void
  onError: (message: string) => void
}

export function MercadoPagoTransparentCard({
  order,
  payerEmail,
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
    const containerId = `mp-card-payment-${order.id}`

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

        const effectivePayerEmail = config?.testBuyerEmail || payerEmail || undefined
        if (config?.environment === 'prod' && !effectivePayerEmail) {
          throw new Error('E-mail do pagador ausente. Atualize seu cadastro antes de pagar.')
        }

        const mp = new window.MercadoPago(config.publicKey, { locale: 'pt-BR' })
        const bricksBuilder = mp.bricks()

        controllerRef.current?.unmount?.()
        controllerRef.current = await bricksBuilder.create('cardPayment', containerId, {
          initialization: {
            amount: Number(order.total),
            payer: effectivePayerEmail ? { email: effectivePayerEmail } : undefined,
          },
          customization: {
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
            onSubmit: (cardFormData: Record<string, unknown>) => {
              if (disabled || submittingRef.current) {
                return Promise.reject(new Error('Pagamento ja esta em processamento.'))
              }

              submittingRef.current = true
              setSubmitting(true)
              onErrorRef.current('')

              return fetch('/api/payments/mercadopago/transparent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...cardFormData,
                  orderId: order.id,
                  payerEmail,
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
              console.error('[MP] Card Payment Brick error', error)
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
  }, [disabled, order.id, order.orderNumber, order.total, payerEmail])

  return (
    <div className="space-y-3">
      {loading && (
        <div className="rounded-xl border border-pink-100 bg-pink-50 p-4 text-sm text-muted-foreground">
          Carregando pagamento seguro do Mercado Pago...
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
          <p className="font-semibold">Dados obrigatórios para aprovar no modo teste</p>
          <p>Use um cartão de teste do Mercado Pago e preencha o nome do titular como APRO.</p>
          <p>CPF: 12345678909. Vencimento: 11/30. CVV: 123 para Visa/Master ou 1234 para Amex.</p>
        </div>
      )}
      <div id={`mp-card-payment-${order.id}`} className={disabled ? 'pointer-events-none opacity-60' : ''} />
    </div>
  )
}
