'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from '@/hooks/use-toast'

type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled'
type AdminTab = 'general' | 'beforeAfter' | 'maintenance' | 'chatbotData'

type AppointmentQuestionnaire = {
  name?: string
  phone?: string
  email?: string
  age?: string
  allergies?: string
  megaHairHistory?: string
  hairType?: string
  hairColor?: string
  hairState?: string
  methods?: string
  primaryFlow?: string
  primaryCategory?: string
  maintenanceType?: string
  maintenanceBasePrice?: string
  hairSituation?: string
  additionalServices?: string
  maintenanceKit?: string
  cleanHairObservation?: string
}

type AppointmentMaintenanceEntry = {
  id: string
  date: string
  notes: string
  createdAt: string
}

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
  questionnaireData?: AppointmentQuestionnaire | null
  beforeImageUrl?: string | null
  afterImageUrl?: string | null
  maintenanceHistory?: AppointmentMaintenanceEntry[]
}

type AppointmentUpdate = {
  status: AppointmentStatus
  notes: string
  beforeImageUrl: string
  afterImageUrl: string
  questionnaireData: AppointmentQuestionnaire
  maintenanceHistory: AppointmentMaintenanceEntry[]
  maintenanceDate: string
  maintenanceNotes: string
  activeTab: AdminTab
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

const emptyQuestionnaire: AppointmentQuestionnaire = {
  name: '',
  phone: '',
  email: '',
  age: '',
  allergies: '',
  megaHairHistory: '',
  hairType: '',
  hairColor: '',
  hairState: '',
  methods: '',
  primaryFlow: '',
  primaryCategory: '',
  maintenanceType: '',
  maintenanceBasePrice: '',
  hairSituation: '',
  additionalServices: '',
  maintenanceKit: '',
  cleanHairObservation: '',
}

function normalizeQuestionnaireData(
  value?: AppointmentQuestionnaire | null
): AppointmentQuestionnaire {
  return {
    ...emptyQuestionnaire,
    ...(value || {}),
  }
}

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | AppointmentStatus>('all')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [updates, setUpdates] = useState<Record<string, AppointmentUpdate>>({})

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
    void fetchAppointments()
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

  const getUpdate = (appointment: Appointment): AppointmentUpdate =>
    updates[appointment.id] || {
      status: appointment.status,
      notes: appointment.notes || '',
      beforeImageUrl: appointment.beforeImageUrl || '',
      afterImageUrl: appointment.afterImageUrl || '',
      questionnaireData: normalizeQuestionnaireData(appointment.questionnaireData),
      maintenanceHistory: appointment.maintenanceHistory || [],
      maintenanceDate: '',
      maintenanceNotes: '',
      activeTab: 'general',
    }

  const updateDraft = (
    appointmentId: string,
    updater: (current: AppointmentUpdate) => AppointmentUpdate
  ) => {
    setUpdates((prev) => {
      const appointment = appointments.find((item) => item.id === appointmentId)
      if (!appointment) return prev
      const current = prev[appointmentId] || getUpdate(appointment)
      return {
        ...prev,
        [appointmentId]: updater(current),
      }
    })
  }

  const addMaintenance = (appointment: Appointment) => {
    const current = getUpdate(appointment)
    if (!current.maintenanceDate) {
      toast({
        title: 'Informe a data da manutencao',
        variant: 'destructive',
      })
      return
    }

    const newEntry: AppointmentMaintenanceEntry = {
      id: `mnt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      date: new Date(current.maintenanceDate).toISOString(),
      notes: current.maintenanceNotes || '',
      createdAt: new Date().toISOString(),
    }

    updateDraft(appointment.id, (draft) => ({
      ...draft,
      maintenanceHistory: [newEntry, ...(draft.maintenanceHistory || [])],
      maintenanceDate: '',
      maintenanceNotes: '',
    }))
  }

  const removeMaintenance = (appointment: Appointment, maintenanceId: string) => {
    updateDraft(appointment.id, (draft) => ({
      ...draft,
      maintenanceHistory: (draft.maintenanceHistory || []).filter(
        (item) => item.id !== maintenanceId
      ),
    }))
  }

  const saveAppointment = async (appointment: Appointment) => {
    const payload = getUpdate(appointment)
    setSavingId(appointment.id)
    try {
      const response = await fetch(`/api/admin/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: payload.status,
          notes: payload.notes,
          beforeImageUrl: payload.beforeImageUrl || null,
          afterImageUrl: payload.afterImageUrl || null,
          questionnaireData: payload.questionnaireData,
          maintenanceHistory: payload.maintenanceHistory,
        }),
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

  const renderGeneralTab = (appointment: Appointment, update: AppointmentUpdate) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-2">Status</label>
          <select
            value={update.status}
            onChange={(event) =>
              updateDraft(appointment.id, (draft) => ({
                ...draft,
                status: event.target.value as AppointmentStatus,
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
            updateDraft(appointment.id, (draft) => ({
              ...draft,
              notes: event.target.value,
            }))
          }
          className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
        />
      </div>
    </div>
  )

  const renderBeforeAfterTab = (appointment: Appointment, update: AppointmentUpdate) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-xs font-semibold">Imagem antes (URL)</label>
          <input
            value={update.beforeImageUrl}
            onChange={(event) =>
              updateDraft(appointment.id, (draft) => ({
                ...draft,
                beforeImageUrl: event.target.value,
              }))
            }
            placeholder="https://..."
            className="w-full px-3 py-2 border border-pink-200 rounded-lg"
          />
          {update.beforeImageUrl ? (
            <img
              src={update.beforeImageUrl}
              alt="Antes"
              className="w-full h-40 object-cover rounded-lg border border-pink-100"
            />
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-semibold">Imagem depois (URL)</label>
          <input
            value={update.afterImageUrl}
            onChange={(event) =>
              updateDraft(appointment.id, (draft) => ({
                ...draft,
                afterImageUrl: event.target.value,
              }))
            }
            placeholder="https://..."
            className="w-full px-3 py-2 border border-pink-200 rounded-lg"
          />
          {update.afterImageUrl ? (
            <img
              src={update.afterImageUrl}
              alt="Depois"
              className="w-full h-40 object-cover rounded-lg border border-pink-100"
            />
          ) : null}
        </div>
      </div>
    </div>
  )

  const renderMaintenanceTab = (appointment: Appointment, update: AppointmentUpdate) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr_auto] gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold mb-2">Data da manutencao</label>
          <input
            type="date"
            value={update.maintenanceDate}
            onChange={(event) =>
              updateDraft(appointment.id, (draft) => ({
                ...draft,
                maintenanceDate: event.target.value,
              }))
            }
            className="w-full px-3 py-2 border border-pink-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-2">Observacao</label>
          <input
            value={update.maintenanceNotes}
            onChange={(event) =>
              updateDraft(appointment.id, (draft) => ({
                ...draft,
                maintenanceNotes: event.target.value,
              }))
            }
            placeholder="Ex.: reposicao de pontos, hidratacao..."
            className="w-full px-3 py-2 border border-pink-200 rounded-lg"
          />
        </div>
        <button
          type="button"
          onClick={() => addMaintenance(appointment)}
          className="px-4 py-2 rounded-lg border border-pink-200 text-primary font-semibold"
        >
          Adicionar
        </button>
      </div>

      {(update.maintenanceHistory || []).length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma manutencao registrada.</p>
      ) : (
        <div className="space-y-2">
          {(update.maintenanceHistory || []).map((maintenance) => (
            <div
              key={maintenance.id}
              className="rounded-lg border border-pink-100 bg-pink-50/40 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            >
              <div>
                <p className="text-sm font-semibold">
                  {new Date(maintenance.date).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {maintenance.notes || 'Sem observacoes'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeMaintenance(appointment, maintenance.id)}
                className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderChatbotDataTab = (appointment: Appointment, update: AppointmentUpdate) => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Dados preenchidos no chatbot para historico tecnico do atendimento.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(
          [
            ['name', 'Nome'],
            ['phone', 'Telefone'],
            ['email', 'E-mail'],
            ['age', 'Idade'],
            ['allergies', 'Alergias'],
            ['megaHairHistory', 'Historico Mega Hair'],
            ['hairType', 'Tipo de cabelo'],
            ['hairColor', 'Cor do cabelo'],
            ['hairState', 'Estado do cabelo'],
            ['methods', 'Metodos usados'],
            ['primaryCategory', 'Categoria principal'],
            ['maintenanceType', 'Tipo de manutencao'],
            ['maintenanceBasePrice', 'Valor base manutencao'],
            ['hairSituation', 'Situacao do cabelo'],
            ['additionalServices', 'Servicos adicionais'],
            ['maintenanceKit', 'Kit de manutencao'],
            ['cleanHairObservation', 'Observacao cabelo limpo'],
          ] as Array<[keyof AppointmentQuestionnaire, string]>
        ).map(([field, label]) => (
          <div key={field}>
            <label className="block text-xs font-semibold mb-2">{label}</label>
            <input
              value={String(update.questionnaireData[field] || '')}
              onChange={(event) =>
                updateDraft(appointment.id, (draft) => ({
                  ...draft,
                  questionnaireData: {
                    ...draft.questionnaireData,
                    [field]: event.target.value,
                  },
                }))
              }
              className="w-full px-3 py-2 border border-pink-200 rounded-lg"
            />
          </div>
        ))}
      </div>
    </div>
  )

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

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              updateDraft(appointment.id, (draft) => ({ ...draft, activeTab: 'general' }))
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              update.activeTab === 'general'
                ? 'bg-primary text-white'
                : 'border border-pink-200 text-primary'
            }`}
          >
            Geral
          </button>
          <button
            type="button"
            onClick={() =>
              updateDraft(appointment.id, (draft) => ({
                ...draft,
                activeTab: 'beforeAfter',
              }))
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              update.activeTab === 'beforeAfter'
                ? 'bg-primary text-white'
                : 'border border-pink-200 text-primary'
            }`}
          >
            Antes/Depois
          </button>
          <button
            type="button"
            onClick={() =>
              updateDraft(appointment.id, (draft) => ({
                ...draft,
                activeTab: 'maintenance',
              }))
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              update.activeTab === 'maintenance'
                ? 'bg-primary text-white'
                : 'border border-pink-200 text-primary'
            }`}
          >
            Manutencoes
          </button>
          <button
            type="button"
            onClick={() =>
              updateDraft(appointment.id, (draft) => ({
                ...draft,
                activeTab: 'chatbotData',
              }))
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              update.activeTab === 'chatbotData'
                ? 'bg-primary text-white'
                : 'border border-pink-200 text-primary'
            }`}
          >
            Dados do Chatbot
          </button>
        </div>

        {update.activeTab === 'general' && renderGeneralTab(appointment, update)}
        {update.activeTab === 'beforeAfter' && renderBeforeAfterTab(appointment, update)}
        {update.activeTab === 'maintenance' && renderMaintenanceTab(appointment, update)}
        {update.activeTab === 'chatbotData' && renderChatbotDataTab(appointment, update)}

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
              Historico completo do atendimento, antes/depois e manutencoes.
            </p>
          </div>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as 'all' | AppointmentStatus)}
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
              <p className="text-sm text-muted-foreground">Nenhum agendamento futuro.</p>
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
