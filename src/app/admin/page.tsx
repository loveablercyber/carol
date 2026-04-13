import Link from 'next/link'
import {
  CalendarClock,
  DatabaseBackup,
  FilePenLine,
  Home,
  Layers3,
  MessageSquare,
  Package,
  ShoppingCart,
  Truck,
  Users,
} from 'lucide-react'

export default function AdminPage() {
  const metrics = [
    {
      label: 'Modulos ativos',
      value: '10',
      detail: 'Home e paginas internas',
      color: 'from-[#4668ff] to-[#22a9e6]',
    },
    {
      label: 'Atendimento',
      value: '24h',
      detail: 'Acompanhamento de pedidos',
      color: 'from-[#fb5c8f] to-[#f8895d]',
    },
    {
      label: 'Fluxo de vendas',
      value: 'Online',
      detail: 'Loja e agendamento integrados',
      color: 'from-[#22b8cf] to-[#3f67f5]',
    },
  ]

  const cards = [
    {
      title: 'Produtos',
      description: 'Gerencie catalogo, estoque e destaque.',
      href: '/admin/products',
      icon: Package,
    },
    {
      title: 'Categorias',
      description: 'Organize categorias e ordem de exibicao.',
      href: '/admin/categories',
      icon: Layers3,
    },
    {
      title: 'Pedidos',
      description: 'Atualize status, pagamentos e rastreio.',
      href: '/admin/orders',
      icon: ShoppingCart,
    },
    {
      title: 'Clientes',
      description: 'Gerencie contas, cadastros e acesso.',
      href: '/admin/customers',
      icon: Users,
    },
    {
      title: 'Pagina Inicial',
      description: 'Ative modulos, edite conteudo e ordem da home.',
      href: '/admin/home-modules',
      icon: Home,
    },
    {
      title: 'Paginas Internas',
      description: 'Edite promocoes, servicos, clube e conteudo.',
      href: '/admin/internal-pages',
      icon: FilePenLine,
    },
    {
      title: 'Agendamentos',
      description: 'Controle confirmacoes, cancelamentos e historico.',
      href: '/admin/appointments',
      icon: CalendarClock,
    },
    {
      title: 'Frete',
      description: 'Defina CEP da loja e regras por categoria.',
      href: '/admin/shipping',
      icon: Truck,
    },
    {
      title: 'Comentarios',
      description: 'Modere avaliacoes e comentarios dos produtos.',
      href: '/admin/reviews',
      icon: MessageSquare,
    },
    {
      title: 'Backup',
      description: 'Exportacao manual do banco para seguranca.',
      href: '/admin/backup',
      icon: DatabaseBackup,
    },
  ]

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_40px_-28px_rgba(31,41,55,0.6)]"
          >
            <div className="mb-3 flex items-center gap-3">
              <div
                className={`h-11 w-11 rounded-full bg-gradient-to-br ${metric.color} text-white shadow-sm`}
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {metric.label}
                </p>
                <p className="font-display text-3xl font-bold text-slate-800">{metric.value}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">{metric.detail}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_40px_-28px_rgba(31,41,55,0.6)] md:p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Operacao
            </p>
            <h1 className="font-display text-2xl font-bold text-slate-900">
              Atalhos do Painel Administrativo
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            Estrutura organizada para gestão diária da loja e serviços.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group rounded-xl border border-[#d8e3ff] bg-gradient-to-b from-white to-[#f8faff] p-5 shadow-[0_14px_35px_-25px_rgba(31,41,55,0.55)] transition hover:-translate-y-0.5 hover:border-[#9cb3ff] hover:shadow-[0_18px_35px_-22px_rgba(48,70,160,0.55)]"
              >
                <div className="mb-3 inline-flex rounded-lg bg-[#edf2ff] p-2 text-[#2f46c1]">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mb-1 font-display text-lg font-bold text-slate-800">
                  {card.title}
                </h2>
                <p className="text-sm text-slate-600">{card.description}</p>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
