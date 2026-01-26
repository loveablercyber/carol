import Link from 'next/link'

export default function AdminPage() {
  const cards = [
    {
      title: 'Produtos',
      description: 'Gerencie catálogo, estoque e destaque.',
      href: '/admin/products',
    },
    {
      title: 'Categorias',
      description: 'Organize categorias e ordem de exibição.',
      href: '/admin/categories',
    },
    {
      title: 'Pedidos',
      description: 'Atualize status, pagamentos e rastreio.',
      href: '/admin/orders',
    },
  ]

  return (
    <div>
      <h1 className="font-display font-bold text-3xl text-foreground mb-6">
        Painel Administrativo
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-white rounded-2xl shadow-md p-6 border border-pink-100 hover:border-pink-300 hover:shadow-lg transition-all"
          >
            <h2 className="font-display font-bold text-xl text-foreground mb-2">
              {card.title}
            </h2>
            <p className="text-muted-foreground">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
