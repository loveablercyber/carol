import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { db } from '@/lib/db'

export default async function OrderDetailPage({
  params,
}: {
  params: { orderNumber: string }
}) {
  const rawParam = params?.orderNumber
  if (!rawParam) {
    notFound()
  }
  const orderNumber = decodeURIComponent(rawParam).trim()
  if (!orderNumber) {
    notFound()
  }

  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const order =
    (await db.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    })) ||
    (rawParam.startsWith('cm')
      ? await db.order.findUnique({
          where: { id: rawParam },
          include: { items: true },
        })
      : null)

  if (!order) {
    notFound()
  }

  const isAdmin = session.user?.role === 'admin'
  if (!isAdmin && order.userId !== session.user.id) {
    redirect('/account')
  }

  let shipping: {
    recipient?: string
    phone?: string
    zipCode?: string
    street?: string
    number?: string
    complement?: string
    neighborhood?: string
    city?: string
    state?: string
  } = {}

  try {
    if (typeof order.shippingAddress === 'string') {
      shipping = JSON.parse(order.shippingAddress)
    } else if (order.shippingAddress && typeof order.shippingAddress === 'object') {
      shipping = order.shippingAddress as typeof shipping
    }
  } catch (error) {
    shipping = {}
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
