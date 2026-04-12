'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from '@/hooks/use-toast'

type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled'

type Appointment = {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  serviceName: string
  scheduledAt: string
  totalPrice: number
  paymentMethod: string | null
  status: AppointmentStatus
  notes: string | null
}

const statusLabel: Record<AppointmentStatus, string> = {
  scheduled: 'Agendado',
  completed: 'Concluido',
  cancelled: 'Cancelado',
}

const statusColor: Record<AppointmentStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | AppointmentStatus>('all')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [updates, setUpdates] = useState<
    Record<string, { status: AppointmentStatus; notes: string }>
  >({})

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/appointments?status=${filter}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar agendamentos')
      }
      setAppointments(data.appointments || [])
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar agendamentos',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [filter])

  const grouped = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return {
      upcoming: appointments.filter(
        (item) =>
          item.status === 'scheduled' &&
          new Date(item.scheduledAt).getTime() >= today.getTime()
      ),
      done: appointments.filter((item) => item.status !== 'scheduled'),
    }
  }, [appointments])

  const getUpdate = (appointment: Appointment) =>
    updates[appointment.id] || {
      status: appointment.status,
      notes: appointment.notes || '',
    }

  const saveAppointment = async (appointment: Appointment) => {
    const payload = getUpdate(appointment)
    setSavingId(appointment.id)
    try {
      const response = await fetch(`/api/admin/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar agendamento')
      }
      toast({ title: 'Agendamento atualizado' })
      setAppointments((prev) =>
        prev.map((item) => (item.id === appointment.id ? data.appointment : item))
      )
      setUpdates((prev) => {
        const next = { ...prev }
        delete next[appointment.id]
        return next
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar agendamento',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSavingId(null)
    }
  }

  const renderCard = (appointment: Appointment) => {
    const update = getUpdate(appointment)
    return (
      <div
        key={appointment.id}
        className="rounded-xl border border-pink-100 bg-white p-4 space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <p className="font-semibold text-foreground">{appointment.customerName}</p>
            <p className="text-sm text-muted-foreground">
              {appointment.customerEmail} • {appointment.customerPhone}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {appointment.serviceName} • R${' '}
              {appointment.totalPrice.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(appointment.scheduledAt).toLocaleString('pt-BR')}
            </p>
          </div>
          <span
            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusColor[appointment.status]}`}
          >
            {statusLabel[appointment.status]}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-2">Status</label>
            <select
              value={update.status}
              onChange={(event) =>
                setUpdates((prev) => ({
                  ...prev,
                  [appointment.id]: {
                    ...update,
                    status: event.target.value as AppointmentStatus,
                  },
                }))
              }
              className="w-full px-3 py-2 border border-pink-200 rounded-lg"
            >
              <option value="scheduled">Agendado</option>
              <option value="completed">Concluido</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2">Metodo pagamento</label>
            <input
              disabled
              value={appointment.paymentMethod || 'Nao informado'}
              className="w-full px-3 py-2 border border-pink-100 rounded-lg bg-pink-50 text-muted-foreground"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-2">Observacoes</label>
          <textarea
            rows={3}
            value={update.notes}
            onChange={(event) =>
              setUpdates((prev) => ({
                ...prev,
                [appointment.id]: {
                  ...update,
                  notes: event.target.value,
                },
              }))
            }
            className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => saveAppointment(appointment)}
            disabled={savingId === appointment.id}
            className="px-4 py-2 rounded-lg bg-primary text-white font-semibold disabled:opacity-60"
          >
            {savingId === appointment.id ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-xl text-foreground">
              Gerenciar Agendamentos
            </h2>
            <p className="text-sm text-muted-foreground">
              Cancele, conclua ou reative agendamentos para liberar horarios.
            </p>
          </div>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as any)}
            className="w-full md:w-56 px-4 py-2 border border-pink-200 rounded-lg"
          >
            <option value="all">Todos</option>
            <option value="scheduled">Agendados</option>
            <option value="completed">Concluidos</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-md p-6 text-muted-foreground">
          Carregando agendamentos...
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md p-6 text-muted-foreground">
          Nenhum agendamento encontrado.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">
              Proximos ({grouped.upcoming.length})
            </h3>
            {grouped.upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum agendamento futuro.
              </p>
            ) : (
              grouped.upcoming.map(renderCard)
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">
              Concluidos/Cancelados ({grouped.done.length})
            </h3>
            {grouped.done.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum registro finalizado.
              </p>
            ) : (
              grouped.done.map(renderCard)
            )}
          </div>
        </div>
      )}
    </div>
  )
}

