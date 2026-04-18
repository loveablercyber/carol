import {
  Archive,
  FilePenLine,
  Gift,
  Home,
  Layers3,
  LayoutGrid,
  MessageSquare,
  Package,
  Settings2,
  ShoppingCart,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type AdminSectionKey =
  | 'dashboard'
  | 'orders'
  | 'customers'
  | 'products'
  | 'categories'
  | 'homeModules'
  | 'internalPages'
  | 'chatbotConfig'
  | 'donation'
  | 'shipping'
  | 'reviews'
  | 'backup'

export type AdminNavigationItem = {
  key: AdminSectionKey
  href: string
  label: string
  description: string
  icon: LucideIcon
  featured?: boolean
}

export const adminNavigationItems: AdminNavigationItem[] = [
  {
    key: 'dashboard',
    href: '/admin',
    label: 'Visao Geral',
    description: 'Resumo operacional do painel administrativo.',
    icon: LayoutGrid,
  },
  {
    key: 'orders',
    href: '/admin/orders',
    label: 'Pedidos',
    description: 'Status, pagamentos, rastreio e acompanhamento da loja.',
    icon: ShoppingCart,
    featured: true,
  },
  {
    key: 'customers',
    href: '/admin/customers',
    label: 'Clientes',
    description: 'Contas, historico, dados cadastrais e relacionamento.',
    icon: Users,
    featured: true,
  },
  {
    key: 'products',
    href: '/admin/products',
    label: 'Produtos',
    description: 'Catalogo, imagens, cores, comprimentos, estoque e destaque.',
    icon: Package,
    featured: true,
  },
  {
    key: 'categories',
    href: '/admin/categories',
    label: 'Categorias',
    description: 'Organize categorias e ordem de exibicao.',
    icon: Layers3,
  },
  {
    key: 'homeModules',
    href: '/admin/home-modules',
    label: 'Pagina Inicial',
    description: 'Ative modulos e personalize a ordem da home.',
    icon: Home,
  },
  {
    key: 'internalPages',
    href: '/admin/internal-pages',
    label: 'Paginas Internas',
    description: 'Edite promocoes, servicos e paginas de conteudo.',
    icon: FilePenLine,
    featured: true,
  },
  {
    key: 'chatbotConfig',
    href: '/admin/chatbot-config',
    label: 'Chatbot e Agenda',
    description: 'Configure fluxos, servicos, FAQ, midias e horarios.',
    icon: Settings2,
    featured: true,
  },
  {
    key: 'donation',
    href: '/admin/donation',
    label: 'Doacao de Cabelo',
    description: 'Controle abertura, cabelos, pagamento e horarios da campanha.',
    icon: Gift,
    featured: true,
  },
  {
    key: 'shipping',
    href: '/admin/shipping',
    label: 'Frete',
    description: 'Defina regras por CEP, categoria e produto.',
    icon: Truck,
  },
  {
    key: 'reviews',
    href: '/admin/reviews',
    label: 'Comentarios',
    description: 'Modere avaliacoes e comentarios da loja.',
    icon: MessageSquare,
  },
  {
    key: 'backup',
    href: '/admin/backup',
    label: 'Backup',
    description: 'Exporte backup manual do banco de dados.',
    icon: Archive,
  },
]
