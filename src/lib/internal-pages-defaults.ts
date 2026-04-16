export type InternalPageSlug =
  | 'promo-bio-proteina'
  | 'services'
  | 'clube-capilar'
  | 'depoimentos'
  | 'profissional'

export type InternalPageConfig = {
  slug: InternalPageSlug
  title: string
  content: Record<string, unknown>
}

export const DEFAULT_INTERNAL_PAGES: InternalPageConfig[] = [
  {
    slug: 'promo-bio-proteina',
    title: 'Promocao Bio Proteina',
    content: {
      badgeText: 'Promocao Especial',
      title: 'Fibra Bio Proteina',
      priceText: 'R$ 300,00',
      priceValueForChatbot: '300',
      description:
        'A Fibra Bio Proteina e um material sintetico de alta qualidade, projetado para apliques, que oferece toque macio e leveza, permitindo o uso de cremes e calor (ate 180C, dependendo do modelo) para estilizacao.',
      infoTitle: 'Cabelo e Aplicacao',
      infoItems: [
        'Quantidade ate 200 gramas',
        'Aplicacao inclusa no valor',
        'Escolha a sua cor favorita abaixo',
      ],
      footerText: 'CarolSol Studio - Transformando com Amor',
      images: [
        { name: 'Bio Proteina Marsala', path: '/images/Bio Proteína Marsala.jpeg' },
        { name: 'Bio Proteina Loiro Mel', path: '/images/Bio Proteína Loiro Mel.jpeg' },
        { name: 'Bio Proteina Loiro Clarisso', path: '/images/Bio Proteína Loiro Clarisso.jpeg' },
        { name: 'Bio Proteina Loiro Dourado', path: '/images/Bio Proteína Loiro Dourado.jpeg' },
      ],
    },
  },
  {
    slug: 'services',
    title: 'Servicos',
    content: {
      title: 'Nossos Servicos',
      subtitle:
        'Escolha um servico e veja os resultados incriveis que podemos criar para voce',
      categories: [
        {
          id: 'extensoes',
          name: 'Extensoes / Fibra Russa',
          nameEmoji: '💖',
          description: 'Comprimento e volume com tecnicas invisiveis',
          image: '/images/services/extensions-destaque.png',
        },
        {
          id: 'tratamentos',
          name: 'Tratamentos e Alinhamento',
          nameEmoji: '✨',
          description: 'Tratamentos que restauram a saude do seu cabelo',
          image: '/images/services/tratamentos-destaque.png',
        },
        {
          id: 'alisamento',
          name: 'Alisamento',
          nameEmoji: '💇‍♀️',
          description: 'Alinhamento suave e natural para seu cabelo',
          image: '/images/services/alisamento-destaque.png',
        },
        {
          id: 'cronograma',
          name: 'Cronograma Capilar',
          nameEmoji: '🌸',
          description: 'Tratamento completo com acompanhamento semanal',
          image: '/images/services/cronograma-destaque.png',
        },
      ],
    },
  },
  {
    slug: 'clube-capilar',
    title: 'Clube Capilar',
    content: {
      badgeText: 'Planos exclusivos de manutencao',
      title: 'Clube Capilar CarolSol',
      description:
        'Mantenha o megahair impecavel com acompanhamento mensal, tratamentos personalizados e beneficios especiais para clientes do clube.',
      plans: [
        {
          name: 'Clube Essencial',
          price: 'R$180/mes',
          highlight: 'Manutencao basica com cuidado continuo',
          items: [
            '1 sessao de manutencao por mes',
            'Avaliacao capilar completa',
            'Hidratacao profissional',
            'Desconto especial em produtos',
          ],
        },
        {
          name: 'Clube Premium',
          price: 'R$280/mes',
          highlight: 'Tratamento mensal + acompanhamento',
          items: [
            '2 sessoes de manutencao por mes',
            'Hidratacao + nutricao profunda',
            'Cronograma capilar personalizado',
            'Prioridade no agendamento',
          ],
        },
        {
          name: 'Clube Luxo',
          price: 'R$380/mes',
          highlight: 'Experiencia completa e exclusiva',
          items: [
            '3 sessoes de manutencao por mes',
            'Blindagem capilar trimestral',
            'Acompanhamento exclusivo com especialista',
            'Consultoria de imagem capilar',
          ],
        },
      ],
      benefits: [
        {
          title: 'Agendamentos flexiveis',
          description: 'Horarios reservados para membros do clube.',
        },
        {
          title: 'Tratamentos premium',
          description: 'Produtos profissionais e tecnicas exclusivas.',
        },
        {
          title: 'Acompanhamento proximo',
          description: 'Evolucao do seu cabelo mes a mes.',
        },
      ],
      ctaTitle: 'Pronta para entrar no clube?',
      ctaDescription:
        'Garanta seu plano e cuide do seu cabelo com quem entende de mega hair.',
      ctaButtonText: 'Falar com a especialista',
    },
  },
  {
    slug: 'depoimentos',
    title: 'Depoimentos',
    content: {
      badgeText: 'Antes & Depois',
      title: 'Depoimentos e Transformacoes',
      description:
        'Resultados reais de clientes atendidas com tecnicas de mega hair, alinhamento e cuidado capilar.',
      testimonials: [
        {
          id: 'resultado-1',
          title: 'Mega Hair Natural com Volume',
          description: 'Aplicacao com acabamento invisivel e fios bio organicos.',
          before: '/images/antes1.png',
          after: '/images/depois1.png',
          quote:
            'Eu sempre tive medo de alongamento, mas o resultado ficou super natural. Me senti linda e segura!',
          client: 'Camila, Bauru - SP',
        },
        {
          id: 'resultado-2',
          title: 'Transformacao Completa',
          description: 'Alongamento com ajuste de cor e tratamento de brilho.',
          before: '/images/antes2.png',
          after: '/images/depois2.png',
          quote:
            'A textura ficou leve e o cabelo virou outro! Atendimento carinhoso do inicio ao fim.',
          client: 'Renata, Bauru - SP',
        },
      ],
      ctaTitle: 'Quer viver sua transformacao?',
      ctaDescription:
        'Agende uma avaliacao personalizada e descubra o melhor metodo para o seu cabelo.',
      ctaButtonText: 'Agendar atendimento',
    },
  },
  {
    slug: 'profissional',
    title: 'Profissional',
    content: {
      pageTitle: 'Conhecer a Profissional',
      profileName: 'Carol Sol',
      profileRole: 'Especialista em Mega Hair',
      location: 'Bauru - SP',
      profileImage: '/images/perfil.png',
      bookingButtonText: 'Agendar atendimento',
      badges: [
        '15 anos de experiência',
        'Atendimento humanizado',
        'Protocolos personalizados',
      ],
      profileSectionTitle: 'Perfil profissional',
      profileDescription:
        'Carol Sol e uma profissional especializada em mega hair, com foco em resultados naturais e duradouros. O atendimento e feito de forma individual, combinando diagnostico capilar, selecao de fios premium e tecnicas de aplicacao seguras. Cada procedimento e pensado para valorizar a identidade de cada cliente e garantir conforto durante o uso.',
      highlights: [
        {
          title: 'Especialista em Mega Hair',
          description: 'Tecnicas modernas, aplicacao segura e manutencao cuidadosa.',
        },
        {
          title: 'Bio Organico & Fibra Russa',
          description: 'Selecao de fios premium para naturalidade e leveza.',
        },
        {
          title: 'Fita Adesiva, Microlink e Entrelacamento',
          description: 'Protocolos personalizados para cada estilo de vida.',
        },
      ],
      techniques: [
        'Diagnostico capilar detalhado',
        'Mapeamento de couro cabeludo',
        'Planejamento de volume e cor',
        'Aplicacao com acabamento invisivel',
        'Manutencao mensal orientada',
        'Cuidados pos-procedimento',
      ],
      instagramTitle: 'Quer conhecer o resultado real?',
      instagramDescription:
        'Veja a rotina, transformacoes e bastidores no Instagram.',
      instagramButtonText: 'Acessar perfil no Instagram',
      instagramUrl: 'https://www.instagram.com/carolsolhair/',
      instagramPhotos: [
        '/assets/salon.png',
        '/assets/transformation.png',
        '/assets/hair-closeup.png',
        '/assets/products.png',
        '/images/perfil.png',
        '/images/services/extensions-destaque.png',
        '/images/services/megahair-invisible.png',
        '/images/services/megahair-fita.png',
      ],
    },
  },
]

const internalPagesBySlug = new Map(DEFAULT_INTERNAL_PAGES.map((page) => [page.slug, page]))

export function getDefaultInternalPage(slug: string) {
  return internalPagesBySlug.get(slug as InternalPageSlug)
}
