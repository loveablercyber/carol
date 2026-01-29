import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { authOptions } from '@/lib/auth-options'

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
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-white to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold text-foreground">
            CarolSol Studio
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link className="hover:text-primary" href="/admin">
              Dashboard
            </Link>
            <Link className="hover:text-primary" href="/admin/products">
              Produtos
            </Link>
            <Link className="hover:text-primary" href="/admin/categories">
              Categorias
            </Link>
            <Link className="hover:text-primary" href="/admin/orders">
              Pedidos
            </Link>
            <Link className="hover:text-primary" href="/admin/customers">
              Clientes
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-10">{children}</main>
    </div>
  )
}
