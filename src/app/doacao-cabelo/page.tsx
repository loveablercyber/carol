'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gift,
  Heart,
  Lock,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react'
import Chatbot from '@/components/chatbot/Chatbot'
import UniqueVisitCounter from '@/components/UniqueVisitCounter'

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
  order: number
  active: boolean
}

type DonationCampaign = {
  active: boolean
  openingAt: string
  closingAt: string
  nextOpeningAt: string
  countdownTarget: string
  status: 'inactive' | 'scheduled' | 'open' | 'sold_out' | 'closed'
  statusLabel: string
  now: string
  availableCount: number
  totalActiveHairOptions: number
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
}

type DonationTechnique = {
  technique: string
  price: number
  durationMinutes: number
  description: string
}

type SelectedDonationFlow = DonationTechnique & {
  hair: DonationHairOption
}

const techniques: DonationTechnique[] = [
  {
    technique: 'Fita Adesiva',
    price: 150,
    durationMinutes: 120,
    description: 'Aplicação completa com fita adesiva pelo valor simbólico da campanha.',
  },
  {
    technique: 'Ponto Americano',
    price: 100,
    durationMinutes: 150,
    description: 'Aplicação no ponto americano com pagamento antecipado do valor total.',
  },
]

const statusLabel: Record<DonationHairStatus, string> = {
  available: 'Disponível',
  awaiting_payment: 'Aguardando pagamento',
  paid: 'Pago/reservado',
  reserved: 'Reservado',
  unavailable: 'Indisponível',
}

const campaignBenefits = [
  'Você não recebe qualquer cabelo',
  'Escolhe entre as opções disponíveis',
  'Encaixe de cor mais adequado',
  'Quantidade ideal para transformar seu visual',
]

function formatCountdown(targetIso: string) {
  const target = new Date(targetIso).getTime()
  if (!targetIso || Number.isNaN(target)) {
    return { days: 0, hours: 0, minutes: 0, totalMinutes: 0 }
  }
  const now = Date.now()
  const diff = Math.max(0, target - now)
  const totalMinutes = Math.floor(diff / 60000)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes - days * 60 * 24) / 60)
  const minutes = totalMinutes % 60

  return { days, hours, minutes, totalMinutes }
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data a definir'
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function campaignAvailabilityText(campaign: DonationCampaign | null) {
  if (!campaign) return 'Carregando status da campanha'
  if (campaign.status === 'open') return 'Campanha aberta'
  if (campaign.status === 'sold_out') return 'Campanha esgotada'
  if (campaign.status === 'closed') return 'Campanha encerrada'
  if (campaign.status === 'inactive') return 'Campanha pausada'
  return 'Abertura em breve'
}

function CountdownBlock({
  campaign,
  countdown,
}: {
  campaign: DonationCampaign | null
  countdown: ReturnType<typeof formatCountdown>
}) {
  const isSoldOut = campaign?.status === 'sold_out'
  const title = campaign
    ? isSoldOut
      ? campaign.texts.soldOutTitle
      : campaign.texts.countdownTitle
    : 'Abertura da agenda em breve'
  const description = campaign
    ? isSoldOut
      ? campaign.texts.soldOutDescription
      : campaign.texts.countdownDescription
    : 'Aguarde o carregamento das informações da campanha.'

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[#e7c57a]/35 bg-[#fff8e9]/95 p-5 text-[#2b170b] shadow-[0_24px_70px_-40px_rgba(32,18,8,0.7)] md:p-7">
      <div className="absolute -right-16 -top-20 h-44 w-44 rounded-full bg-[#d99b41]/20 blur-2xl" />
      <div className="absolute -bottom-20 left-8 h-40 w-40 rounded-full bg-[#7b3514]/15 blur-2xl" />
      <div className="relative grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#3b1d0e] px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#f5d78b]">
            <Clock3 className="h-4 w-4" />
            Contador oficial
          </div>
          <h2 className="font-display text-2xl font-black leading-tight text-[#32180a] md:text-4xl">
            {title}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[#6d513a] md:text-base">
            {description}
          </p>
          <p className="mt-4 rounded-2xl border border-[#e5c77b]/60 bg-white/60 px-4 py-3 text-sm font-semibold text-[#654117]">
            A campanha será liberada no dia e horário definidos no painel admin. As opções já estão visíveis, mas permanecem bloqueadas até a abertura.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Dias', value: countdown.days },
            { label: 'Horas', value: countdown.hours },
            { label: 'Minutos', value: countdown.minutes },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[1.4rem] border border-[#e4c376]/60 bg-gradient-to-b from-[#3c1d0e] to-[#160905] px-3 py-5 text-[#f8df9d] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_18px_35px_-30px_rgba(0,0,0,0.9)] md:py-7"
            >
              <p className="font-display text-4xl font-black leading-none md:text-6xl">
                {String(item.value).padStart(2, '0')}
              </p>
              <p className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#d6b163] md:text-xs">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-5 flex flex-col gap-2 rounded-2xl border border-[#e5c77b]/50 bg-white/55 px-4 py-3 text-sm font-semibold text-[#61411d] md:flex-row md:items-center md:justify-between">
        <span>Próxima abertura: {formatDateTime(campaign?.countdownTarget || campaign?.openingAt || '')}</span>
        <span>{campaignAvailabilityText(campaign)}</span>
      </div>
    </section>
  )
}

function CampaignInfoBlock({ campaign }: { campaign: DonationCampaign | null }) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {[
        {
          icon: CalendarDays,
          title: 'Abertura controlada',
          text: campaign?.isOpen
            ? 'A campanha está aberta e os horários liberados aparecem no fluxo de agendamento.'
            : 'O agendamento só será liberado quando chegar a data e hora configuradas no painel admin.',
        },
        {
          icon: Lock,
          title: 'Cabelos bloqueados',
          text: 'As opções aparecem para consulta, mas ficam indisponíveis até a abertura oficial ou quando forem pagas/reservadas.',
        },
        {
          icon: ShieldCheck,
          title: 'Pagamento e confirmação',
          text: 'Após abrir, a cliente agenda, paga no painel e confirma presença pelo botão de confirmação do sistema.',
        },
      ].map((item) => {
        const Icon = item.icon
        return (
          <div
            key={item.title}
            className="rounded-[1.6rem] border border-white/10 bg-white/[0.08] p-5 text-[#f8ead0] shadow-[0_18px_55px_-45px_rgba(0,0,0,0.9)] backdrop-blur"
          >
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#f0c772] text-[#32180a]">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="font-display text-xl font-black text-white">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#dfc6a5]">{item.text}</p>
          </div>
        )
      })}
    </section>
  )
}

function HairOptionCard({
  hair,
  campaignOpen,
  onSelect,
}: {
  hair: DonationHairOption
  campaignOpen: boolean
  onSelect: (hair: DonationHairOption, technique: DonationTechnique) => void
}) {
  const available = campaignOpen && hair.status === 'available'
  const displayStatus = available ? 'Disponível' : campaignOpen ? statusLabel[hair.status] : 'Aguardando abertura'

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-[#e8d0a3]/70 bg-[#fffaf0] text-[#2a160b] shadow-[0_30px_70px_-48px_rgba(0,0,0,0.85)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_36px_80px_-46px_rgba(0,0,0,0.95)]">
      <div className="relative h-72 overflow-hidden bg-[#2d1609] md:h-80">
        {hair.imageUrl ? (
          <img
            src={hair.imageUrl}
            alt={hair.name}
            className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
              available ? '' : 'saturate-[0.45] brightness-[0.78]'
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[#f0d7a8]">
            Sem imagem cadastrada
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f0f06]/85 via-transparent to-[#1f0f06]/10" />
        {!available ? <div className="absolute inset-0 bg-[#2b1a0d]/18" /> : null}
        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#f6d98e] backdrop-blur">
          {!available ? <Lock className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
          {displayStatus}
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#e9c56d]">
            Opção da campanha
          </p>
          <h3 className="mt-1 font-display text-3xl font-black leading-tight text-white">
            {hair.name}
          </h3>
        </div>
      </div>

      <div className="space-y-5 p-5 md:p-6">
        <p className="min-h-[3.5rem] text-sm leading-6 text-[#6d523d]">
          {hair.description || 'Cabelo cadastrado para a campanha de doação com aplicação completa.'}
        </p>

        <div className="grid gap-2 rounded-[1.25rem] border border-[#ead5aa] bg-white/70 p-4 text-sm text-[#59402c]">
          <span>
            <strong className="text-[#2f180a]">Cor:</strong> {hair.color || 'A definir'}
          </span>
          <span>
            <strong className="text-[#2f180a]">Comprimento:</strong> {hair.length || 'A definir'}
          </span>
          {hair.observations ? (
            <span>
              <strong className="text-[#2f180a]">Obs.:</strong> {hair.observations}
            </span>
          ) : null}
        </div>

        <div className="grid gap-2">
          {techniques.map((technique) => (
            <button
              key={`${hair.id}_${technique.technique}`}
              type="button"
              disabled={!available}
              onClick={() => onSelect(hair, technique)}
              className={`rounded-[1.15rem] px-4 py-3 text-left transition ${
                available
                  ? 'bg-gradient-to-r from-[#9a4c1d] via-[#c17a32] to-[#e1b65c] text-white shadow-[0_16px_35px_-24px_rgba(92,42,12,0.9)] hover:shadow-[0_20px_45px_-22px_rgba(92,42,12,1)]'
                  : 'cursor-not-allowed border border-[#ead9b7] bg-[#e9dfcf] text-[#7b6b5a]'
              }`}
            >
              <span className="flex items-center justify-between gap-4 text-sm font-black">
                <span>{technique.technique}</span>
                <span>R$ {technique.price}</span>
              </span>
              <span className="mt-1 block text-xs font-medium opacity-85">
                {available ? technique.description : 'Indisponível no momento'}
              </span>
            </button>
          ))}
        </div>

        <div
          className={`flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-black uppercase tracking-[0.14em] ${
            available
              ? 'bg-[#2b160b] text-[#f5d78b]'
              : 'bg-[#b5a895] text-white'
          }`}
        >
          {available ? (
            <>
              Agendar agora
              <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              Aguardando abertura
            </>
          )}
        </div>
      </div>
    </article>
  )
}

function DesktopCountdownPanel({
  campaign,
  countdown,
}: {
  campaign: DonationCampaign | null
  countdown: ReturnType<typeof formatCountdown>
}) {
  return (
    <section className="overflow-hidden rounded-[2.5rem] border border-[#e7c57a]/25 bg-[#fff8e9] text-[#2b170b] shadow-[0_34px_110px_-70px_rgba(0,0,0,0.95)]">
      <div className="grid grid-cols-[0.95fr_1.05fr]">
        <div className="relative overflow-hidden bg-[#2a1208] p-9 text-[#f7e6c0]">
          <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-[#d99b41]/25 blur-3xl" />
          <div className="absolute -bottom-28 right-0 h-64 w-64 rounded-full bg-[#8c4119]/35 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f0c772]/30 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-[#f0c772]">
              <Clock3 className="h-4 w-4" />
              Contador oficial
            </div>
            <h2 className="mt-8 font-display text-5xl font-black leading-[0.95] tracking-[-0.04em] text-[#fff4d6]">
              Abertura da campanha controlada pelo painel
            </h2>
            <p className="mt-5 max-w-md text-base leading-8 text-[#e7cda8]">
              As opções já podem ser consultadas, mas o agendamento fica bloqueado até a data e horário definidos no admin.
            </p>
            <div className="mt-8 rounded-[1.5rem] border border-[#f0c772]/25 bg-white/10 p-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f0c772]">
                Próxima abertura
              </p>
              <p className="mt-2 text-lg font-black text-white">
                {formatDateTime(campaign?.countdownTarget || campaign?.openingAt || '')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-9">
          <div className="grid h-full grid-cols-3 gap-4">
            {[
              { label: 'Dias', value: countdown.days },
              { label: 'Horas', value: countdown.hours },
              { label: 'Minutos', value: countdown.minutes },
            ].map((item) => (
              <div
                key={item.label}
                className="flex min-h-[260px] flex-col justify-center rounded-[2rem] border border-[#e2c06d]/55 bg-gradient-to-b from-white to-[#f6ead2] p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_28px_70px_-55px_rgba(67,33,12,0.8)]"
              >
                <p className="font-display text-7xl font-black leading-none tracking-[-0.05em] text-[#35190a]">
                  {String(item.value).padStart(2, '0')}
                </p>
                <p className="mt-4 text-xs font-black uppercase tracking-[0.28em] text-[#a36a22]">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function DesktopHairOptionCard({
  hair,
  campaignOpen,
  onSelect,
}: {
  hair: DonationHairOption
  campaignOpen: boolean
  onSelect: (hair: DonationHairOption, technique: DonationTechnique) => void
}) {
  const available = campaignOpen && hair.status === 'available'
  const displayStatus = available ? 'Disponível' : campaignOpen ? statusLabel[hair.status] : 'Aguardando abertura'

  return (
    <article className="group grid min-h-[560px] grid-rows-[300px_1fr] overflow-hidden rounded-[2.35rem] border border-[#ead3a2]/70 bg-[#fffaf0] text-[#2a160b] shadow-[0_34px_90px_-62px_rgba(0,0,0,0.95)] transition duration-300 hover:-translate-y-1">
      <div className="relative overflow-hidden bg-[#2d1609]">
        {hair.imageUrl ? (
          <img
            src={hair.imageUrl}
            alt={hair.name}
            className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
              available ? '' : 'saturate-[0.4] brightness-[0.75]'
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[#f0d7a8]">
            Sem imagem cadastrada
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1c0b04]/90 via-transparent to-[#1c0b04]/10" />
        {!available ? <div className="absolute inset-0 bg-[#211207]/22" /> : null}
        <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/50 px-4 py-2 text-[0.68rem] font-black uppercase tracking-[0.22em] text-[#f6d98e] backdrop-blur">
          {!available ? <Lock className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
          {displayStatus}
        </div>
        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.26em] text-[#f0c772]">
            Opção exclusiva
          </p>
          <h3 className="mt-2 font-display text-4xl font-black leading-none text-white">
            {hair.name}
          </h3>
        </div>
      </div>

      <div className="flex flex-col p-6">
        <p className="text-sm leading-7 text-[#6d523d]">
          {hair.description || 'Cabelo cadastrado para a campanha de doação com aplicação completa.'}
        </p>

        <div className="mt-5 grid gap-3 rounded-[1.4rem] border border-[#ead5aa] bg-white/75 p-4 text-sm text-[#59402c]">
          <span>
            <strong className="text-[#2f180a]">Cor:</strong> {hair.color || 'A definir'}
          </span>
          <span>
            <strong className="text-[#2f180a]">Comprimento:</strong> {hair.length || 'A definir'}
          </span>
          {hair.observations ? (
            <span>
              <strong className="text-[#2f180a]">Obs.:</strong> {hair.observations}
            </span>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3">
          {techniques.map((technique) => (
            <button
              key={`${hair.id}_${technique.technique}`}
              type="button"
              disabled={!available}
              onClick={() => onSelect(hair, technique)}
              className={`rounded-[1.2rem] px-4 py-3 text-left transition ${
                available
                  ? 'bg-gradient-to-r from-[#8f4219] via-[#bd722e] to-[#e0b55e] text-white shadow-[0_18px_42px_-30px_rgba(92,42,12,0.95)] hover:shadow-[0_20px_48px_-28px_rgba(92,42,12,1)]'
                  : 'cursor-not-allowed border border-[#ead9b7] bg-[#e9dfcf] text-[#7b6b5a]'
              }`}
            >
              <span className="flex items-center justify-between gap-4 text-sm font-black">
                <span>{technique.technique}</span>
                <span>R$ {technique.price}</span>
              </span>
              <span className="mt-1 block text-xs font-medium opacity-85">
                {available ? technique.description : 'Indisponível no momento'}
              </span>
            </button>
          ))}
        </div>

        <div
          className={`mt-auto flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-black uppercase tracking-[0.16em] ${
            available ? 'bg-[#2b160b] text-[#f5d78b]' : 'bg-[#b5a895] text-white'
          }`}
        >
          {available ? (
            <>
              Agendar agora
              <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              Aguardando abertura
            </>
          )}
        </div>
      </div>
    </article>
  )
}

export default function HairDonationPage() {
  const [campaign, setCampaign] = useState<DonationCampaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selectedFlow, setSelectedFlow] = useState<SelectedDonationFlow | null>(null)
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const [countdownTick, setCountdownTick] = useState(0)

  const countdown = useMemo(
    () => formatCountdown(campaign?.countdownTarget || campaign?.openingAt || ''),
    [campaign?.countdownTarget, campaign?.openingAt, countdownTick]
  )

  const fetchCampaign = async () => {
    try {
      setLoadError('')
      const response = await fetch('/api/donation-campaign', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Erro ao carregar campanha')
      setCampaign(data.campaign || null)
    } catch (error: any) {
      setLoadError(error?.message || 'Erro ao carregar campanha')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchCampaign()
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdownTick((current) => current + 1)
    }, 30000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!campaign) return
    if (countdown.totalMinutes === 0 && campaign.status !== 'open') {
      void fetchCampaign()
    }
  }, [countdown.totalMinutes, campaign?.status])

  const activeHairOptions = (campaign?.hairOptions || [])
    .filter((item) => item.active)
    .sort((a, b) => a.order - b.order)
    .slice(0, 3)

  const openDonationFlow = (hair: DonationHairOption, technique: DonationTechnique) => {
    if (!campaign?.isOpen || hair.status !== 'available') return
    setSelectedFlow({ ...technique, hair })
    setIsChatbotOpen(true)
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#140906] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(214,151,63,0.38),transparent_28%),radial-gradient(circle_at_85%_12%,rgba(128,59,21,0.35),transparent_32%),linear-gradient(180deg,#211009_0%,#120704_48%,#090403_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:radial-gradient(circle_at_1px_1px,rgba(248,214,148,0.8)_1px,transparent_0)] [background-size:28px_28px]" />
      <div className="pointer-events-none absolute left-0 top-0 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-[#b76a2c]/25 blur-3xl" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#130805]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#f4dcae] transition hover:text-white">
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d7ac58]/35 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#f4d083]">
            <Gift className="h-4 w-4" />
            Campanha de doação
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-6 md:pb-20 md:pt-12 lg:hidden">
        <section className="grid min-h-[620px] gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div className="relative order-2 lg:order-1">
            <div className="absolute -left-8 -top-8 hidden h-40 w-40 rounded-full border border-[#e0b866]/30 lg:block" />
            <div className="relative overflow-hidden rounded-[2.5rem] border border-[#d8b064]/25 bg-[#2a1308] shadow-[0_40px_120px_-65px_rgba(0,0,0,0.95)]">
              <Image
                src="/images/carol.png"
                alt="Modelo com cabelo longo para campanha CarolSol"
                width={1000}
                height={1000}
                priority
                className="h-[520px] w-full object-cover object-[50%_18%] md:h-[660px] lg:h-[760px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#160704]/80 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 rounded-[1.5rem] border border-white/12 bg-black/35 p-4 backdrop-blur-md md:bottom-7 md:left-7 md:right-7 md:p-5">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f5cf7d]">
                  Aplicação completa
                </p>
                <p className="mt-1 text-sm leading-6 text-[#f6e8d0]">
                  Acompanhe o contador e escolha seu cabelo quando a campanha for liberada oficialmente.
                </p>
              </div>
            </div>
          </div>

          <div className="order-1 space-y-7 lg:order-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#f0c772] px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-[#2b160b] shadow-[0_18px_50px_-30px_rgba(240,199,114,0.9)]">
              <Star className="h-4 w-4 fill-current" />
              {campaignAvailabilityText(campaign)}
            </div>

            <div className="space-y-5">
              <h1 className="font-display text-5xl font-black leading-[0.95] tracking-[-0.05em] text-[#f7e3bd] md:text-7xl xl:text-8xl">
                Doação de cabelo com aplicação completa
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[#e7cda8] md:text-xl">
                Escolha uma das opções disponíveis, acompanhe a abertura da campanha e finalize o agendamento no momento liberado.
              </p>
            </div>

            <div className="grid gap-3 rounded-[1.75rem] border border-white/10 bg-white/[0.08] p-4 backdrop-blur-md md:grid-cols-2 md:p-5">
              {campaignBenefits.map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm font-semibold leading-6 text-[#f6e9d0]">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-[#f0c772]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {loading ? (
              <div className="rounded-[1.5rem] border border-[#e3bc6a]/25 bg-white/[0.08] p-5 text-[#f5dfb8]">
                Carregando status da campanha...
              </div>
            ) : loadError ? (
              <div className="rounded-[1.5rem] border border-red-300/35 bg-red-500/15 p-5 text-red-50">
                {loadError}
              </div>
            ) : null}
          </div>
        </section>

        <div className="mt-12 space-y-8 md:mt-16">
          <CountdownBlock campaign={campaign} countdown={countdown} />
          <CampaignInfoBlock campaign={campaign} />
        </div>

        <section className="mt-14 md:mt-20">
          <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d8b064]/35 bg-white/[0.08] px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#f4d083]">
                <Sparkles className="h-4 w-4" />
                Opções da campanha
              </div>
              <h2 className="font-display text-3xl font-black tracking-[-0.03em] text-[#f7e3bd] md:text-5xl">
                Cabelos disponíveis para consulta
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#d9bea0] md:text-base">
                As três opções já aparecem para você conhecer. Enquanto a campanha não abre, os cards ficam bloqueados de forma proposital.
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-[#d8b064]/30 bg-black/25 px-5 py-4 text-sm font-semibold text-[#f3d9a8] backdrop-blur">
              {campaign?.availableCount ?? 0} de {campaign?.totalActiveHairOptions ?? activeHairOptions.length} opções disponíveis
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {activeHairOptions.map((hair) => (
              <HairOptionCard
                key={hair.id}
                hair={hair}
                campaignOpen={Boolean(campaign?.isOpen)}
                onSelect={openDonationFlow}
              />
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-[#d8b064]/25 bg-white/[0.08] p-5 text-[#ead4b5] backdrop-blur md:p-7">
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f0c772]">
                Resumo da campanha
              </p>
              <p className="mt-2 text-sm leading-7 md:text-base">
                Campanha válida por tempo limitado para quem conseguir agendar primeiro. Acompanhe o contador regressivo e, quando abrir, escolha o cabelo, realize o pagamento e confirme o agendamento no painel do cliente.
              </p>
            </div>
            <div className="rounded-full border border-[#d8b064]/35 bg-[#f0c772] px-5 py-3 text-center text-sm font-black uppercase tracking-[0.18em] text-[#2b160b]">
              Pague e confirme
            </div>
          </div>
        </section>
      </div>

      <div className="relative z-10 hidden lg:block">
        <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-[1560px] grid-cols-[minmax(0,0.94fr)_minmax(540px,0.9fr)] gap-12 px-8 pb-20 pt-12 xl:gap-16 xl:px-12 2xl:px-16">
          <div className="flex flex-col justify-center">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#f0c772] px-5 py-2.5 text-xs font-black uppercase tracking-[0.28em] text-[#2b160b] shadow-[0_20px_55px_-36px_rgba(240,199,114,0.95)]">
                <Star className="h-4 w-4 fill-current" />
                {campaignAvailabilityText(campaign)}
              </div>

              <h1 className="mt-8 font-display text-[5.7rem] font-black leading-[0.89] tracking-[-0.07em] text-[#f7e3bd] xl:text-[7.1rem] 2xl:text-[8.2rem]">
                Doação de cabelo com aplicação completa
              </h1>

              <p className="mt-8 max-w-3xl text-xl leading-9 text-[#e7cda8] xl:text-2xl xl:leading-10">
                Escolha uma das opções disponíveis, acompanhe a abertura da campanha e finalize o agendamento no momento liberado.
              </p>

              <div className="mt-10 grid max-w-4xl grid-cols-2 gap-4">
                {campaignBenefits.map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.35rem] border border-white/10 bg-white/[0.075] p-5 text-[#f6e9d0] shadow-[0_18px_55px_-45px_rgba(0,0,0,0.9)] backdrop-blur"
                  >
                    <CheckCircle2 className="mb-4 h-6 w-6 text-[#f0c772]" />
                    <p className="text-base font-bold leading-7">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 grid max-w-4xl grid-cols-[1fr_auto] items-center gap-4 rounded-[1.65rem] border border-[#d8b064]/30 bg-black/25 p-5 text-[#f3d9a8] backdrop-blur">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f0c772]">
                    Status da campanha
                  </p>
                  <p className="mt-2 text-base font-semibold leading-7">
                    {campaign?.isOpen
                      ? 'A campanha está aberta e o agendamento segue o fluxo normal do sistema.'
                      : 'As opções estão visíveis para consulta, mas a escolha só libera na abertura configurada no admin.'}
                  </p>
                </div>
                <div className="rounded-full border border-[#d8b064]/35 bg-[#f0c772] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#2b160b]">
                  {campaign?.availableCount ?? 0} disponíveis
                </div>
              </div>

              {loading ? (
                <div className="mt-6 rounded-[1.5rem] border border-[#e3bc6a]/25 bg-white/[0.08] p-5 text-[#f5dfb8]">
                  Carregando status da campanha...
                </div>
              ) : loadError ? (
                <div className="mt-6 rounded-[1.5rem] border border-red-300/35 bg-red-500/15 p-5 text-red-50">
                  {loadError}
                </div>
              ) : null}
            </div>
          </div>

          <div className="relative flex items-center">
            <div className="absolute -right-10 top-12 h-72 w-72 rounded-full bg-[#e0ad4d]/20 blur-3xl" />
            <div className="absolute -bottom-8 -left-16 h-80 w-80 rounded-full bg-[#7b3514]/35 blur-3xl" />
            <div className="relative w-full overflow-hidden rounded-[3rem] border border-[#d8b064]/25 bg-[#2a1308] shadow-[0_50px_140px_-80px_rgba(0,0,0,1)]">
              <Image
                src="/images/carol.png"
                alt="Modelo com cabelo longo para campanha CarolSol"
                width={1120}
                height={1380}
                priority
                className="h-[78vh] min-h-[700px] w-full object-cover object-[50%_18%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#150603]/88 via-transparent to-transparent" />
              <div className="absolute left-8 right-8 top-8 flex items-center justify-between">
                <div className="rounded-full border border-white/15 bg-black/35 px-5 py-2.5 text-xs font-black uppercase tracking-[0.22em] text-[#f5cf7d] backdrop-blur">
                  Campanha especial
                </div>
                <div className="rounded-full bg-[#f0c772] px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-[#2b160b]">
                  Aplicação completa
                </div>
              </div>
              <div className="absolute bottom-8 left-8 right-8 grid grid-cols-[1fr_auto] items-end gap-6 rounded-[2rem] border border-white/12 bg-black/38 p-6 backdrop-blur-md">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f5cf7d]">
                    Próxima abertura
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {formatDateTime(campaign?.countdownTarget || campaign?.openingAt || '')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e7cda8]">
                    Opções ativas
                  </p>
                  <p className="mt-1 font-display text-5xl font-black leading-none text-[#f0c772]">
                    {campaign?.totalActiveHairOptions ?? activeHairOptions.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1560px] px-8 pb-20 xl:px-12 2xl:px-16">
          <DesktopCountdownPanel campaign={campaign} countdown={countdown} />
        </section>

        <section className="mx-auto grid max-w-[1560px] grid-cols-3 gap-6 px-8 pb-20 xl:px-12 2xl:px-16">
          {[
            {
              icon: CalendarDays,
              title: 'Abertura programada',
              text: campaign?.isOpen
                ? 'A campanha está aberta e os horários liberados aparecem no fluxo de agendamento.'
                : 'O agendamento só abre na data e hora configuradas no painel administrativo.',
            },
            {
              icon: Lock,
              title: 'Opções protegidas',
              text: 'Os cabelos continuam visíveis para consulta, mas ficam bloqueados enquanto a campanha não estiver aberta ou quando forem reservados.',
            },
            {
              icon: ShieldCheck,
              title: 'Pagamento e confirmação',
              text: 'Após abertura, a cliente escolhe o cabelo, agenda, paga no painel e confirma presença pelo botão atual do sistema.',
            },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="rounded-[2rem] border border-white/10 bg-white/[0.08] p-7 text-[#f8ead0] shadow-[0_24px_70px_-58px_rgba(0,0,0,0.95)] backdrop-blur"
              >
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#f0c772] text-[#32180a]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-2xl font-black text-white">{item.title}</h3>
                <p className="mt-3 text-base leading-8 text-[#dfc6a5]">{item.text}</p>
              </div>
            )
          })}
        </section>

        <section className="mx-auto max-w-[1560px] px-8 pb-20 xl:px-12 2xl:px-16">
          <div className="mb-10 grid grid-cols-[1fr_auto] items-end gap-8">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d8b064]/35 bg-white/[0.08] px-5 py-2.5 text-xs font-black uppercase tracking-[0.24em] text-[#f4d083]">
                <Sparkles className="h-4 w-4" />
                Opções da campanha
              </div>
              <h2 className="font-display text-6xl font-black leading-none tracking-[-0.055em] text-[#f7e3bd]">
                Escolha visual antes da abertura
              </h2>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-[#d9bea0]">
                As três opções já aparecem para consulta no desktop com mais destaque visual. A seleção continua bloqueada até a campanha abrir pelo painel admin.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-[#d8b064]/30 bg-black/25 px-6 py-5 text-right text-[#f3d9a8] backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f0c772]">
                Disponibilidade
              </p>
              <p className="mt-1 text-lg font-black">
                {campaign?.availableCount ?? 0} de {campaign?.totalActiveHairOptions ?? activeHairOptions.length}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-7">
            {activeHairOptions.map((hair) => (
              <DesktopHairOptionCard
                key={hair.id}
                hair={hair}
                campaignOpen={Boolean(campaign?.isOpen)}
                onSelect={openDonationFlow}
              />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1560px] px-8 pb-24 xl:px-12 2xl:px-16">
          <div className="overflow-hidden rounded-[2.5rem] border border-[#d8b064]/25 bg-white/[0.08] text-[#ead4b5] shadow-[0_34px_100px_-72px_rgba(0,0,0,1)] backdrop-blur">
            <div className="grid grid-cols-[1.2fr_0.8fr]">
              <div className="p-9">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f0c772]">
                  Resumo da campanha
                </p>
                <h3 className="mt-4 font-display text-4xl font-black leading-tight tracking-[-0.04em] text-white">
                  Acompanhe o contador, escolha quando abrir, pague e confirme no painel.
                </h3>
                <p className="mt-5 max-w-3xl text-base leading-8 text-[#dfc6a5]">
                  Campanha válida por tempo limitado para quem conseguir agendar primeiro. O fluxo de pagamento, confirmação e agenda continua usando as regras atuais do sistema.
                </p>
              </div>
              <div className="flex items-center justify-center bg-gradient-to-br from-[#f0c772] to-[#a65422] p-9 text-[#2b160b]">
                <div className="text-center">
                  <Gift className="mx-auto h-12 w-12" />
                  <p className="mt-5 text-sm font-black uppercase tracking-[0.24em]">
                    Pagamento antecipado
                  </p>
                  <p className="mt-2 font-display text-5xl font-black tracking-[-0.05em]">
                    Pague e confirme
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Chatbot
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        initialMessage={
          selectedFlow
            ? `Olá! Quero agendar a doação de cabelo ${selectedFlow.hair.name} com ${selectedFlow.technique}.`
            : undefined
        }
        promoData={
          selectedFlow
            ? {
                source: 'hair-donation',
                serviceName: `Doação de cabelo - ${selectedFlow.technique}`,
                selectedTechnique: selectedFlow.technique,
                price: String(selectedFlow.price),
                durationMinutes: selectedFlow.durationMinutes,
                minDate: campaign?.openingAt?.slice(0, 10) || '2026-05-04',
                paymentMode: 'full',
                donationHairOptionId: selectedFlow.hair.id,
                donationHairName: selectedFlow.hair.name,
                donationHairDescription: selectedFlow.hair.description,
                donationHairImageUrl: selectedFlow.hair.imageUrl,
                donationHairColor: selectedFlow.hair.color,
                donationHairLength: selectedFlow.hair.length,
              }
            : undefined
        }
      />

      <footer className="relative z-10 border-t border-white/10 bg-[#0c0403]/80 px-4 py-6 text-sm text-[#ead4b5] md:px-6">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-3 md:grid-cols-3">
          <div className="text-center md:text-left">CarolSol Studio</div>
          <div className="flex items-center justify-center gap-2 text-center">
            <Heart className="h-4 w-4 fill-current text-[#f0c772]" />
            <span>Transformando com Amor</span>
            <Heart className="h-4 w-4 fill-current text-[#f0c772]" />
          </div>
          <div className="flex justify-center md:justify-end">
            <UniqueVisitCounter />
          </div>
        </div>
      </footer>
    </main>
  )
}
