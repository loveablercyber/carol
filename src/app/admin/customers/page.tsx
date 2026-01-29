import AdminCustomers from '@/components/admin/AdminCustomers'

export default function AdminCustomersPage() {
  return (
    <div>
      <h1 className="font-display font-bold text-3xl text-foreground mb-6">
        Clientes
      </h1>
      <AdminCustomers />
    </div>
  )
}
