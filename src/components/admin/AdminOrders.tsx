"use client"

import { useEffect, useState } from 'react'
import { toast } from '@/hooks/use-toast'

interface OrderItem {
  productName: string
  quantity: number
  price: number
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  status: string
  paymentStatus: string
  total: number
  trackingCode?: string
  createdAt: string
  items: OrderItem[]
}

const statusOptions = [
  'PENDING',
  'PROCESSING',
  'PAID',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
]

const paymentOptions = ['PENDING', 'APPROVED', 'REJECTED', 'REFUNDED']

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [updates, setUpdates] = useState<Record<
    string,
    { status: string; paymentStatus: string; trackingCode: string }
  >>({})

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/shop/orders?limit=50${filter ? `&status=${filter}` : ''}`
      )
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      toast({
        title: 'Erro ao carregar pedidos',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [filter])

  const updateOrder = async (order: Order) => {
    const update = updates[order.id] || {
      status: order.status,
      paymentStatus: order.paymentStatus,
      trackingCode: order.trackingCode || '',
    }

    try {
      const response = await fetch('/api/shop/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: order.id,
          status: update.status,
          paymentStatus: update.paymentStatus,
          trackingCode: update.trackingCode,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao atualizar pedido')
      }

      toast({ title: 'Pedido atualizado' })
      fetchOrders()
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar pedido',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  const getUpdateValue = (
    orderId: string,
    field: 'status' | 'paymentStatus' | 'trackingCode',
    fallback: string
  ) => updates[orderId]?.[field] ?? fallback

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-foreground">
            Pedidos recentes
          </h2>
          <p className="text-sm text-muted-foreground">
            Atualize status, pagamento e codigo de rastreio.
          </p>
        </div>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="w-full md:w-56 px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
        >
          <option value="">Todos os status</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando pedidos...</p>
      ) : orders.length === 0 ? (
        <p className="text-muted-foreground">Nenhum pedido encontrado.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-md p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground">
                    Pedido #{order.orderNumber}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.customerName} • {order.customerEmail}
                  </p>
                </div>
                <p className="font-bold text-primary">
                  R$ {order.total.toFixed(2).replace('.', ',')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-2">Status</label>
                  <select
                    value={getUpdateValue(order.id, 'status', order.status)}
                    onChange={(event) =>
                      setUpdates((prev) => ({
                        ...prev,
                        [order.id]: {
                          status: event.target.value,
                          paymentStatus: getUpdateValue(order.id, 'paymentStatus', order.paymentStatus),
                          trackingCode: getUpdateValue(order.id, 'trackingCode', order.trackingCode || ''),
                        },
                      }))
                    }
                    className="w-full px-3 py-2 border border-pink-200 rounded-lg"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2">Pagamento</label>
                  <select
                    value={getUpdateValue(order.id, 'paymentStatus', order.paymentStatus)}
                    onChange={(event) =>
                      setUpdates((prev) => ({
                        ...prev,
                        [order.id]: {
                          status: getUpdateValue(order.id, 'status', order.status),
                          paymentStatus: event.target.value,
                          trackingCode: getUpdateValue(order.id, 'trackingCode', order.trackingCode || ''),
                        },
                      }))
                    }
                    className="w-full px-3 py-2 border border-pink-200 rounded-lg"
                  >
                    {paymentOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2">Rastreio</label>
                  <input
                    value={getUpdateValue(order.id, 'trackingCode', order.trackingCode || '')}
                    onChange={(event) =>
                      setUpdates((prev) => ({
                        ...prev,
                        [order.id]: {
                          status: getUpdateValue(order.id, 'status', order.status),
                          paymentStatus: getUpdateValue(order.id, 'paymentStatus', order.paymentStatus),
                          trackingCode: event.target.value,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 border border-pink-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                </span>
                <button
                  onClick={() => updateOrder(order)}
                  className="px-4 py-2 bg-primary text-white rounded-lg font-semibold"
                >
                  Atualizar pedido
                </button>
              </div>

              {order.items?.length > 0 && (
                <div className="border-t border-gray-100 pt-4 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground mb-2">Itens</p>
                  <ul className="space-y-1">
                    {order.items.map((item, index) => (
                      <li key={`${order.id}-${index}`}>
                        {item.productName} • {item.quantity}x • R$ {item.price.toFixed(2).replace('.', ',')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
