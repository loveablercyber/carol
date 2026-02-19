import { PaymentStatusView } from '@/components/payment/PaymentStatusView'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

export default function PagamentoSucessoPage({ searchParams }: { searchParams: SearchParams }) {
  return <PaymentStatusView variant="success" searchParams={searchParams} />
}

