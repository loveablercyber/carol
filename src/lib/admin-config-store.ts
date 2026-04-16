import { db } from '@/lib/db'

export type ChatbotFlowItemType =
  | 'text'
  | 'title'
  | 'description'
  | 'single_choice'
  | 'multi_choice'
  | 'text_field'
  | 'number_field'
  | 'phone_field'
  | 'email_field'
  | 'price'
  | 'observation'
  | 'summary'
  | 'image'
  | 'video'
  | 'faq'

export type ChatbotOptionItem = {
  id: string
  label: string
  value?: string
  price?: number | null
  priceLabel?: string
  order: number
  active: boolean
}

export type ChatbotFlowItem = {
  id: string
  type: ChatbotFlowItemType
  title: string
  subtitle?: string
  description?: string
  options?: string[]
  optionItems?: ChatbotOptionItem[]
  price?: string
  grams?: string
  observation?: string
  order: number
  active: boolean
  required: boolean
}

export type AdminServiceItem = {
  id: string
  name: string
  category: string
  subcategory?: string
  price: number
  priceLabel?: string
  pricePerGram?: number | null
  minGrams?: number | null
  maxGrams?: number | null
  durationMinutes: number
  shortDescription: string
  longDescription?: string
  observations?: string
  priceTable?: Array<{
    id: string
    grams: string
    order: number
    active: boolean
    lengths: Array<{
      id: string
      size: string
      price: number
      order: number
      active: boolean
    }>
  }>
  extraQuestions?: Array<{
    id: string
    label: string
    type: string
    options: string[]
    required: boolean
    active: boolean
  }>
  order: number
  active: boolean
}

export type BeforeAfterItem = {
  id: string
  serviceId?: string
  title: string
  description: string
  category: string
  beforeImageUrl: string
  afterImageUrl: string
  order: number
  active: boolean
}

export type VideoItem = {
  id: string
  serviceId?: string
  title: string
  description: string
  thumbnailUrl: string
  videoUrl: string
  order: number
  active: boolean
}

export type FaqItem = {
  id: string
  serviceId?: string
  question: string
  answer: string
  order: number
  active: boolean
}

export type BusinessHour = {
  day: number
  label: string
  active: boolean
  start: string
  end: string
  breaks: Array<{ start: string; end: string }>
}

export type ManualTimeBlock = {
  id: string
  date: string
  start: string
  end: string
  reason: string
  active: boolean
}

export type SchedulingSettings = {
  slotIntervalMinutes: number
  defaultDurationMinutes: number
  businessHours: BusinessHour[]
  manualBlocks: ManualTimeBlock[]
}

export type AdminOperationalConfig = {
  flowItems: ChatbotFlowItem[]
  services: AdminServiceItem[]
  beforeAfterItems: BeforeAfterItem[]
  videoItems: VideoItem[]
  faqItems: FaqItem[]
  schedulingSettings: SchedulingSettings
}

type ConfigSection = keyof AdminOperationalConfig

type ConfigRow = {
  section: ConfigSection
  content_json: unknown
}

let bootstrapPromise: Promise<void> | null = null

const DEFAULT_FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq_schedule',
    question: 'Posso agendar um horário?',
    answer: 'Sim, mas o atendimento é realizado somente com horário marcado.',
    order: 1,
    active: true,
  },
  {
    id: 'faq_texture',
    question: 'Qual a textura e aparência das Fibras Russas?',
    answer:
      'As Fibras Russas têm textura fina e leve, proporcionando toque natural. A aparência é super natural, com fios alinhados, menos espessos, resistentes, macios e maleáveis. São produzidas com tecnologia premium para garantir beleza e qualidade.',
    order: 2,
    active: true,
  },
  {
    id: 'faq_payment',
    question: 'Quais são as formas de pagamento?',
    answer:
      'Aceitamos dinheiro e pix sem acréscimo. Cartões de débito e crédito parcelado têm acréscimo da taxa da maquininha.',
    order: 3,
    active: true,
  },
  {
    id: 'faq_duration',
    question: 'Qual a durabilidade?',
    answer:
      'A durabilidade da Fibra Russa varia de 1 a 6 meses, dependendo dos cuidados e da forma como ela é adaptada ao seu uso diário.',
    order: 4,
    active: true,
  },
  {
    id: 'faq_doll',
    question: 'É igual a cabelo de boneca?',
    answer:
      'Não. A Fibra Russa é muito mais avançada. Ela foi desenvolvida para imitar o cabelo natural com mais precisão, tanto na aparência quanto na textura.',
    order: 5,
    active: true,
  },
  {
    id: 'faq_point',
    question: 'Como funciona a técnica ponto americano invisível?',
    answer:
      'Cada mecha é presa ao cabelo natural usando uma argolinha de metal revestida internamente com silicone para proteger o fio. É um método seguro, reutilizável, que não danifica os fios, e as mechas podem ser reaproveitadas.',
    order: 6,
    active: true,
  },
  {
    id: 'faq_microlink',
    question: 'O que é microlink?',
    answer:
      'São pequenos anéis, geralmente feitos de metal ou com revestimento interno, utilizados para prender as mechas de cabelo e formar uma base para a costura da tela do mega hair.',
    order: 7,
    active: true,
  },
  {
    id: 'faq_address',
    question: 'Qual é o endereço?',
    answer:
      'Estamos na Rua Castro Alves, 6-37, próximo à antiga CPFL (casa com portão cinza). Esperamos você no nosso espaço.',
    order: 8,
    active: true,
  },
  {
    id: 'faq_human_hair',
    question: 'A fibra russa é realmente igual ao cabelo humano?',
    answer:
      'Não exatamente. A fibra russa é sintética premium. Ela é de alta qualidade e tem aparência muito natural, mas não possui cutícula como o cabelo humano.',
    order: 9,
    active: true,
  },
  {
    id: 'faq_applique',
    question: 'Vocês fazem aplique?',
    answer: 'Sim, fazemos aplique TIC-TAC e Ponytail (rabo de cavalo), por encomenda.',
    order: 10,
    active: true,
  },
  {
    id: 'faq_maintenance_time',
    question: 'Quanto tempo dura a manutenção?',
    answer:
      'O tempo pode variar conforme a técnica e a quantidade de cabelo, mas informamos tudo certinho no momento do agendamento.',
    order: 11,
    active: true,
  },
  {
    id: 'faq_clean_hair',
    question: 'Preciso ir com o cabelo limpo?',
    answer:
      'Sim. Para manutenção e aplicação, orientamos que você venha com o cabelo limpo para facilitar o atendimento e garantir melhor resultado.',
    order: 12,
    active: true,
  },
  {
    id: 'faq_wash',
    question: 'Posso lavar normalmente depois do procedimento?',
    answer:
      'Sim, mas é importante seguir as orientações de cuidado e manutenção para aumentar a durabilidade e preservar a beleza do resultado.',
    order: 13,
    active: true,
  },
  {
    id: 'faq_kit',
    question: 'Vocês vendem kit de manutenção?',
    answer:
      'Sim. Temos opções de kit de manutenção com itens que ajudam a cuidar melhor do mega hair no dia a dia.',
    order: 14,
    active: true,
  },
  {
    id: 'faq_coloring',
    question: 'Posso fazer coloração junto com o atendimento?',
    answer:
      'Sim. Dependendo do caso, você pode acrescentar serviços como coloração, hidratação, escova e outros adicionais no momento do agendamento.',
    order: 15,
    active: true,
  },
  {
    id: 'faq_same_hair',
    question: 'Quem faz manutenção pode usar o mesmo cabelo?',
    answer:
      'Sim, se o cabelo estiver em boas condições. Também atendemos quem vai colocar cabelo novo ou quem retirou em casa e quer somente a aplicação.',
    order: 16,
    active: true,
  },
]

const DEFAULT_CONFIG: AdminOperationalConfig = {
  flowItems: [
    {
      id: 'flow_evaluation',
      type: 'single_choice',
      title: 'Agendar avaliação',
      subtitle: 'Avaliação de 15 minutos',
      description: 'Fluxo de avaliação inicial para identificar necessidade da cliente.',
      options: ['Confirmar avaliação'],
      price: '0',
      grams: '',
      observation: '',
      order: 1,
      active: true,
      required: true,
    },
    {
      id: 'flow_maintenance',
      type: 'single_choice',
      title: 'Manutenção do Megahair',
      subtitle: 'Técnicas e situação do cabelo',
      description: 'Permite escolher tipo de manutenção, adicionais e kit.',
      options: ['Ponto Americano', 'Fita Adesiva', 'Entrelace', 'Queratina'],
      price: '',
      grams: '',
      observation: 'Cliente orientada a vir com o cabelo limpo.',
      order: 2,
      active: true,
      required: true,
    },
    {
      id: 'flow_application',
      type: 'single_choice',
      title: 'Aplicação do Megahair',
      subtitle: 'Aplicação com coleta completa',
      description: 'Fluxo de aplicação reaproveitando perguntas atuais.',
      options: ['Aplicação do Megahair'],
      price: '',
      grams: '',
      observation: 'Cliente orientada a vir com o cabelo limpo.',
      order: 3,
      active: true,
      required: true,
    },
    {
      id: 'flow_hair_situation',
      type: 'single_choice',
      title: 'Qual é a sua situação?',
      subtitle: 'Situação do cabelo para manutenção',
      description: 'Opções exibidas depois da escolha do tipo de manutenção.',
      options: [
        'Vou usar o mesmo cabelo',
        'Vou fazer manutenção com cabelo novo',
        'Tirei o cabelo em casa e quero só fazer a aplicação',
      ],
      optionItems: [
        {
          id: 'hair_same',
          label: 'Vou usar o mesmo cabelo',
          value: 'same_hair',
          price: null,
          priceLabel: '',
          order: 1,
          active: true,
        },
        {
          id: 'hair_new',
          label: 'Vou fazer manutenção com cabelo novo',
          value: 'new_hair',
          price: null,
          priceLabel: '',
          order: 2,
          active: true,
        },
        {
          id: 'hair_home_removed',
          label: 'Tirei o cabelo em casa e quero só fazer a aplicação',
          value: 'home_removed',
          price: null,
          priceLabel: '',
          order: 3,
          active: true,
        },
      ],
      price: '',
      grams: '',
      observation: 'Cliente orientada a vir com o cabelo limpo.',
      order: 4,
      active: true,
      required: true,
    },
    {
      id: 'flow_additional_services',
      type: 'multi_choice',
      title: 'Quer acrescentar mais algum serviço ao seu atendimento?',
      subtitle: 'Upsell de serviços adicionais',
      description: 'Serviços adicionais oferecidos antes da confirmação.',
      options: ['Escova', 'Hidratação', 'Botox selante', 'Botox progressiva', 'Coloração'],
      optionItems: [
        { id: 'addon_brush', label: 'Escova', value: 'escova', price: null, priceLabel: '', order: 1, active: true },
        { id: 'addon_hydration', label: 'Hidratação', value: 'hidratacao', price: null, priceLabel: '', order: 2, active: true },
        { id: 'addon_sealant_botox', label: 'Botox selante', value: 'botox_selante', price: null, priceLabel: '', order: 3, active: true },
        { id: 'addon_progressive_botox', label: 'Botox progressiva', value: 'botox_progressiva', price: null, priceLabel: '', order: 4, active: true },
        { id: 'addon_coloring', label: 'Coloração', value: 'coloracao', price: null, priceLabel: '', order: 5, active: true },
      ],
      price: '',
      grams: '',
      observation: 'Permite configurar valores futuramente.',
      order: 5,
      active: true,
      required: false,
    },
    {
      id: 'flow_maintenance_kit',
      type: 'multi_choice',
      title: 'Deseja incluir também um kit de manutenção?',
      subtitle: 'Itens do kit de manutenção',
      description: 'Itens exibidos quando a cliente aceita incluir o kit.',
      options: [
        'Óleo reparador',
        'Escova raquete',
        'Touca de cetim',
        'Fronha de cetim',
        'Xuxinha de cetim',
        'Reparador para fibra',
      ],
      optionItems: [
        { id: 'kit_oil', label: 'Óleo reparador', value: 'oleo_reparador', price: null, priceLabel: '', order: 1, active: true },
        { id: 'kit_brush', label: 'Escova raquete', value: 'escova_raquete', price: null, priceLabel: '', order: 2, active: true },
        { id: 'kit_cap', label: 'Touca de cetim', value: 'touca_cetim', price: null, priceLabel: '', order: 3, active: true },
        { id: 'kit_pillowcase', label: 'Fronha de cetim', value: 'fronha_cetim', price: null, priceLabel: '', order: 4, active: true },
        { id: 'kit_scrunchie', label: 'Xuxinha de cetim', value: 'xuxinha_cetim', price: null, priceLabel: '', order: 5, active: true },
        { id: 'kit_fiber_repair', label: 'Reparador para fibra', value: 'reparador_fibra', price: null, priceLabel: '', order: 6, active: true },
      ],
      price: '',
      grams: '',
      observation: 'Permite configurar valores futuramente.',
      order: 6,
      active: true,
      required: false,
    },
    {
      id: 'flow_faq',
      type: 'faq',
      title: 'Perguntas e Respostas',
      subtitle: 'Dúvidas rápidas',
      description: 'Lista de perguntas frequentes exibidas no chatbot.',
      options: [],
      price: '',
      grams: '',
      observation: '',
      order: 7,
      active: true,
      required: false,
    },
  ],
  services: [
    {
      id: 'svc_evaluation',
      name: 'Avaliação',
      category: 'Avaliação',
      subcategory: '',
      price: 0,
      priceLabel: 'Sem custo',
      pricePerGram: null,
      minGrams: null,
      maxGrams: null,
      durationMinutes: 15,
      shortDescription: 'Avaliação inicial de 15 minutos.',
      longDescription: 'Avaliação para entender a necessidade, técnica indicada e próximos passos.',
      observations: '',
      extraQuestions: [],
      order: 1,
      active: true,
    },
    {
      id: 'invisible-weft',
      name: 'Invisible Weft Extensions (Ponto Invisível)',
      category: 'Extensões / Fibra Russa',
      subcategory: 'Aplicação do Megahair',
      price: 0,
      priceLabel: 'Tabela por gramas e tamanho',
      pricePerGram: null,
      minGrams: 100,
      maxGrams: 350,
      durationMinutes: 180,
      shortDescription: 'Técnica moderna de aplicação em costura invisível. Natural e confortável.',
      longDescription: 'Técnica moderna de aplicação em costura invisível. Natural e confortável.',
      observations: 'Venha com o cabelo limpo.',
      priceTable: [
        { id: 'weft_100g', grams: '100g', order: 1, active: true, lengths: [
          { id: 'weft_100g_60', size: '60/65/70cm', price: 360, order: 1, active: true },
          { id: 'weft_100g_75', size: '75/80cm', price: 430, order: 2, active: true },
        ] },
        { id: 'weft_150g', grams: '150g', order: 2, active: true, lengths: [
          { id: 'weft_150g_60', size: '60/65/70cm', price: 405, order: 1, active: true },
          { id: 'weft_150g_75', size: '75/80cm', price: 510, order: 2, active: true },
        ] },
        { id: 'weft_200g', grams: '200g', order: 3, active: true, lengths: [
          { id: 'weft_200g_60', size: '60/65/70cm', price: 500, order: 1, active: true },
          { id: 'weft_200g_75', size: '75/80cm', price: 640, order: 2, active: true },
        ] },
        { id: 'weft_250g', grams: '250g', order: 4, active: true, lengths: [
          { id: 'weft_250g_60', size: '60/65/70cm', price: 600, order: 1, active: true },
          { id: 'weft_250g_75', size: '75/80cm', price: 775, order: 2, active: true },
        ] },
        { id: 'weft_300g', grams: '300g', order: 5, active: true, lengths: [
          { id: 'weft_300g_60', size: '60/65/70cm', price: 660, order: 1, active: true },
          { id: 'weft_300g_75', size: '75/80cm', price: 870, order: 2, active: true },
        ] },
        { id: 'weft_350g', grams: '350g', order: 6, active: true, lengths: [
          { id: 'weft_350g_60', size: '60/65/70cm', price: 770, order: 1, active: true },
          { id: 'weft_350g_75', size: '75/80cm', price: 1015, order: 2, active: true },
        ] },
      ],
      extraQuestions: [],
      order: 2,
      active: true,
    },
    {
      id: 'micro-capsula',
      name: 'Micro Cápsula de Queratina',
      category: 'Extensões / Fibra Russa',
      subcategory: 'Aplicação do Megahair',
      price: 0,
      priceLabel: 'Tabela por gramas e tamanho',
      pricePerGram: null,
      minGrams: 100,
      maxGrams: 350,
      durationMinutes: 240,
      shortDescription: 'Pequenas cápsulas aplicadas fio a fio com queratina. Maior naturalidade.',
      longDescription: 'Pequenas cápsulas aplicadas fio a fio com queratina. Maior naturalidade.',
      observations: 'Venha com o cabelo limpo.',
      priceTable: [
        { id: 'micro_100g', grams: '100g', order: 1, active: true, lengths: [
          { id: 'micro_100g_60', size: '60/65/70cm', price: 590, order: 1, active: true },
          { id: 'micro_100g_75', size: '75/80cm', price: 660, order: 2, active: true },
        ] },
        { id: 'micro_150g', grams: '150g', order: 2, active: true, lengths: [
          { id: 'micro_150g_60', size: '60/65/70cm', price: 780, order: 1, active: true },
          { id: 'micro_150g_75', size: '75/80cm', price: 885, order: 2, active: true },
        ] },
        { id: 'micro_200g', grams: '200g', order: 3, active: true, lengths: [
          { id: 'micro_200g_60', size: '60/65/70cm', price: 1040, order: 1, active: true },
          { id: 'micro_200g_75', size: '75/80cm', price: 1180, order: 2, active: true },
        ] },
        { id: 'micro_250g', grams: '250g', order: 4, active: true, lengths: [
          { id: 'micro_250g_60', size: '60/65/70cm', price: 1300, order: 1, active: true },
          { id: 'micro_250g_75', size: '75/80cm', price: 1475, order: 2, active: true },
        ] },
        { id: 'micro_300g', grams: '300g', order: 5, active: true, lengths: [
          { id: 'micro_300g_60', size: '60/65/70cm', price: 1560, order: 1, active: true },
          { id: 'micro_300g_75', size: '75/80cm', price: 1770, order: 2, active: true },
        ] },
        { id: 'micro_350g', grams: '350g', order: 6, active: true, lengths: [
          { id: 'micro_350g_60', size: '60/65/70cm', price: 1820, order: 1, active: true },
          { id: 'micro_350g_75', size: '75/80cm', price: 2065, order: 2, active: true },
        ] },
      ],
      extraQuestions: [],
      order: 3,
      active: true,
    },
    {
      id: 'invisible-hair',
      name: 'Invisible Hair Extensions (Fita Adesiva)',
      category: 'Extensões / Fibra Russa',
      subcategory: 'Aplicação do Megahair',
      price: 0,
      priceLabel: 'Tabela por gramas e tamanho',
      pricePerGram: null,
      minGrams: 100,
      maxGrams: 350,
      durationMinutes: 120,
      shortDescription: 'Fitas adesivas ultrafinas e invisíveis. Aplicação rápida e discreta.',
      longDescription: 'Fitas adesivas ultrafinas e invisíveis. Aplicação rápida e discreta.',
      observations: 'Venha com o cabelo limpo.',
      priceTable: [
        { id: 'hair_100g', grams: '100g', order: 1, active: true, lengths: [
          { id: 'hair_100g_60', size: '60/65/70cm', price: 440, order: 1, active: true },
          { id: 'hair_100g_75', size: '75/80cm', price: 510, order: 2, active: true },
        ] },
        { id: 'hair_150g', grams: '150g', order: 2, active: true, lengths: [
          { id: 'hair_150g_60', size: '60/65/70cm', price: 525, order: 1, active: true },
          { id: 'hair_150g_75', size: '75/80cm', price: 630, order: 2, active: true },
        ] },
        { id: 'hair_200g', grams: '200g', order: 3, active: true, lengths: [
          { id: 'hair_200g_60', size: '60/65/70cm', price: 660, order: 1, active: true },
          { id: 'hair_200g_75', size: '75/80cm', price: 800, order: 2, active: true },
        ] },
        { id: 'hair_250g', grams: '250g', order: 4, active: true, lengths: [
          { id: 'hair_250g_60', size: '60/65/70cm', price: 800, order: 1, active: true },
          { id: 'hair_250g_75', size: '75/80cm', price: 975, order: 2, active: true },
        ] },
        { id: 'hair_300g', grams: '300g', order: 5, active: true, lengths: [
          { id: 'hair_300g_60', size: '60/65/70cm', price: 930, order: 1, active: true },
          { id: 'hair_300g_75', size: '75/80cm', price: 1140, order: 2, active: true },
        ] },
        { id: 'hair_350g', grams: '350g', order: 6, active: true, lengths: [
          { id: 'hair_350g_60', size: '60/65/70cm', price: 1085, order: 1, active: true },
          { id: 'hair_350g_75', size: '75/80cm', price: 1330, order: 2, active: true },
        ] },
      ],
      extraQuestions: [],
      order: 4,
      active: true,
    },
    {
      id: 'svc_maintenance_point',
      name: 'Ponto Americano',
      category: 'Manutenção do Megahair',
      subcategory: 'Manutenção',
      price: 260,
      priceLabel: 'R$ 260',
      pricePerGram: null,
      minGrams: null,
      maxGrams: null,
      durationMinutes: 120,
      shortDescription: 'Manutenção de ponto americano.',
      longDescription: '',
      observations: 'Venha com o cabelo limpo.',
      extraQuestions: [],
      order: 2,
      active: true,
    },
    {
      id: 'svc_maintenance_tape',
      name: 'Fita Adesiva',
      category: 'Manutenção do Megahair',
      subcategory: 'Manutenção',
      price: 290,
      priceLabel: 'R$ 290',
      pricePerGram: null,
      minGrams: null,
      maxGrams: null,
      durationMinutes: 120,
      shortDescription: 'Manutenção de fita adesiva.',
      longDescription: '',
      observations: 'Venha com o cabelo limpo.',
      extraQuestions: [],
      order: 3,
      active: true,
    },
    {
      id: 'svc_maintenance_interlace',
      name: 'Entrelace',
      category: 'Manutenção do Megahair',
      subcategory: 'Manutenção',
      price: 360,
      priceLabel: 'R$ 360',
      pricePerGram: null,
      minGrams: null,
      maxGrams: null,
      durationMinutes: 150,
      shortDescription: 'Manutenção de entrelace.',
      longDescription: '',
      observations: 'Venha com o cabelo limpo.',
      extraQuestions: [],
      order: 4,
      active: true,
    },
    {
      id: 'svc_maintenance_keratin',
      name: 'Queratina',
      category: 'Manutenção do Megahair',
      subcategory: 'Manutenção',
      price: 500,
      priceLabel: 'R$ 500 por 100 gramas',
      pricePerGram: 5,
      minGrams: 100,
      maxGrams: null,
      durationMinutes: 180,
      shortDescription: 'Manutenção de queratina por 100 gramas.',
      longDescription: '',
      observations: 'Venha com o cabelo limpo.',
      extraQuestions: [],
      order: 5,
      active: true,
    },
  ],
  beforeAfterItems: [],
  videoItems: [],
  faqItems: DEFAULT_FAQ_ITEMS,
  schedulingSettings: {
    slotIntervalMinutes: 60,
    defaultDurationMinutes: 60,
    businessHours: [
      { day: 0, label: 'Domingo', active: false, start: '09:00', end: '13:00', breaks: [] },
      { day: 1, label: 'Segunda', active: true, start: '09:00', end: '18:00', breaks: [] },
      { day: 2, label: 'Terça', active: true, start: '09:00', end: '18:00', breaks: [] },
      { day: 3, label: 'Quarta', active: true, start: '09:00', end: '18:00', breaks: [] },
      { day: 4, label: 'Quinta', active: true, start: '09:00', end: '18:00', breaks: [] },
      { day: 5, label: 'Sexta', active: true, start: '09:00', end: '18:00', breaks: [] },
      { day: 6, label: 'Sábado', active: true, start: '09:00', end: '13:00', breaks: [] },
    ],
    manualBlocks: [],
  },
}

function cloneDefaultConfig(): AdminOperationalConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as AdminOperationalConfig
}

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }
  if (typeof value === 'object') return value as T
  return fallback
}

function mergeDefaultsById<T extends { id: string; order?: number }>(
  current: T[] | undefined,
  defaults: T[]
) {
  if (!Array.isArray(current)) return defaults
  const seen = new Set(current.map((item) => item.id))
  return [
    ...current,
    ...defaults.filter((item) => !seen.has(item.id)),
  ].sort((a, b) => Number(a.order || 999) - Number(b.order || 999))
}

async function ensureAdminConfigStore() {
  if (bootstrapPromise) return bootstrapPromise

  bootstrapPromise = (async () => {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AdminOperationalConfig" (
        "section" TEXT PRIMARY KEY,
        "content_json" JSONB NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
  })()

  return bootstrapPromise
}

function normalizeConfig(input: Partial<AdminOperationalConfig>): AdminOperationalConfig {
  const defaults = cloneDefaultConfig()
  return {
    flowItems: mergeDefaultsById(input.flowItems, defaults.flowItems),
    services: mergeDefaultsById(input.services, defaults.services),
    beforeAfterItems: Array.isArray(input.beforeAfterItems)
      ? input.beforeAfterItems
      : defaults.beforeAfterItems,
    videoItems: Array.isArray(input.videoItems) ? input.videoItems : defaults.videoItems,
    faqItems: Array.isArray(input.faqItems) ? input.faqItems : defaults.faqItems,
    schedulingSettings:
      input.schedulingSettings && typeof input.schedulingSettings === 'object'
        ? {
            ...defaults.schedulingSettings,
            ...input.schedulingSettings,
            businessHours: Array.isArray(input.schedulingSettings.businessHours)
              ? input.schedulingSettings.businessHours
              : defaults.schedulingSettings.businessHours,
            manualBlocks: Array.isArray(input.schedulingSettings.manualBlocks)
              ? input.schedulingSettings.manualBlocks
              : defaults.schedulingSettings.manualBlocks,
          }
        : defaults.schedulingSettings,
  }
}

export async function getAdminOperationalConfig(): Promise<AdminOperationalConfig> {
  await ensureAdminConfigStore()

  const rows = await db.$queryRawUnsafe<ConfigRow[]>(
    `SELECT "section", "content_json" FROM "AdminOperationalConfig"`
  )

  const merged = cloneDefaultConfig()

  for (const row of rows) {
    const section = row.section
    if (section in merged) {
      ;(merged as any)[section] = parseJsonField(row.content_json, (merged as any)[section])
    }
  }

  return normalizeConfig(merged)
}

export async function saveAdminOperationalConfig(
  input: Partial<AdminOperationalConfig>
): Promise<AdminOperationalConfig> {
  await ensureAdminConfigStore()
  const current = await getAdminOperationalConfig()
  const next = normalizeConfig({ ...current, ...input })
  const sections = Object.keys(next) as ConfigSection[]

  for (const section of sections) {
    await db.$executeRawUnsafe(
      `
        INSERT INTO "AdminOperationalConfig" ("section", "content_json", "updated_at")
        VALUES ($1, $2::jsonb, NOW())
        ON CONFLICT ("section")
        DO UPDATE SET "content_json" = EXCLUDED."content_json", "updated_at" = NOW()
      `,
      section,
      JSON.stringify(next[section])
    )
  }

  return next
}

export async function getPublicChatbotConfig() {
  const config = await getAdminOperationalConfig()
  return {
    flowItems: config.flowItems
      .filter((item) => item.active)
      .sort((a, b) => a.order - b.order),
    services: config.services
      .filter((item) => item.active)
      .sort((a, b) => a.order - b.order),
    beforeAfterItems: config.beforeAfterItems
      .filter((item) => item.active)
      .sort((a, b) => a.order - b.order),
    videoItems: config.videoItems
      .filter((item) => item.active)
      .sort((a, b) => a.order - b.order),
    faqItems: config.faqItems
      .filter((item) => item.active)
      .sort((a, b) => a.order - b.order),
    schedulingSettings: config.schedulingSettings,
  }
}

export function getDefaultSchedulingSettings() {
  return cloneDefaultConfig().schedulingSettings
}
