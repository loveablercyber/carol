import AdminAppointments from '@/components/admin/AdminAppointments'

export default function AdminAppointmentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-3xl text-foreground">
        Agendamentos
      </h1>
      <AdminAppointments />
    </div>
  )
}

