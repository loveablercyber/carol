import { PaymentStatusView } from '@/components/payment/PaymentStatusView'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

export default function PagamentoErroPage({ searchParams }: { searchParams: SearchParams }) {
  return <PaymentStatusView variant="failure" searchParams={searchParams} />
}

