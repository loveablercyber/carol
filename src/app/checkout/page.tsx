import nextDynamic from 'next/dynamic'

export const dynamic = 'force-dynamic'

const CheckoutClient = nextDynamic(() => import('./CheckoutClient'), { ssr: false })

export default function CheckoutPage() {
  return <CheckoutClient />
}
