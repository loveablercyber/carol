'use client'

import { useEffect, useMemo, useState } from 'react'
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

  const retryCheckoutProPayment = async () => {
    if (!order) return

    setRetryLoading(true)
    setRetryError('')
    setRetrySuccess('')

    try {
      const response = await fetch('/api/payments/mercadopago/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          payerEmail: session?.user?.email || order.customerEmail || undefined,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        const requestId = data?.details?.mp_request_id
        setRetryError(
          `${data?.error || 'Erro ao iniciar checkout.'}${requestId ? ` (MP: ${requestId})` : ''}`
        )
        return
      }

      if (typeof window !== 'undefined' && data?.redirectUrl) {
        window.location.href = data.redirectUrl
        return
      }

      setRetryError('Preferência criada, mas não foi possível redirecionar ao Mercado Pago.')
    } catch (error) {
      setRetryError('Erro ao iniciar checkout.')
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
                Pagamento pendente ou recusado. Você pode refazer o pagamento pelo Mercado Pago.
              </p>

              <button
                type="button"
                onClick={retryCheckoutProPayment}
                disabled={retryLoading}
                className="w-full sm:w-auto px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {retryLoading ? 'Abrindo Mercado Pago...' : 'Refazer pagamento no Mercado Pago'}
              </button>
              {retryError && (
                <p className="text-sm text-red-500">{retryError}</p>
              )}
              {retrySuccess && (
                <p className="text-sm text-green-600">{retrySuccess}</p>
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
