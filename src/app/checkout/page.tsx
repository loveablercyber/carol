import dynamic from 'next/dynamic'

export const dynamic = 'force-dynamic'

const CheckoutClient = dynamic(() => import('./CheckoutClient'), { ssr: false })

export default function CheckoutPage() {
  return <CheckoutClient />
}
