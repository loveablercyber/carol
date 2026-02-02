import Link from 'next/link'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

function pick(searchParams: SearchParams, key: string) {
  const value = searchParams[key]
  return Array.isArray(value) ? value[0] : value || ''
}

export default function CheckoutReturnPage({ searchParams }: { searchParams: SearchParams }) {
  const status = pick(searchParams, 'status') || pick(searchParams, 'collection_status')
  const paymentId = pick(searchParams, 'payment_id') || pick(searchParams, 'collection_id')
  const orderNumber = pick(searchParams, 'external_reference') || pick(searchParams, 'order')

  const normalizedStatus = status.toLowerCase()
  const isApproved = normalizedStatus === 'approved'
  const isPending = normalizedStatus === 'pending' || normalizedStatus === 'in_process'
  const isRejected = normalizedStatus === 'rejected'

  const title = isApproved
    ? 'Pagamento aprovado!'
    : isPending
      ? 'Pagamento pendente'
      : isRejected
        ? 'Pagamento recusado'
        : 'Retorno do pagamento'

  const description = isApproved
    ? 'Recebemos a confirmação do Mercado Pago. Seu pedido será processado em seguida.'
    : isPending
      ? 'Seu pagamento está em análise ou aguardando confirmação. Você pode acompanhar o pedido na sua conta.'
      : isRejected
        ? 'O pagamento foi recusado. Você pode tentar novamente no detalhe do pedido.'
        : 'Você pode acompanhar o status do pedido na sua conta.'

  const orderHref = orderNumber ? `/account/orders/${encodeURIComponent(orderNumber)}` : '/account'

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-white to-white flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <h1 className="font-display font-bold text-2xl text-foreground mb-2">
          {title}
        </h1>
        <p className="text-muted-foreground mb-6">
          {description}
        </p>

        {(orderNumber || paymentId) && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-muted-foreground mb-6 space-y-1">
            {orderNumber && (
              <p>
                <span className="font-semibold text-foreground">Pedido:</span>{' '}
                {orderNumber}
              </p>
            )}
            {paymentId && (
              <p>
                <span className="font-semibold text-foreground">Pagamento:</span>{' '}
                {paymentId}
              </p>
            )}
          </div>
        )}

        <Link
          href={orderHref}
          className="block w-full py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors text-center"
        >
          Ver pedido
        </Link>

        <Link
          href="/shop"
          className="block w-full mt-3 py-4 border border-pink-200 rounded-xl font-semibold text-primary hover:border-pink-400 transition-colors text-center"
        >
          Voltar para a loja
        </Link>
      </div>
    </div>
  )
}
