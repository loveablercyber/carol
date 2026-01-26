import AdminOrders from '@/components/admin/AdminOrders'

export default function AdminOrdersPage() {
  return (
    <div>
      <h1 className="font-display font-bold text-3xl text-foreground mb-6">
        Pedidos
      </h1>
      <AdminOrders />
    </div>
  )
}
