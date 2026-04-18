'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, ImagePlus, Lock, Save, Scissors, Upload } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

type DonationHairStatus =
  | 'available'
  | 'awaiting_payment'
  | 'paid'
  | 'reserved'
  | 'unavailable'

type DonationHairOption = {
  id: string
  name: string
  description: string
  color: string
  length: string
  observations: string
  imageUrl: string
  status: DonationHairStatus
  appointmentId?: string | null
  customerName?: string | null
  customerEmail?: string | null
  scheduledAt?: string | null
  paidAt?: string | null
  pendingPaymentExpiresAt?: string | null
  order: number
  active: boolean
}

type DonationScheduleSlot = {
  id: string
  date: string
  start: string
  end: string
  active: boolean
  notes?: string
}

type DonationCampaign = {
  active: boolean
  openingAt: string
  closingAt: string
  nextOpeningAt: string
  status: 'inactive' | 'scheduled' | 'open' | 'sold_out' | 'closed'
  statusLabel: string
  availableCount: number
  totalActiveHairOptions: number
  countdownTarget: string
  isOpen: boolean
  texts: {
    countdownTitle: string
    countdownDescription: string
    openTitle: string
    openDescription: string
    soldOutTitle: string
    soldOutDescription: string
    paymentNotice: string
  }
  hairOptions: DonationHairOption[]
  scheduleSlots: DonationScheduleSlot[]
}

const statusOptions: Array<{ value: DonationHairStatus; label: string }> = [
  { value: 'available', label: 'Disponível' },
  { value: 'awaiting_payment', label: 'Aguardando pagamento' },
  { value: 'paid', label: 'Pago/reservado' },
  { value: 'reserved', label: 'Reservado' },
  { value: 'unavailable', label: 'Indisponível' },
]

function toDateTimeInput(value: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

function fromDateTimeInput(value: string) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toISOString()
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Nao informado'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('pt-BR')
}

export default function AdminDonationCampaign() {
  const [campaign, setCampaign] = useState<DonationCampaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingHairId, setUploadingHairId] = useState<string | null>(null)

  const sortedHairOptions = useMemo(
    () => [...(campaign?.hairOptions || [])].sort((a, b) => a.order - b.order),
    [campaign?.hairOptions]
  )

  const sortedSlots = useMemo(
    () => [...(campaign?.scheduleSlots || [])].sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`)),
    [campaign?.scheduleSlots]
  )

  const loadCampaign = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/donation-campaign', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Erro ao carregar campanha')
      setCampaign(data.campaign || null)
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar doacao',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCampaign()
  }, [])

  const updateCampaign = (updater: (current: DonationCampaign) => DonationCampaign) => {
    setCampaign((current) => (current ? updater(current) : current))
  }

  const updateText = (field: keyof DonationCampaign['texts'], value: string) => {
    updateCampaign((current) => ({
      ...current,
      texts: { ...current.texts, [field]: value },
    }))
  }

  const updateHair = (id: string, patch: Partial<DonationHairOption>) => {
    updateCampaign((current) => ({
      ...current,
      hairOptions: current.hairOptions.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }))
  }

  const updateSlot = (id: string, patch: Partial<DonationScheduleSlot>) => {
    updateCampaign((current) => ({
      ...current,
      scheduleSlots: current.scheduleSlots.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }))
  }

  const addSlot = () => {
    updateCampaign((current) => ({
      ...current,
      scheduleSlots: [
        ...current.scheduleSlots,
        {
          id: `slot_${Date.now()}`,
          date: current.openingAt.slice(0, 10) || new Date().toISOString().slice(0, 10),
          start: '09:00',
          end: '11:30',
          active: true,
          notes: '',
        },
      ],
    }))
  }

  const removeSlot = (id: string) => {
    if (!confirm('Remover este horario da campanha de doacao?')) return
    updateCampaign((current) => ({
      ...current,
      scheduleSlots: current.scheduleSlots.filter((item) => item.id !== id),
    }))
  }

  const uploadHairImage = async (hairId: string, file: File | null) => {
    if (!file) return
    setUploadingHairId(hairId)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Erro ao enviar imagem')
      updateHair(hairId, { imageUrl: data.url || data.asset?.url || '' })
      toast({ title: 'Imagem enviada', description: 'A imagem foi vinculada ao cabelo.' })
    } catch (error: any) {
      toast({
        title: 'Erro no upload',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setUploadingHairId(null)
    }
  }

  const saveCampaign = async () => {
    if (!campaign) return
    setSaving(true)
    try {
      const response = await fetch('/api/admin/donation-campaign', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Erro ao salvar campanha')
      setCampaign(data.campaign || campaign)
      toast({ title: 'Campanha salva', description: 'As regras da doacao foram atualizadas.' })
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar campanha',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="rounded-2xl bg-white/80 p-6 text-slate-600">Carregando campanha de doacao...</div>
  }

  if (!campaign) {
    return <div className="rounded-2xl bg-white/80 p-6 text-red-700">Nao foi possivel carregar a campanha.</div>
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-[0_18px_40px_-28px_rgba(31,41,55,0.6)] md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Promocao
            </p>
            <h1 className="font-display text-2xl font-bold text-slate-900">
              Doacao de Cabelo
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Controle a abertura da campanha, os 3 cabelos disponiveis, horarios permitidos e o bloqueio apos pagamento aprovado.
            </p>
          </div>
          <button
            type="button"
            onClick={saveCampaign}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3347d7] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#2638b5] disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar campanha'}
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-[#edf2ff] p-4 text-[#2536a0]">
            <p className="text-xs font-bold uppercase tracking-[0.16em]">Status</p>
            <p className="mt-1 text-xl font-black">{campaign.statusLabel}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700">
            <p className="text-xs font-bold uppercase tracking-[0.16em]">Disponiveis</p>
            <p className="mt-1 text-xl font-black">{campaign.availableCount}/{campaign.totalActiveHairOptions}</p>
          </div>
          <div className="rounded-2xl bg-amber-50 p-4 text-amber-700">
            <p className="text-xs font-bold uppercase tracking-[0.16em]">Abertura</p>
            <p className="mt-1 text-sm font-bold">{formatDateTime(campaign.openingAt)}</p>
          </div>
          <div className="rounded-2xl bg-slate-100 p-4 text-slate-700">
            <p className="text-xs font-bold uppercase tracking-[0.16em]">Proxima</p>
            <p className="mt-1 text-sm font-bold">{formatDateTime(campaign.nextOpeningAt)}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-[0_18px_40px_-28px_rgba(31,41,55,0.6)]">
            <div className="mb-4 flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-[#3347d7]" />
              <h2 className="font-display text-xl font-bold text-slate-900">Abertura e textos</h2>
            </div>
            <label className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={campaign.active}
                onChange={(event) => updateCampaign((current) => ({ ...current, active: event.target.checked }))}
              />
              Campanha ativa
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Abertura
                <input
                  type="datetime-local"
                  value={toDateTimeInput(campaign.openingAt)}
                  onChange={(event) => updateCampaign((current) => ({ ...current, openingAt: fromDateTimeInput(event.target.value) }))}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Encerramento
                <input
                  type="datetime-local"
                  value={toDateTimeInput(campaign.closingAt)}
                  onChange={(event) => updateCampaign((current) => ({ ...current, closingAt: fromDateTimeInput(event.target.value) }))}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                Proxima abertura
                <input
                  type="datetime-local"
                  value={toDateTimeInput(campaign.nextOpeningAt)}
                  onChange={(event) => updateCampaign((current) => ({ ...current, nextOpeningAt: fromDateTimeInput(event.target.value) }))}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
            </div>
            <div className="mt-5 grid gap-3">
              {(
                [
                  ['countdownTitle', 'Titulo do contador'],
                  ['countdownDescription', 'Descricao do contador'],
                  ['openTitle', 'Titulo da campanha aberta'],
                  ['openDescription', 'Descricao da campanha aberta'],
                  ['soldOutTitle', 'Titulo da campanha esgotada'],
                  ['soldOutDescription', 'Descricao da campanha esgotada'],
                  ['paymentNotice', 'Aviso de pagamento'],
                ] as Array<[keyof DonationCampaign['texts'], string]>
              ).map(([field, label]) => (
                <label key={field} className="text-sm font-semibold text-slate-700">
                  {label}
                  <textarea
                    value={campaign.texts[field]}
                    onChange={(event) => updateText(field, event.target.value)}
                    rows={field.includes('Description') || field === 'paymentNotice' ? 3 : 2}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-[0_18px_40px_-28px_rgba(31,41,55,0.6)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Scissors className="h-5 w-5 text-[#3347d7]" />
                <h2 className="font-display text-xl font-bold text-slate-900">Horarios permitidos</h2>
              </div>
              <button
                type="button"
                onClick={addSlot}
                className="rounded-lg border border-[#3347d7] px-3 py-2 text-sm font-bold text-[#3347d7]"
              >
                Adicionar horario
              </button>
            </div>
            <div className="space-y-3">
              {sortedSlots.map((slot) => (
                <div key={slot.id} className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-[1fr_0.8fr_0.8fr_1fr_auto] md:items-end">
                  <label className="text-xs font-semibold text-slate-600">
                    Data
                    <input
                      type="date"
                      value={slot.date}
                      onChange={(event) => updateSlot(slot.id, { date: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    Inicio
                    <input
                      type="time"
                      value={slot.start}
                      onChange={(event) => updateSlot(slot.id, { start: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    Fim
                    <input
                      type="time"
                      value={slot.end}
                      onChange={(event) => updateSlot(slot.id, { end: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    Observacao
                    <input
                      value={slot.notes || ''}
                      onChange={(event) => updateSlot(slot.id, { notes: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    />
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <input
                        type="checkbox"
                        checked={slot.active}
                        onChange={(event) => updateSlot(slot.id, { active: event.target.checked })}
                      />
                      Ativo
                    </label>
                    <button
                      type="button"
                      onClick={() => removeSlot(slot.id)}
                      className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-[0_18px_40px_-28px_rgba(31,41,55,0.6)]">
          <div className="mb-4 flex items-center gap-2">
            <ImagePlus className="h-5 w-5 text-[#3347d7]" />
            <h2 className="font-display text-xl font-bold text-slate-900">3 opcoes de cabelo</h2>
          </div>
          <div className="space-y-4">
            {sortedHairOptions.slice(0, 3).map((hair, index) => (
              <article key={hair.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-4 flex flex-col gap-4 md:flex-row">
                  <div className={`h-40 w-full overflow-hidden rounded-2xl bg-slate-100 md:w-48 ${hair.status === 'available' ? '' : 'grayscale opacity-70'}`}>
                    {hair.imageUrl ? (
                      <img src={hair.imageUrl} alt={hair.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">Sem imagem</div>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Cabelo {index + 1}</p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                        {hair.status !== 'available' ? <Lock className="h-3 w-3" /> : null}
                        {statusOptions.find((item) => item.value === hair.status)?.label || hair.status}
                      </span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="text-xs font-semibold text-slate-600">
                        Nome
                        <input
                          value={hair.name}
                          onChange={(event) => updateHair(hair.id, { name: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                        />
                      </label>
                      <label className="text-xs font-semibold text-slate-600">
                        Status
                        <select
                          value={hair.status}
                          onChange={(event) => updateHair(hair.id, { status: event.target.value as DonationHairStatus })}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                        >
                          {statusOptions.map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs font-semibold text-slate-600">
                        Cor
                        <input
                          value={hair.color}
                          onChange={(event) => updateHair(hair.id, { color: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                        />
                      </label>
                      <label className="text-xs font-semibold text-slate-600">
                        Comprimento
                        <input
                          value={hair.length}
                          onChange={(event) => updateHair(hair.id, { length: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3">
                  <label className="text-xs font-semibold text-slate-600">
                    Descricao
                    <textarea
                      value={hair.description}
                      onChange={(event) => updateHair(hair.id, { description: event.target.value })}
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    Observacoes
                    <textarea
                      value={hair.observations}
                      onChange={(event) => updateHair(hair.id, { observations: event.target.value })}
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    />
                  </label>
                  <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                    <label className="text-xs font-semibold text-slate-600">
                      URL da imagem ou upload
                      <input
                        value={hair.imageUrl}
                        onChange={(event) => updateHair(hair.id, { imageUrl: event.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                      />
                    </label>
                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#3347d7] px-4 py-2 text-sm font-bold text-[#3347d7]">
                      <Upload className="h-4 w-4" />
                      {uploadingHairId === hair.id ? 'Enviando...' : 'Upload'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(event) => void uploadHairImage(hair.id, event.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                  <div className="grid gap-1 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                    <span><strong>Reservado por:</strong> {hair.customerName || 'Nenhum'}</span>
                    <span><strong>Email:</strong> {hair.customerEmail || 'Nao informado'}</span>
                    <span><strong>Agendamento:</strong> {formatDateTime(hair.scheduledAt)}</span>
                    <span><strong>Pago em:</strong> {formatDateTime(hair.paidAt)}</span>
                    <span><strong>Appointment ID:</strong> {hair.appointmentId || 'Nao vinculado'}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
