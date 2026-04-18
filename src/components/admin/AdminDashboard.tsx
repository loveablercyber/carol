'use client'

import Link from 'next/link'
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock3,
  TrendingUp,
  WalletCards,
} from 'lucide-react'
import {
  adminNavigationItems,
  type AdminSectionKey,
} from '@/lib/admin-navigation'

const stats = [
  {
    label: 'Agendamentos',
    value: 'Ativo',
    detail: 'Fluxos com agenda, pagamento e confirmacao',
    icon: Clock3,
    tone: 'from-[#3247d3] to-[#22a9e6]',
  },
  {
    label: 'Pagamentos',
    value: 'MP',
    detail: 'PIX e cartao integrados ao painel do cliente',
    icon: WalletCards,
    tone: 'from-[#fb5c8f] to-[#f8895d]',
  },
  {
    label: 'Chatbot',
    value: 'Visual',
    detail: 'Fluxos, servicos, FAQ e agenda editaveis',
    icon: Activity,
    tone: 'from-[#22b8cf] to-[#3f67f5]',
  },
  {
    label: 'Operacao',
    value: 'Online',
    detail: 'Loja, campanha e paginas internas publicadas',
    icon: CheckCircle2,
    tone: 'from-[#18a058] to-[#7bd88f]',
  },
]

const serviceBars = [
  { label: 'Manutencao', value: 86, color: 'bg-[#3247d3]' },
  { label: 'Aplicacao', value: 72, color: 'bg-[#22a9e6]' },
  { label: 'Alinhamento', value: 58, color: 'bg-[#fb5c8f]' },
  { label: 'Cronograma', value: 44, color: 'bg-[#f8895d]' },
]

const timeline = [
  'Revisar pagamentos pendentes no painel do cliente',
  'Acompanhar proximos horarios e bloqueios da agenda',
  'Conferir campanha de doacao antes da proxima abertura',
  'Exportar backup apos alteracoes administrativas importantes',
]

type AdminDashboardProps = {
  onNavigate?: (section: AdminSectionKey) => void
}

function DashboardActionCard({
  item,
  onNavigate,
}: {
  item: (typeof adminNavigationItems)[number]
  onNavigate?: (section: AdminSectionKey) => void
}) {
  const Icon = item.icon
  const className =
    'group rounded-2xl border border-[#d8e3ff] bg-gradient-to-b from-white to-[#f8faff] p-5 shadow-[0_14px_35px_-25px_rgba(31,41,55,0.55)] transition hover:-translate-y-0.5 hover:border-[#9cb3ff] hover:shadow-[0_18px_35px_-22px_rgba(48,70,160,0.55)]'

  const content = (
    <>
      <div className="mb-4 inline-flex rounded-2xl bg-[#edf2ff] p-3 text-[#2f46c1] transition group-hover:bg-[#3247d3] group-hover:text-white">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mb-2 font-display text-lg font-bold text-slate-800">
        {item.label}
      </h3>
      <p className="text-sm leading-6 text-slate-600">{item.description}</p>
    </>
  )

  if (onNavigate) {
    return (
      <button
        type="button"
        onClick={() => onNavigate(item.key)}
        className={`${className} text-left`}
      >
        {content}
      </button>
    )
  }

  return (
    <Link href={item.href} className={className}>
      {content}
    </Link>
  )
}

function DashboardShortcutCard({
  item,
  onNavigate,
}: {
  item: (typeof adminNavigationItems)[number]
  onNavigate?: (section: AdminSectionKey) => void
}) {
  const Icon = item.icon
  const className =
    'flex items-center gap-3 rounded-2xl border border-white/70 bg-white/80 p-4 text-sm font-bold text-slate-700 shadow-[0_14px_30px_-26px_rgba(31,41,55,0.55)] transition hover:-translate-y-0.5 hover:text-[#3247d3]'

  const content = (
    <>
      <Icon className="h-5 w-5 text-[#3247d3]" />
      {item.label}
    </>
  )

  if (onNavigate) {
    return (
      <button
        type="button"
        onClick={() => onNavigate(item.key)}
        className={`${className} text-left`}
      >
        {content}
      </button>
    )
  }

  return (
    <Link href={item.href} className={className}>
      {content}
    </Link>
  )
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const managementCards = adminNavigationItems.filter(
    (item) => item.key !== 'dashboard' && item.featured
  )
  const secondaryCards = adminNavigationItems.filter(
    (item) => item.key !== 'dashboard' && !item.featured
  )

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-[#22317f] via-[#3247d3] to-[#1d96c8] p-6 text-white shadow-[0_30px_70px_-38px_rgba(32,36,64,0.85)] md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-white/85">
              Dashboard administrativo
            </p>
            <h1 className="font-display text-3xl font-bold leading-tight md:text-5xl">
              Controle operacional da loja, agenda e campanhas
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/78 md:text-base">
              Visao rapida dos modulos essenciais para acompanhar atendimento,
              vendas, pagamentos, configuracoes do chatbot e conteudo do site.
            </p>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/12 p-5 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/65">
                  Saude da operacao
                </p>
                <p className="mt-1 font-display text-2xl font-bold">Estavel</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-[#9ff0bd]" />
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {['Agenda', 'Loja', 'Chatbot'].map((item) => (
                <div key={item} className="rounded-2xl bg-white/12 px-3 py-4">
                  <p className="text-lg font-bold">OK</p>
                  <p className="text-xs text-white/65">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((metric) => {
          const Icon = metric.icon
          return (
            <div
              key={metric.label}
              className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-[0_18px_40px_-28px_rgba(31,41,55,0.6)]"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className={`rounded-2xl bg-gradient-to-br ${metric.tone} p-3 text-white`}>
                  <Icon className="h-5 w-5" />
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                {metric.label}
              </p>
              <p className="mt-1 font-display text-3xl font-bold text-slate-900">
                {metric.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{metric.detail}</p>
            </div>
          )
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-[0_18px_40px_-28px_rgba(31,41,55,0.6)] md:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Performance
              </p>
              <h2 className="font-display text-2xl font-bold text-slate-900">
                Servicos mais movimentados
              </h2>
            </div>
            <BarChart3 className="h-6 w-6 text-[#3247d3]" />
          </div>
          <div className="space-y-5">
            {serviceBars.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-semibold text-slate-700">{item.label}</span>
                  <span className="text-slate-500">{item.value}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[#eaf0ff]">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-[0_18px_40px_-28px_rgba(31,41,55,0.6)] md:p-6">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Prioridades
            </p>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Checklist da semana
            </h2>
          </div>
          <div className="space-y-3">
            {timeline.map((item, index) => (
              <div key={item} className="flex gap-3 rounded-2xl bg-[#f8faff] p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3247d3] text-xs font-bold text-white">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-slate-600">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-[0_18px_40px_-28px_rgba(31,41,55,0.6)] md:p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Gestao
            </p>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Modulos principais
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-500">
            Atalhos para os blocos que concentram operacao, vendas e configuracoes.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {managementCards.map((item) => (
            <DashboardActionCard
              key={item.key}
              item={item}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-5">
        {secondaryCards.map((item) => (
          <DashboardShortcutCard
            key={item.key}
            item={item}
            onNavigate={onNavigate}
          />
        ))}
      </section>
    </div>
  )
}
