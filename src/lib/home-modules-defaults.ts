export type HomeModuleKey =
  | 'scheduling'
  | 'donation'
  | 'promotion'
  | 'services'
  | 'shop'
  | 'club'
  | 'testimonials'
  | 'professional'
  | 'instagram'
  | 'support'

export type HomeIconName =
  | 'Calendar'
  | 'Sparkles'
  | 'Heart'
  | 'DollarSign'
  | 'ShoppingBag'
  | 'Camera'
  | 'User'
  | 'Instagram'
  | 'Mail'

export type HomeModuleConfig = {
  key: HomeModuleKey
  icon: HomeIconName
  title: string
  subtitle: string
  description: string
  buttonText: string
  href?: string
  image?: string
  color: string
  textColor: string
  shadow?: string
  isPrimary?: boolean
  openChatbot?: boolean
  instagramUrl?: string
  instagramPhotos?: string[]
  plans?: string[]
  enabled: boolean
  position: number
}

export const DEFAULT_HOME_MODULES: HomeModuleConfig[] = [
  {
    key: 'scheduling',
    icon: 'Calendar',
    title: 'Agendar um Servico',
    subtitle: '💇‍♀️',
    description: 'Agendamento online rapido e facil',
    buttonText: 'Agendar Agora',
    color: 'bg-primary',
    textColor: 'text-primary-foreground',
    isPrimary: true,
    openChatbot: true,
    enabled: true,
    position: 0,
  },
  {
    key: 'donation',
    icon: 'Heart',
    title: 'Doação de Cabelo',
    subtitle: '🎁',
    description: 'Agendamento liberado em 04/05. Vagas simbólicas para aplicação com valor reduzido.',
    href: '/doacao-cabelo',
    color: 'bg-gradient-to-br from-[#1f1308] via-[#5a2a08] to-[#0f0904]',
    textColor: 'text-white',
    buttonText: 'Ver Doação',
    shadow: 'shadow-xl',
    enabled: true,
    position: 1,
  },
  {
    key: 'promotion',
    icon: 'Sparkles',
    title: 'Promocao Bio Proteina',
    subtitle: '✨',
    description: 'Aproveite nossa nova fibra de alta qualidade por apenas R$ 300!',
    href: '/promo-bio-proteina',
    color: 'bg-gradient-to-br from-[#FFD700] to-[#FFA500]',
    textColor: 'text-white',
    buttonText: 'Ver Promocao',
    shadow: 'shadow-xl',
    enabled: true,
    position: 2,
  },
  {
    key: 'services',
    icon: 'DollarSign',
    title: 'Ver Servicos e Valores',
    subtitle: '💰',
    description: 'Conheca nossos servicos e precos',
    href: '/services',
    color: 'bg-white',
    textColor: 'text-foreground',
    buttonText: 'Ver Lista',
    shadow: 'shadow-lg',
    enabled: true,
    position: 3,
  },
  {
    key: 'shop',
    icon: 'ShoppingBag',
    title: 'Comprar Perucas & Produtos',
    subtitle: '💎',
    description: 'Produtos de alta qualidade',
    href: '/shop',
    image: '/assets/products.png',
    buttonText: 'Acessar Loja',
    color: 'bg-white',
    textColor: 'text-foreground',
    enabled: true,
    position: 4,
  },
  {
    key: 'club',
    icon: 'Sparkles',
    title: 'Assinar Clube Capilar',
    subtitle: '🌸',
    description: 'Planos exclusivos de manutencao',
    href: '/clube-capilar',
    plans: ['R$180/mes', 'R$280/mes', 'R$380/mes'],
    buttonText: 'Assinar Agora',
    color: 'bg-[#F8B6D8]',
    textColor: 'text-foreground',
    enabled: true,
    position: 5,
  },
  {
    key: 'testimonials',
    icon: 'Camera',
    title: 'Ver Resultados Reais',
    subtitle: '📸',
    description: 'Transformacoes incriveis de nossas clientes',
    image: '/assets/transformat.png',
    href: '/depoimentos',
    buttonText: 'Ver Depoimentos',
    color: 'bg-white',
    textColor: 'text-foreground',
    enabled: true,
    position: 6,
  },
  {
    key: 'professional',
    icon: 'User',
    title: 'Conhecer a Profissional',
    subtitle: '👩‍🦰',
    description: 'Carol - 15 anos de experiência',
    href: '/profissional',
    image: '/images/carol.png',
    buttonText: 'Saiba Mais',
    color: 'bg-[#FFF0F5]',
    textColor: 'text-foreground',
    enabled: true,
    position: 7,
  },
  {
    key: 'instagram',
    icon: 'Instagram',
    title: 'Seguir no Instagram',
    subtitle: '📱',
    description: 'Acompanhe meu dia a dia e resultados reais',
    buttonText: 'Ver Perfil',
    instagramUrl: 'https://www.instagram.com/carolsolhair/',
    instagramPhotos: [
      '/images/molde1.png',
      '/images/molde2.png',
      '/images/molde3.png',
      '/images/molde4.png',
    ],
    color: 'bg-gradient-to-br from-[#E91E63] to-[#F8B6D8]',
    textColor: 'text-white',
    shadow: 'shadow-lg',
    enabled: true,
    position: 8,
  },
  {
    key: 'support',
    icon: 'Mail',
    title: 'Fale com o Suporte',
    subtitle: '💬',
    description: 'Estamos aqui para ajudar voce',
    buttonText: 'Entrar em Contato',
    href: 'https://wa.me/5511000000000?text=Ola!%20Preciso%20de%20ajuda%20com%20atendimento%20da%20CarolSol.',
    color: 'bg-[#F8B6D8]',
    textColor: 'text-foreground',
    enabled: true,
    position: 9,
  },
]

const defaultByKey = new Map(DEFAULT_HOME_MODULES.map((module) => [module.key, module]))

export function getDefaultHomeModule(key: string) {
  return defaultByKey.get(key as HomeModuleKey)
}
