'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AuthProvider } from '@/components/providers/AuthProvider'

interface OrderItem {
  id: string
  productName: string
  productImage?: string | null
  quantity: number
  price: number
}

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  paymentMethod?: string | null
  customerEmail?: string | null
  total: number
  trackingCode?: string | null
  shippingAddress: any
  items: OrderItem[]
}

export default function OrderDetailPage() {
  return (
    <AuthProvider>
      <OrderDetailContent />
    </AuthProvider>
  )
}

function OrderDetailContent() {
  const params = useParams()
  const { data: session, status } = useSession()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryLoading, setRetryLoading] = useState(false)
  const [retryError, setRetryError] = useState('')
  const [retrySuccess, setRetrySuccess] = useState('')
  const [pixCode, setPixCode] = useState('')
  const [pixQrImage, setPixQrImage] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX')
  const [cardFormReady, setCardFormReady] = useState(false)
  const [cardFormError, setCardFormError] = useState('')
  const cardFormRef = useRef<any>(null)
  const cardFormDataRef = useRef<any>(null)
  const cardFormSubmitResolverRef = useRef<((data: any) => void) | null>(null)

  const orderNumber = useMemo(() => {
    const raw = params?.orderNumber
    if (!raw) return ''
    const value = Array.isArray(raw) ? raw[0] : raw
    return decodeURIComponent(value).trim()
  }, [params])

  const fetchOrder = async () => {
    if (!orderNumber) return
    if (!session?.user) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/shop/orders?orderNumber=${encodeURIComponent(orderNumber)}`)
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Erro ao carregar pedido.')
        setOrder(null)
        return
      }
      const found = data.orders?.[0] || null
      if (!found) {
        setError('Pedido não encontrado.')
        setOrder(null)
        return
      }
      setOrder(found)
    } catch (err) {
      setError('Erro ao carregar pedido.')
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      await fetchOrder()
    }
      if (!orderNumber) return
      if (!session?.user) return
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`/api/shop/orders?orderNumber=${encodeURIComponent(orderNumber)}`)
        const data = await response.json()
        if (!response.ok) {
          setError(data.error || 'Erro ao carregar pedido.')
          setOrder(null)
          return
        }
        const found = data.orders?.[0] || null
        if (!found) {
          setError('Pedido não encontrado.')
          setOrder(null)
          return
        }
        setOrder(found)
      } catch (err) {
        setError('Erro ao carregar pedido.')
        setOrder(null)
      } finally {
        setLoading(false)
      }
    }

    if (status === 'authenticated') {
      if (!orderNumber) {
        setError('Pedido inválido.')
        setLoading(false)
        return
      }
      load()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [orderNumber, session, status])

  const shipping = useMemo(() => {
    if (!order?.shippingAddress) return {}
    if (typeof order.shippingAddress === 'string') {
      try {
        return JSON.parse(order.shippingAddress)
      } catch (error) {
        return {}
      }
    }
    return order.shippingAddress
  }, [order])

  const canRetryPayment =
    order?.paymentStatus && !['APPROVED', 'REFUNDED'].includes(order.paymentStatus)

  useEffect(() => {
    if (!canRetryPayment || paymentMethod !== 'CREDIT_CARD') return

    let isMounted = true

    const initCardForm = async () => {
      setCardFormError('')
      setCardFormReady(false)
      if (typeof window === 'undefined') return
      const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
      if (!publicKey) {
        setCardFormError('Chave pública do Mercado Pago não configurada.')
        return
      }

      try {
        const mpModule = (await import('@mercadopago/sdk-js')) as { loadMercadoPago: () => Promise<void> }
        await mpModule.loadMercadoPago()
        const MercadoPagoCtor = (window as any)?.MercadoPago
        if (!MercadoPagoCtor) {
          setCardFormError('Mercado Pago SDK não disponível.')
          return
        }
        const mp = new MercadoPagoCtor(publicKey, { locale: 'pt-BR' })
        if (!isMounted) return

        if (cardFormRef.current?.unmount) {
          cardFormRef.current.unmount()
        }

        const rootForm = document.getElementById('mp-card-form-retry')
        if (!rootForm) {
          setCardFormError('Formulário do cartão não encontrado na página.')
          return
        }

        cardFormRef.current = mp.cardForm({
          amount: order?.total?.toFixed(2) || '0',
          iframe: true,
          form: {
            id: 'mp-card-form-retry',
            cardholderName: {
              id: 'form-checkout__cardholderName',
              placeholder: 'Nome no cartão',
            },
            cardholderEmail: {
              id: 'form-checkout__cardholderEmail',
              placeholder: 'Email',
            },
            cardNumber: {
              id: 'form-checkout__cardNumber',
              placeholder: 'Número do cartão',
            },
            expirationDate: {
              id: 'form-checkout__expirationDate',
              placeholder: 'MM/AA',
            },
            securityCode: {
              id: 'form-checkout__securityCode',
              placeholder: 'CVV',
            },
            installments: {
              id: 'form-checkout__installments',
              placeholder: 'Parcelas',
            },
            issuer: {
              id: 'form-checkout__issuer',
              placeholder: 'Banco emissor',
            },
            identificationType: {
              id: 'form-checkout__identificationType',
              placeholder: 'Tipo',
            },
            identificationNumber: {
              id: 'form-checkout__identificationNumber',
              placeholder: 'CPF',
            },
          },
          callbacks: {
            onFormMounted: (error: any) => {
              if (error) {
                console.warn('Erro ao montar cardForm:', error)
                setCardFormError('Erro ao carregar formulário do cartão.')
                return
              }
              setCardFormReady(true)
            },
            onSubmit: (event: any) => {
              event.preventDefault()
              const formData = cardFormRef.current?.getCardFormData?.()
              cardFormDataRef.current = formData
              if (cardFormSubmitResolverRef.current) {
                cardFormSubmitResolverRef.current(formData)
                cardFormSubmitResolverRef.current = null
              }
            },
            onFetching: () => {
              setCardFormReady(false)
              return () => setCardFormReady(true)
            },
          },
        })
      } catch (error) {
        if (isMounted) {
          const message =
            error instanceof Error
              ? error.message
              : 'Erro ao iniciar formulário do cartão.'
          console.error('Erro ao iniciar cardForm Mercado Pago:', error)
          setCardFormError(message)
        }
      }
    }

    initCardForm()

    return () => {
      isMounted = false
      if (cardFormRef.current?.unmount) {
        cardFormRef.current.unmount()
      }
    }
  }, [canRetryPayment, paymentMethod, order?.total])

  const collectCardFormData = async () => {
    if (typeof window === 'undefined') return null
    const form = document.getElementById('mp-card-form-retry') as HTMLFormElement | null
    if (!form) return null

    return new Promise<any>((resolve) => {
      cardFormSubmitResolverRef.current = resolve
      if (typeof (form as any).requestSubmit === 'function') {
        ;(form as any).requestSubmit()
      } else {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      }
      window.setTimeout(() => {
        if (cardFormSubmitResolverRef.current === resolve) {
          cardFormSubmitResolverRef.current = null
          resolve(null)
        }
      }, 2000)
    })
  }

  const retryPayment = async () => {
    if (!order) return
    setRetryLoading(true)
    setRetryError('')
    setRetrySuccess('')
    setPixCode('')
    setPixQrImage('')
    try {
      let cardPayload = {}
      if (paymentMethod === 'CREDIT_CARD') {
        if (!cardFormReady) {
          setRetryError('Aguarde o carregamento do formulário do cartão.')
          return
        }
        const cardForm = cardFormRef.current
        if (!cardForm || typeof cardForm.getCardFormData !== 'function') {
          setRetryError('Formulário do cartão não carregado.')
          return
        }
        let formData = cardForm.getCardFormData()
        if (!formData?.token && cardFormDataRef.current) {
          formData = cardFormDataRef.current
        }
        if (!formData?.token) {
          formData = (await collectCardFormData()) || cardForm.getCardFormData()
        }
        const token = formData?.token
        const paymentMethodId = formData?.paymentMethodId
        const issuerId = formData?.issuerId
        const installments = formData?.installments
        const identificationType = formData?.identificationType || 'CPF'
        const identificationNumber = formData?.identificationNumber

        if (!token || !paymentMethodId) {
          setRetryError('Preencha os dados do cartão para continuar.')
          return
        }
        if (!identificationNumber) {
          setRetryError('CPF obrigatório para pagamento com cartão.')
          return
        }

        cardPayload = {
          token,
          paymentMethodId,
          issuerId,
          installments,
          identificationType,
          identificationNumber,
        }
      }

      const response = await fetch('/api/payments/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          amount: order.total,
          description: `Pedido ${order.orderNumber}`,
          payerEmail: session?.user?.email || order.customerEmail,
          ...cardPayload,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setRetryError(data?.error || 'Erro ao gerar pagamento.')
        return
      }
      if (data.qrCode) setPixCode(data.qrCode)
      if (data.qrCodeBase64) setPixQrImage(`data:image/png;base64,${data.qrCodeBase64}`)
      if (paymentMethod === 'PIX' && !data.qrCode && !data.qrCodeBase64) {
        setRetryError('Não foi possível gerar o QR Code do Pix.')
      }
      if (paymentMethod === 'CREDIT_CARD') {
        if (data.status === 'approved') {
          setRetrySuccess('Pagamento aprovado com sucesso.')
          await fetchOrder()
        } else if (data.status === 'rejected') {
          setRetryError('Pagamento recusado. Verifique os dados do cartão.')
        } else {
          setRetryError('Pagamento em análise. Aguarde alguns minutos.')
        }
      }
    } catch (err) {
      setRetryError('Erro ao gerar pagamento.')
    } finally {
      setRetryLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-white to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-300 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground">Carregando pedido...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-white to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="font-display font-bold text-2xl text-foreground mb-2">
            Faça login para ver o pedido
          </h1>
          <p className="text-muted-foreground mb-6">
            Você precisa estar logado para acessar seus pedidos.
          </p>
          <Link
            href="/login"
            className="block w-full py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Fazer Login
          </Link>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-white to-white pb-20">
        <header className="border-b bg-white/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/account" className="text-sm font-semibold text-foreground">
              Voltar para minha conta
            </Link>
            <h1 className="font-display font-bold text-xl text-foreground">
              Pedido
            </h1>
            <div className="w-8" />
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <h2 className="font-display font-bold text-2xl text-foreground mb-2">
              {error || 'Pedido não encontrado'}
            </h2>
            <p className="text-muted-foreground mb-6">
              Verifique se o número do pedido está correto ou volte para sua conta.
            </p>
            <Link
              href="/account"
              className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-xl font-semibold"
            >
              Voltar para minha conta
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-white to-white pb-20">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/account" className="text-sm font-semibold text-foreground">
            Voltar para minha conta
          </Link>
          <h1 className="font-display font-bold text-xl text-foreground">
            Pedido #{order.orderNumber}
          </h1>
          <div className="w-8" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-display font-bold text-xl text-foreground mb-4">
            Resumo do pedido
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <p>
              <span className="font-semibold text-foreground">Status:</span>{' '}
              {order.status}
            </p>
            <p>
              <span className="font-semibold text-foreground">Pagamento:</span>{' '}
              {order.paymentStatus}
            </p>
            <p>
              <span className="font-semibold text-foreground">Total:</span>{' '}
              R$ {order.total.toFixed(2).replace('.', ',')}
            </p>
            {order.trackingCode && (
              <p>
                <span className="font-semibold text-foreground">Rastreio:</span>{' '}
                {order.trackingCode}
              </p>
            )}
          </div>

          {canRetryPayment && (
            <div className="mt-6 border-t border-gray-100 pt-5 space-y-3">
              <p className="text-sm text-muted-foreground">
                Pagamento pendente ou recusado. Você pode refazer o pagamento via Pix ou cartão.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('PIX')}
                  className={`flex-1 py-3 border-2 rounded-xl font-semibold transition-all ${
                    paymentMethod === 'PIX'
                      ? 'border-primary bg-primary text-white'
                      : 'border-pink-200 hover:border-pink-300'
                  }`}
                >
                  Pix
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CREDIT_CARD')}
                  className={`flex-1 py-3 border-2 rounded-xl font-semibold transition-all ${
                    paymentMethod === 'CREDIT_CARD'
                      ? 'border-primary bg-primary text-white'
                      : 'border-pink-200 hover:border-pink-300'
                  }`}
                >
                  Cartão
                </button>
              </div>
              {paymentMethod === 'CREDIT_CARD' && (
                <form id="mp-card-form-retry" className="space-y-4">
                  {cardFormError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                      {cardFormError}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Número do Cartão *</label>
                    <div
                      id="form-checkout__cardNumber"
                      className="w-full h-12 border border-pink-200 rounded-lg bg-white px-3 overflow-hidden flex items-center"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Validade *</label>
                      <div
                        id="form-checkout__expirationDate"
                        className="w-full h-12 border border-pink-200 rounded-lg bg-white px-3 overflow-hidden flex items-center"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">CVV *</label>
                      <div
                        id="form-checkout__securityCode"
                        className="w-full h-12 border border-pink-200 rounded-lg bg-white px-3 overflow-hidden flex items-center"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Nome no Cartão *</label>
                    <input
                      id="form-checkout__cardholderName"
                      type="text"
                      defaultValue={session?.user?.name || ''}
                      className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Email *</label>
                      <input
                        id="form-checkout__cardholderEmail"
                        type="email"
                        defaultValue={session?.user?.email || order.customerEmail || ''}
                        className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">CPF *</label>
                      <input
                        id="form-checkout__identificationNumber"
                        type="text"
                        placeholder="000.000.000-00"
                        className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Documento</label>
                      <select
                        id="form-checkout__identificationType"
                        defaultValue="CPF"
                        className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                      >
                        <option value="CPF">CPF</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Parcelas</label>
                      <select
                        id="form-checkout__installments"
                        className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                      >
                        <option value="">Carregando parcelas...</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Banco emissor</label>
                    <select
                      id="form-checkout__issuer"
                      className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                    >
                      <option value="">Carregando banco emissor...</option>
                    </select>
                  </div>
                  <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1}>
                    Enviar
                  </button>
                </form>
              )}
              <button
                type="button"
                onClick={retryPayment}
                disabled={retryLoading}
                className="w-full sm:w-auto px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {retryLoading
                  ? paymentMethod === 'CREDIT_CARD'
                    ? 'Processando cartão...'
                    : 'Gerando Pix...'
                  : 'Refazer pagamento'}
              </button>
              {retryError && (
                <p className="text-sm text-red-500">{retryError}</p>
              )}
              {retrySuccess && (
                <p className="text-sm text-green-600">{retrySuccess}</p>
              )}
              {(paymentMethod === 'PIX' && (pixQrImage || pixCode)) && (
                <div className="mt-4 bg-pink-50 border border-pink-100 rounded-xl p-4">
                  {pixQrImage && (
                    <img
                      src={pixQrImage}
                      alt="QR Code Pix"
                      className="w-48 h-48 object-contain mx-auto"
                    />
                  )}
                  {pixCode && (
                    <div className="mt-3 text-xs text-muted-foreground break-all bg-white rounded-lg p-3">
                      {pixCode}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-display font-bold text-xl text-foreground mb-4">
            Entrega
          </h2>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>{shipping.recipient}</p>
            <p>
              {shipping.street}, {shipping.number}
              {shipping.complement ? ` - ${shipping.complement}` : ''}
            </p>
            <p>
              {shipping.neighborhood} - {shipping.city}/{shipping.state}
            </p>
            <p>CEP: {shipping.zipCode}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-display font-bold text-xl text-foreground mb-4">
            Itens do pedido
          </h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 border-b border-gray-100 pb-4 last:border-0"
              >
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.productImage && (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{item.productName}</p>
                  <p className="text-sm text-muted-foreground">
                    Quantidade: {item.quantity}
                  </p>
                </div>
                <p className="font-bold text-primary">
                  R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
