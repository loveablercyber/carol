import { PaymentStatusView } from '@/components/payment/PaymentStatusView'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

export default function PagamentoPendentePage({ searchParams }: { searchParams: SearchParams }) {
  return <PaymentStatusView variant="pending" searchParams={searchParams} />
}

