import { getServerSession } from 'next-auth'
import Link from 'next/link'
import {
  Search,
  Settings2,
} from 'lucide-react'
import { authOptions } from '@/lib/auth-options'
import { adminNavigationItems } from '@/lib/admin-navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  const isAdmin = session?.user?.role === 'admin'

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-white to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="font-display font-bold text-2xl text-foreground mb-2">
            Acesso restrito
          </h1>
          <p className="text-muted-foreground mb-6">
            Você precisa de permissão de administrador para acessar esta área.
          </p>
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Voltar ao site
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#e8f0ff_0,_#d8e3ff_45%,_#e6defd_100%)] px-2 py-3 md:px-5 md:py-5">
      <div className="mx-auto max-w-[1500px] rounded-[28px] border border-white/70 bg-gradient-to-br from-[#d8e5ff] via-[#dbe7ff] to-[#e7dfff] p-3 shadow-[0_32px_70px_-36px_rgba(32,36,64,0.75)] md:p-4 2xl:max-w-[1720px]">
        <div className="grid gap-4 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr]">
          <aside className="rounded-2xl bg-white/85 p-4 backdrop-blur-sm lg:sticky lg:top-5 lg:self-start lg:rounded-[2rem] lg:p-5">
            <div className="mb-5 rounded-xl bg-gradient-to-r from-[#3247d3] via-[#4d65e7] to-[#2995da] px-4 py-4 text-white">
              <p className="text-sm/4 opacity-90">CarolSol Studio</p>
              <p className="font-display text-lg font-bold">Painel Admin</p>
            </div>

            <nav className="space-y-1">
              {adminNavigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-[#edf2ff] hover:text-[#2336b8]"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </aside>

          <div className="min-h-[820px] rounded-2xl bg-white/60 backdrop-blur-sm lg:rounded-[2rem]">
            <header className="flex flex-col gap-3 border-b border-white/60 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6 lg:px-7 lg:py-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Gestao
                </p>
                <p className="font-display text-xl font-bold text-slate-800">
                  Dashboard Administrativo
                </p>
              </div>
              <div className="flex w-full items-center gap-3 md:w-auto">
                <div className="flex w-full items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm md:w-80">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar modulo ou pagina..."
                    className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>
                <div className="hidden rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm md:block">
                  {session.user?.name || 'Admin'}
                </div>
                <Link
                  href="/"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition hover:text-primary"
                  title="Voltar ao site"
                >
                  <Settings2 className="h-4 w-4" />
                </Link>
              </div>
            </header>
            <main className="px-4 py-5 md:px-6 md:py-6 lg:px-7 lg:py-7">{children}</main>
          </div>
        </div>
      </div>
    </div>
  )
}
