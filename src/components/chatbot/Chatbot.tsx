'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Bot, User, ArrowLeft, Calendar, Clock, CreditCard, Check } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ChatMessage {
  id: string
  type: 'bot' | 'user'
  content: string
  data?: any
  timestamp: Date
}

interface ChatbotProps {
  isOpen: boolean
  onClose: () => void
  initialMessage?: string
  preSelectedCategory?: ServiceCategory | null
  preSelectedService?: Service | null
  promoData?: {
    serviceName: string
    price: string
  }
}

interface ServiceCategory {
  id: string
  name: string
  nameEmoji: string
  description: string
  image?: string
}

interface Service {
  id: string
  name: string
  description: string
  images?: string[]
  durationMinutes: number
  priceInfo: {
    tiers?: Array<{ name: string; price: number }>
    table?: Array<{ grams: string; lengths: Array<{ size: string; price: number }> }>
    fixedPrice?: number
  }
}

type CustomerFormData = {
  name: string
  phone: string
  email: string
  age: string
  allergies: string
  megaHairHistory: string
  hairType: string
  hairColor: string
  hairState: string
  methods: string
}

type PrimaryFlow = 'evaluation' | 'maintenance' | 'application' | 'faq' | null

type MaintenanceOption = {
  label: string
  value: string
  price: number
  priceLabel: string
}

type FAQItem = {
  question: string
  answer: string
}

const QUESTION_FIELD_MAP: Array<keyof CustomerFormData> = [
  'name',
  'phone',
  'email',
  'age',
  'allergies',
  'megaHairHistory',
  'hairType',
  'hairColor',
  'hairState',
  'methods',
]

const EMPTY_CUSTOMER_DATA: CustomerFormData = {
  name: '',
  phone: '',
  email: '',
  age: '',
  allergies: '',
  megaHairHistory: '',
  hairType: '',
  hairColor: '',
  hairState: '',
  methods: '',
}

const EXTENSION_CATEGORY: ServiceCategory = {
  id: 'extensoes',
  name: 'Extensões / Fibra Russa',
  nameEmoji: '💖',
  description: 'Comprimento e volume com técnicas invisíveis',
  image: '/images/services/extensions-destaque.png',
}

const MAINTENANCE_OPTIONS: MaintenanceOption[] = [
  {
    label: 'Ponto Americano',
    value: 'ponto-americano',
    price: 260,
    priceLabel: 'R$ 260',
  },
  {
    label: 'Fita Adesiva',
    value: 'fita-adesiva',
    price: 290,
    priceLabel: 'R$ 290',
  },
  {
    label: 'Entrelace',
    value: 'entrelace',
    price: 360,
    priceLabel: 'R$ 360',
  },
  {
    label: 'Queratina',
    value: 'queratina',
    price: 500,
    priceLabel: 'R$ 500 por 100 gramas',
  },
]

const HAIR_SITUATIONS = [
  'Vou usar o mesmo cabelo',
  'Vou fazer manutenção com cabelo novo',
  'Tirei o cabelo em casa e quero só fazer a aplicação',
]

const ADDITIONAL_SERVICES = [
  'Escova',
  'Hidratação',
  'Botox selante',
  'Botox progressiva',
  'Coloração',
]

const MAINTENANCE_KIT_ITEMS = [
  'Óleo reparador',
  'Escova raquete',
  'Touca de cetim',
  'Fronha de cetim',
  'Xuxinha de cetim',
  'Reparador para fibra',
]

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'Posso agendar um horário?',
    answer: 'Sim, mas o atendimento é realizado somente com horário marcado.',
  },
  {
    question: 'Qual a textura e aparência das Fibras Russas?',
    answer:
      'As Fibras Russas têm textura fina e leve, proporcionando toque natural. A aparência é super natural, com fios alinhados, menos espessos, resistentes, macios e maleáveis. São produzidas com tecnologia premium para garantir beleza e qualidade.',
  },
  {
    question: 'Quais são as formas de pagamento?',
    answer:
      'Aceitamos dinheiro e pix sem acréscimo. Cartões de débito e crédito parcelado têm acréscimo da taxa da maquininha.',
  },
  {
    question: 'Qual a durabilidade?',
    answer:
      'A durabilidade da Fibra Russa varia de 1 a 6 meses, dependendo dos cuidados e da forma como ela é adaptada ao seu uso diário.',
  },
  {
    question: 'É igual a cabelo de boneca?',
    answer:
      'Não. A Fibra Russa é muito mais avançada. Ela foi desenvolvida para imitar o cabelo natural com mais precisão, tanto na aparência quanto na textura.',
  },
  {
    question: 'Como funciona a técnica ponto americano invisível?',
    answer:
      'Cada mecha é presa ao cabelo natural usando uma argolinha de metal revestida internamente com silicone para proteger o fio. É um método seguro, reutilizável, que não danifica os fios, e as mechas podem ser reaproveitadas.',
  },
  {
    question: 'O que é microlink?',
    answer:
      'São pequenos anéis, geralmente feitos de metal ou com revestimento interno, utilizados para prender as mechas de cabelo e formar uma base para a costura da tela do mega hair.',
  },
  {
    question: 'Qual é o endereço?',
    answer:
      'Estamos na Rua Castro Alves, 6-37, próximo à antiga CPFL (casa com portão cinza). Esperamos você no nosso espaço.',
  },
  {
    question: 'A fibra russa é realmente igual ao cabelo humano?',
    answer:
      'Não exatamente. A fibra russa é sintética premium. Ela é de alta qualidade e tem aparência muito natural, mas não possui cutícula como o cabelo humano.',
  },
  {
    question: 'Vocês fazem aplique?',
    answer: 'Sim, fazemos aplique TIC-TAC e Ponytail (rabo de cavalo), por encomenda.',
  },
  {
    question: 'Quanto tempo dura a manutenção?',
    answer:
      'O tempo pode variar conforme a técnica e a quantidade de cabelo, mas informamos tudo certinho no momento do agendamento.',
  },
  {
    question: 'Preciso ir com o cabelo limpo?',
    answer:
      'Sim. Para manutenção e aplicação, orientamos que você venha com o cabelo limpo para facilitar o atendimento e garantir melhor resultado.',
  },
  {
    question: 'Posso lavar normalmente depois do procedimento?',
    answer:
      'Sim, mas é importante seguir as orientações de cuidado e manutenção para aumentar a durabilidade e preservar a beleza do resultado.',
  },
  {
    question: 'Vocês vendem kit de manutenção?',
    answer:
      'Sim. Temos opções de kit de manutenção com itens que ajudam a cuidar melhor do mega hair no dia a dia.',
  },
  {
    question: 'Posso fazer coloração junto com o atendimento?',
    answer:
      'Sim. Dependendo do caso, você pode acrescentar serviços como coloração, hidratação, escova e outros adicionais no momento do agendamento.',
  },
  {
    question: 'Quem faz manutenção pode usar o mesmo cabelo?',
    answer:
      'Sim, se o cabelo estiver em boas condições. Também atendemos quem vai colocar cabelo novo ou quem retirou em casa e quer somente a aplicação.',
  },
]

const Chatbot: React.FC<ChatbotProps> = ({
  isOpen,
  onClose,
  initialMessage,
  preSelectedCategory,
  preSelectedService,
  promoData,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [modalImageUrl, setModalImageUrl] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [customerData, setCustomerData] = useState<CustomerFormData>(EMPTY_CUSTOMER_DATA)
  const [questionnaireStarted, setQuestionnaireStarted] = useState(false)

  // Options for form questions
  const questionOptions: Record<number, { label: string; value: string }[]> = {
    3: [ // Age
      { label: '18-25 anos', value: '18-25 anos' },
      { label: '26-35 anos', value: '26-35 anos' },
      { label: '36-45 anos', value: '36-45 anos' },
      { label: '46-55 anos', value: '46-55 anos' },
      { label: '56+ anos', value: '56+ anos' }
    ],
    4: [ // Allergies
      { label: 'Nenhuma', value: 'Nenhuma' },
      { label: 'Produtos capilares', value: 'Produtos capilares' },
      { label: 'Químicos', value: 'Químicos' },
      { label: 'Outros', value: 'Outros' }
    ],
    5: [ // Mega Hair History
      { label: 'Nunca fiz', value: 'Nunca fiz' },
      { label: 'Já fiz uma vez', value: 'Já fiz uma vez' },
      { label: 'Já fiz várias vezes', value: 'Já fiz várias vezes' }
    ],
    6: [ // Hair Type
      { label: 'Liso', value: 'Liso' },
      { label: 'Ondulado', value: 'Ondulado' },
      { label: 'Cacheado', value: 'Cacheado' },
      { label: 'Crespo', value: 'Crespo' }
    ],
    7: [ // Hair Color
      { label: 'Preto', value: 'Preto' },
      { label: 'Castanho', value: 'Castanho' },
      { label: 'Loiro', value: 'Loiro' },
      { label: 'Ruivo', value: 'Ruivo' },
      { label: 'Grisalho', value: 'Grisalho' }
    ],
    8: [ // Hair State
      { label: 'Saudável', value: 'Saudável' },
      { label: 'Ressecado', value: 'Ressecado' },
      { label: 'Com pontas duplas', value: 'Com pontas duplas' },
      { label: 'Quimicamente tratado', value: 'Quimicamente tratado' }
    ],
    9: [ // Methods used
      { label: 'Nenhum', value: 'Nenhum' },
      { label: 'Progressiva', value: 'Progressiva' },
      { label: 'Botox Capilar', value: 'Botox Capilar' },
      { label: 'Tintura', value: 'Tintura' },
      { label: 'Alisamentos', value: 'Alisamentos' }
    ]
  }
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedOption, setSelectedOption] = useState<any>(null)
  const [primaryFlow, setPrimaryFlow] = useState<PrimaryFlow>(null)
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceOption | null>(null)
  const [hairSituation, setHairSituation] = useState('')
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [selectedKitItems, setSelectedKitItems] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix')
  const [inputValue, setInputValue] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasAutoScrolledCategories = useRef(false)

  useEffect(() => {
    if (!isOpen) return
    if (preSelectedCategory) setSelectedCategory(preSelectedCategory)
    if (preSelectedService) setSelectedService(preSelectedService)
  }, [isOpen, preSelectedCategory, preSelectedService])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Garantir que o card de Mega Hair fique em evidência quando a lista de categorias aparece
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage?.data?.showCategories) return
    if (hasAutoScrolledCategories.current) return
    hasAutoScrolledCategories.current = true
    setTimeout(() => {
      const megaHairCard = document.getElementById('chat-cat-extensoes')
      megaHairCard?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }, [messages])

  useEffect(() => {
    if (!isOpen) {
      hasAutoScrolledCategories.current = false
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setCurrentQuestionIndex(0)
      if (initialMessage) {
        addMessage('user', initialMessage)
        handlePromoInitiation(initialMessage)
      } else {
        initializeChat()
      }
    }
  }, [isOpen])

  const showMainMenu = () => {
    addMessage(
      'bot',
      'Olá, seja bem-vinda! Como posso te ajudar hoje?\nSelecione uma opção:',
      { showMainMenu: true }
    )
  }

  const handlePromoInitiation = (msg: string) => {
    setIsLoading(true)
    setTimeout(() => {
      addMessage(
        'bot',
        'Oi! Vi seu interesse e vou te ajudar a seguir pelo melhor caminho.'
      )
      setTimeout(() => {
        showMainMenu()
        setIsLoading(false)
      }, 800)
    }, 500)
  }

  const addMessage = (type: 'bot' | 'user', content: string, data?: any) => {
    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      data,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
  }

  const clearMessageFlag = (flag: string) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.data?.[flag]
          ? { ...message, data: { ...message.data, [flag]: false } }
          : message
      )
    )
  }

  const clearAccountRedirectPrompt = () => {
    setMessages((prev) =>
      prev.map((message) =>
        message.data?.showAccountRedirect
          ? { ...message, data: { ...message.data, showAccountRedirect: false } }
          : message
      )
    )
  }

  const handleAccountRedirect = (accountUrl = '/account?tab=appointments') => {
    clearAccountRedirectPrompt()
    window.location.href = accountUrl
  }

  const handleSkipAccountRedirect = () => {
    clearAccountRedirectPrompt()
    addMessage('user', 'Agora não')
    addMessage(
      'bot',
      'Tudo certo. Quando quiser conferir seus serviços agendados, acesse o painel do cliente pelo menu Minha Conta.'
    )
  }

  const initializeChat = async () => {
    setIsLoading(true)
    setTimeout(() => {
      addMessage(
        'bot',
        'Oi, seja muito bem-vinda 💕\n\nVou te ajudar a escolher o melhor caminho para o seu atendimento.'
      )
      setTimeout(() => {
        if (preSelectedCategory) {
          handleCategorySelect(preSelectedCategory, { silentUserMessage: true })
        } else {
          showMainMenu()
        }
        setIsLoading(false)
      }, 800)
    }, 500)
  }

  const fluxoAvaliacao = () => {
    setPrimaryFlow('evaluation')
    setSelectedCategory(null)
    setSelectedService({
      id: 'avaliacao',
      name: 'Avaliação',
      description: 'Avaliação personalizada para entender seu cabelo e indicar o melhor serviço.',
      durationMinutes: 15,
      priceInfo: {
        fixedPrice: 0,
      },
    })
    setSelectedOption({ name: 'Avaliação', price: 0 })
    addMessage('bot', 'Perfeito! A avaliação tem duração de 15 minutos.')
    setIsLoading(true)
    beginCustomerDataCollection()
  }

  const fluxoManutencao = () => {
    setPrimaryFlow('maintenance')
    setSelectedCategory(EXTENSION_CATEGORY)
    setSelectedService({
      id: 'manutencao-megahair',
      name: 'Manutenção do Megahair',
      description: 'Manutenção profissional para preservar conforto, segurança e acabamento natural.',
      durationMinutes: 120,
      priceInfo: {
        fixedPrice: 0,
      },
    })
    setSelectedOption(null)
    setMaintenanceType(null)
    setHairSituation('')
    setSelectedAddons([])
    setSelectedKitItems([])
    addMessage('bot', 'Perfeito! Vamos agendar sua manutenção de mega hair.')
    setTimeout(() => {
      addMessage('bot', 'Selecione o tipo de manutenção:', {
        showMaintenanceTypes: true,
      })
    }, 500)
  }

  const fluxoAplicacao = async () => {
    setPrimaryFlow('application')
    setMaintenanceType(null)
    setHairSituation('')
    setSelectedAddons([])
    setSelectedKitItems([])
    addMessage('bot', 'Perfeito! Vamos seguir com sua aplicação de mega hair.')
    await handleCategorySelect(EXTENSION_CATEGORY, {
      silentUserMessage: true,
      introText: 'Escolha a técnica de aplicação que deseja conhecer e agendar:',
    })
  }

  const fluxoFAQ = () => {
    setPrimaryFlow('faq')
    addMessage('bot', 'Claro. Escolha uma pergunta abaixo para ver a resposta:', {
      showFAQ: true,
    })
  }

  const handleMainOptionSelect = (option: PrimaryFlow) => {
    clearMessageFlag('showMainMenu')
    if (option === 'evaluation') {
      addMessage('user', 'Agendar avaliação', {})
      fluxoAvaliacao()
      return
    }

    if (option === 'maintenance') {
      addMessage('user', 'Manutenção do Megahair', {})
      fluxoManutencao()
      return
    }

    if (option === 'application') {
      addMessage('user', 'Aplicação do Megahair', {})
      void fluxoAplicacao()
      return
    }

    if (option === 'faq') {
      addMessage('user', 'Perguntas e Respostas', {})
      fluxoFAQ()
    }
  }

  const handleCategorySelect = async (
    category: ServiceCategory,
    options: { silentUserMessage?: boolean; introText?: string } = {}
  ) => {
    if (!options.silentUserMessage) {
      addMessage('user', category.nameEmoji + ' ' + category.name, category)
    }
    setIsLoading(true)
    setSelectedCategory(category)

    try {
      const response = await fetch(`/api/chatbot/services?category=${category.id}`)
      const data = await response.json()

      setTimeout(() => {
        addMessage(
          'bot',
          options.introText || 'Perfeito! Aqui estão os serviços disponíveis nessa categoria:',
          { services: data.services }
        )
        setIsLoading(false)
      }, 800)
    } catch (error) {
      console.error('Error fetching services:', error)
      setIsLoading(false)
    }
  }

  const handleServiceSelect = async (service: Service) => {
    addMessage('user', service.name, service)
    setIsLoading(true)
    setSelectedService(service)

    setTimeout(() => {
      addMessage('bot', 'Ótima escolha! 💕\n\nVou te mostrar os detalhes deste serviço e você pode ver resultados reais de clientes!', { showDetails: true, service })
      setIsLoading(false)
    }, 800)
  }

  const handleBookService = () => {
    addMessage('user', 'Quero agendar este serviço!', {})
    setIsLoading(true)

    setTimeout(() => {
      addMessage('bot', 'Perfeito! Agora vamos escolher a opção que melhor te atende:', { showOptions: true, service: selectedService })
      setIsLoading(false)
    }, 800)
  }

  const fetchLoggedCustomerPrefill = async (input?: {
    fallbackEmail?: string
  }): Promise<{
    isLoggedIn: boolean
    data: Partial<CustomerFormData>
  }> => {
    const wait = (ms: number) =>
      new Promise((resolve) => {
        setTimeout(resolve, ms)
      })

    try {
      let profileUser: any = null
      let sessionUser: any = null
      let isLoggedIn = false

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const profileResponse = await fetch('/api/account/profile', {
          cache: 'no-store',
        })
        if (profileResponse.ok) {
          const profileData = await profileResponse.json().catch(() => null)
          profileUser = profileData?.user || null
          isLoggedIn = Boolean(profileUser?.id)
          if (isLoggedIn) break
        }

        const sessionResponse = await fetch('/api/auth/session', { cache: 'no-store' })
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json().catch(() => null)
          sessionUser = sessionData?.user || null
          isLoggedIn = Boolean(sessionUser?.id)
          if (isLoggedIn) break
        }

        if (attempt < 2) {
          await wait(250)
        }
      }

      if (!isLoggedIn) {
        return {
          isLoggedIn: false,
          data: input?.fallbackEmail
            ? { email: String(input.fallbackEmail).trim().toLowerCase() }
            : {},
        }
      }

      const prefill: Partial<CustomerFormData> = {
        name: String(profileUser?.name || sessionUser?.name || '').trim(),
        email: String(
          profileUser?.email || sessionUser?.email || input?.fallbackEmail || ''
        )
          .trim()
          .toLowerCase(),
      }

      let phone = ''
      try {
        const addressResponse = await fetch('/api/account/addresses', {
          cache: 'no-store',
        })
        if (addressResponse.ok) {
          const addressData = await addressResponse.json().catch(() => ({}))
          const addresses = Array.isArray(addressData?.addresses)
            ? addressData.addresses
            : []
          const preferredAddress =
            addresses.find((item: any) => item?.isDefault) || addresses[0]
          phone = String(preferredAddress?.phone || '').trim()
        }
      } catch (error) {
        console.warn('Nao foi possivel buscar telefone em enderecos:', error)
      }

      if (!phone) {
        try {
          const appointmentsResponse = await fetch('/api/account/appointments', {
            cache: 'no-store',
          })
          if (appointmentsResponse.ok) {
            const appointmentsData = await appointmentsResponse.json().catch(() => ({}))
            const appointments = Array.isArray(appointmentsData?.appointments)
              ? appointmentsData.appointments
              : []
            const withPhone = appointments.find(
              (item: any) => String(item?.customerPhone || '').trim().length > 0
            )
            phone = String(withPhone?.customerPhone || '').trim()
          }
        } catch (error) {
          console.warn('Nao foi possivel buscar telefone em agendamentos:', error)
        }
      }

      if (phone) {
        prefill.phone = phone
      }

      return { isLoggedIn: true, data: prefill }
    } catch (error) {
      console.warn('Nao foi possivel validar sessao para prefill do chatbot:', error)
      return { isLoggedIn: false, data: {} }
    }
  }

  const startQuestionnaireFlow = (
    dataSnapshot: CustomerFormData,
    introText?: string
  ) => {
    if (questionnaireStarted) return

    let startIndex = QUESTION_FIELD_MAP.findIndex((field) => {
      return String(dataSnapshot[field] || '').trim().length === 0
    })

    if (startIndex < 0) {
      startIndex = 3
    }

    const question = getNextQuestion(startIndex, dataSnapshot)
    if (!question) {
      showDateSelection()
      return
    }

    setQuestionnaireStarted(true)
    setCurrentQuestionIndex(startIndex)
    const intro = introText
      ? `${introText}\n\n${question.question}`
      : `Ótimo! 💕 Agora preciso de algumas informações para personalizar seu atendimento.\n\n${question.question}`
    addMessage('bot', intro, {
      questionOptions: question.options,
      questionIndex: question.questionIndex,
    })
  }

  const handleLoginPromptSelection = async () => {
    addMessage('user', 'Entrar com minha conta', {})
    setIsLoading(true)

    try {
      const emailInput = window.prompt(
        'Informe seu e-mail cadastrado para preencher automaticamente os dados:',
        customerData.email || ''
      )
      const email = String(emailInput || '').trim().toLowerCase()
      if (!email) {
        addMessage(
          'bot',
          'Sem e-mail informado. Você pode tentar login novamente ou continuar manualmente.',
          { showLoginPrompt: true }
        )
        return
      }

      const password = window.prompt('Digite sua senha para entrar:')
      if (!password) {
        addMessage(
          'bot',
          'Login cancelado. Você pode continuar manualmente ou tentar novamente.',
          { showLoginPrompt: true }
        )
        return
      }

      const loginResult = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })

      if (loginResult?.error) {
        addMessage(
          'bot',
          'Nao foi possivel autenticar. Verifique e-mail/senha ou continue preenchendo manualmente.',
          { showLoginPrompt: true }
        )
        return
      }

      const prefillResult = await fetchLoggedCustomerPrefill({ fallbackEmail: email })
      const mergedData: CustomerFormData = {
        ...customerData,
        email,
        ...prefillResult.data,
      }
      setCustomerData(mergedData)

      const identifiedParts = [
        mergedData.name ? `Nome: ${mergedData.name}` : '',
        mergedData.email ? `E-mail: ${mergedData.email}` : '',
        mergedData.phone ? `Telefone: ${mergedData.phone}` : '',
      ].filter(Boolean)

      const identifiedText =
        identifiedParts.length > 0
          ? `Login realizado com sucesso. Dados identificados da sua conta:\n${identifiedParts.join('\n')}`
          : 'Login realizado com sucesso. Vamos seguir com o agendamento.'

      startQuestionnaireFlow(mergedData, identifiedText)
    } catch (error) {
      console.error('Erro ao autenticar cliente no chatbot:', error)
      addMessage(
        'bot',
        'Nao foi possivel completar o login agora. Tente novamente ou continue manualmente.',
        { showLoginPrompt: true }
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinueWithoutLogin = () => {
    addMessage('user', 'Continuar sem login', {})
    startQuestionnaireFlow(customerData, 'Tudo bem! Vamos continuar com preenchimento manual.')
  }

  const beginCustomerDataCollection = (delayMs = 800) => {
    setCurrentQuestionIndex(0)
    setQuestionnaireStarted(false)

    setTimeout(async () => {
      const prefill = await fetchLoggedCustomerPrefill()
      if (prefill.isLoggedIn) {
        const mergedData: CustomerFormData = {
          ...customerData,
          ...prefill.data,
        }
        setCustomerData(mergedData)
        startQuestionnaireFlow(
          mergedData,
          'Identifiquei sua conta e vou aproveitar seus dados cadastrados para agilizar o atendimento.'
        )
      } else {
        addMessage(
          'bot',
          'Antes de continuar: deseja fazer login para usar seus dados já cadastrados (nome, e-mail e telefone)?',
          { showLoginPrompt: true }
        )
      }
      setIsLoading(false)
    }, delayMs)
  }

  const handleOptionSelect = async (option: any) => {
    addMessage('user', `Opção: ${option.name || option.size || 'Pacote'} - R$ ${option.price}`, option)
    setIsLoading(true)
    setSelectedOption(option)

    if (primaryFlow === 'application') {
      setTimeout(() => {
        addMessage(
          'bot',
          'Observação importante: para o atendimento, venha com o cabelo limpo.'
        )
        showAdditionalServicesOffer()
        setIsLoading(false)
      }, 700)
      return
    }

    beginCustomerDataCollection()
  }

  const showAdditionalServicesOffer = () => {
    setTimeout(() => {
      addMessage('bot', 'Quer acrescentar mais algum serviço ao seu atendimento?', {
        showAdditionalServices: true,
      })
    }, 400)
  }

  const handleMaintenanceTypeSelect = (option: MaintenanceOption) => {
    clearMessageFlag('showMaintenanceTypes')
    setMaintenanceType(option)
    setSelectedOption({
      name: option.label,
      price: option.price,
      size: option.priceLabel,
    })
    addMessage('user', `${option.label} - ${option.priceLabel}`, {})
    addMessage('bot', 'Agora me informe qual é a sua situação:', {
      showHairSituations: true,
    })
  }

  const handleHairSituationSelect = (situation: string) => {
    clearMessageFlag('showHairSituations')
    setHairSituation(situation)
    addMessage('user', situation, {})
    addMessage('bot', 'Observação importante: para o atendimento, venha com o cabelo limpo.')
    showAdditionalServicesOffer()
  }

  const toggleAdditionalService = (service: string) => {
    setSelectedAddons((prev) =>
      prev.includes(service)
        ? prev.filter((item) => item !== service)
        : [...prev, service]
    )
  }

  const handleNoAdditionalServices = () => {
    clearMessageFlag('showAdditionalServices')
    setSelectedAddons([])
    addMessage('user', 'Não quero acrescentar serviços', {})
    showKitOffer()
  }

  const handleAdditionalServicesContinue = () => {
    clearMessageFlag('showAdditionalServices')
    addMessage(
      'user',
      selectedAddons.length > 0
        ? `Serviços adicionais: ${selectedAddons.join(', ')}`
        : 'Não quero acrescentar serviços',
      {}
    )
    showKitOffer()
  }

  const showKitOffer = () => {
    addMessage('bot', 'Deseja incluir também um kit de manutenção?', {
      showKitOffer: true,
    })
  }

  const handleKitOfferSelect = (includeKit: boolean) => {
    clearMessageFlag('showKitOffer')
    addMessage('user', includeKit ? 'Sim, quero incluir o kit' : 'Não, obrigado', {})
    if (includeKit) {
      setSelectedKitItems([])
      addMessage('bot', 'Selecione os itens do kit:', {
        showKitItems: true,
      })
      return
    }

    setSelectedKitItems([])
    beginCustomerDataCollection(500)
  }

  const toggleKitItem = (item: string) => {
    setSelectedKitItems((prev) =>
      prev.includes(item)
        ? prev.filter((current) => current !== item)
        : [...prev, item]
    )
  }

  const handleKitItemsContinue = () => {
    clearMessageFlag('showKitItems')
    addMessage(
      'user',
      selectedKitItems.length > 0
        ? `Kit de manutenção: ${selectedKitItems.join(', ')}`
        : 'Kit sem itens selecionados',
      {}
    )
    beginCustomerDataCollection(500)
  }

  const handleFAQSelect = (item: FAQItem) => {
    addMessage('user', item.question, {})
    addMessage('bot', item.answer, { showFAQ: true })
  }

  const handleBackToCategories = () => {
    addMessage('user', 'Voltar às categorias', {})
    setSelectedService(null)
    setSelectedOption(null)
    setQuestionnaireStarted(false)

    setTimeout(() => {
      addMessage('bot', 'Sem problemas! 💕\n\nQual tipo de serviço você está procurando?', { showCategories: true })
    }, 500)
  }

  const handleNextStep = (value: string, fieldName?: string) => {
    const field = fieldName || QUESTION_FIELD_MAP[currentQuestionIndex]

    const nextData: CustomerFormData = field
      ? ({ ...customerData, [field]: value } as CustomerFormData)
      : customerData
    setCustomerData(nextData)
    addMessage('user', value, {})

    setIsLoading(true)
    setTimeout(() => {
      let nextQIndex = currentQuestionIndex + 1
      while (
        nextQIndex < QUESTION_FIELD_MAP.length &&
        String(nextData[QUESTION_FIELD_MAP[nextQIndex]] || '').trim().length > 0
      ) {
        nextQIndex += 1
      }

      const nextQuestion = getNextQuestion(nextQIndex, nextData)
      if (nextQuestion) {
        setCurrentQuestionIndex(nextQIndex)
        addMessage('bot', nextQuestion.question, { 
          questionOptions: nextQuestion.options,
          questionIndex: nextQuestion.questionIndex
        })
      } else {
        // After all questions, show date selection
        showDateSelection()
      }
      setIsLoading(false)
    }, 500)
  }

  const getNextQuestion = (
    questionIndex: number = 0,
    dataOverride: CustomerFormData = customerData
  ) => {
	    const questions = [
	      { field: 'name', question: 'Qual é o seu nome completo?' },
	      { field: 'phone', question: `Obrigada, ${dataOverride.name || ''}! 💕\n\nQual é o seu número de telefone com DDD?` },
	      { field: 'email', question: 'Perfeito! Agora me passa seu melhor e-mail:' },
	      { field: 'age', question: 'Para personalizar seu atendimento, qual a sua idade?' },
	      { field: 'allergies', question: 'Você tem alguma alergia a produtos capilares ou químicos?' },
	      { field: 'megaHairHistory', question: 'Já fez mega hair antes? Se sim, conta um pouco sobre sua experiência:' },
	      { field: 'hairType', question: 'Qual é o seu tipo de cabelo (liso, ondulado, cacheado, crespo)?' },
	      { field: 'hairColor', question: 'Qual é a cor natural do seu cabelo?' },
	      { field: 'hairState', question: 'Como está o estado atual do seu cabelo (saudável, ressecado, com pontas duplas, quimicamente tratado)?' },
	      { field: 'methods', question: 'Quais métodos você já usou nos últimos 6 meses (progressiva, botox, tintura, alisamentos)?' }
	    ]

    if (questionIndex < questions.length) {
      const q = questions[questionIndex]
      if (q) {
        const hasOptions = questionOptions[questionIndex]
        return {
          question: q.question,
          options: hasOptions || undefined,
          questionIndex
        }
      }
    }
    return null
  }

  const showDateSelection = () => {
    addMessage('bot', 'Obrigada por todas as informações! 💕\n\nAgora vamos escolher o melhor dia e horário para seu atendimento.')
    setTimeout(() => {
      addMessage('bot', 'Selecione uma data para ver os horários disponíveis:', { showDatePicker: true })
    }, 500)
  }

  const handleDateSelect = async (date: string) => {
    // Add time component to avoid timezone offset issues (UTC vs Local)
    const dateObj = new Date(date + 'T12:00:00')
    addMessage('user', `Data: ${dateObj.toLocaleDateString('pt-BR')}`, {})
    setIsLoading(true)
    setSelectedDate(date)

    try {
      const response = await fetch(`/api/chatbot/appointments?date=${date}`)
      const data = await response.json()
      
      // Get booked slots from localStorage
      const localBookedSlots = JSON.parse(localStorage.getItem('booked_slots') || '[]')
      
      const slotsWithAvailability = data.availableSlots.map((slot: any) => {
        const slotDate = new Date(slot.time)
        
        // 1. Check exact match in localStorage
        const isExactMatch = localBookedSlots.some((bs: any) => 
          new Date(bs.date).toDateString() === slotDate.toDateString() && bs.time === slot.time
        )
        
        // 2. Check 2h interval constraint
        const hasConflict = localBookedSlots.some((bs: any) => {
          const bookedDate = new Date(bs.date)
          if (bookedDate.toDateString() !== slotDate.toDateString()) return false
          
          const bookedTime = new Date(bs.time).getTime()
          const currentSlotTime = slotDate.getTime()
          const diffInMs = Math.abs(currentSlotTime - bookedTime)
          const diffInHours = diffInMs / (1000 * 60 * 60)
          
          return diffInHours < 2 // Less than 2 hours difference
        })

        return {
          ...slot,
          isBooked: !slot.available || isExactMatch || hasConflict
        }
      })

      setTimeout(() => {
        addMessage('bot', `Aqui estão os horários disponíveis para ${dateObj.toLocaleDateString('pt-BR')}:`, { 
          showTimeSlots: true, 
          timeSlots: slotsWithAvailability 
        })
        setIsLoading(false)
      }, 800)
    } catch (error) {
      console.error('Error fetching appointments:', error)
      setIsLoading(false)
    }
  }

  const handleTimeSelect = (timeSlot: any) => {
    addMessage('user', `Horário: ${timeSlot.displayTime}`, {})
    setIsLoading(true)
    setSelectedTime(timeSlot.time)

    setTimeout(() => {
      if (primaryFlow === 'evaluation') {
        setPaymentMethod('pix')
        showConfirmation()
        setIsLoading(false)
        return
      }

      addMessage('bot', 'Perfeito! 💕\n\nQual forma de pagamento você prefere?', { showPayment: true })
      setIsLoading(false)
    }, 800)
  }

  const handlePaymentSelect = (method: 'pix' | 'card') => {
    addMessage('user', method === 'pix' ? 'Pagamento via PIX' : 'Pagamento via Cartão', {})
    setPaymentMethod(method)
    setIsLoading(true)

    setTimeout(() => {
      showConfirmation()
      setIsLoading(false)
    }, 800)
  }

  const parsePrice = (value: unknown) => {
    const normalized = String(value ?? '0')
      .replace(/[^\d,.-]/g, '')
      .replace(',', '.')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const getServiceName = () => {
    if (primaryFlow === 'evaluation') return 'Avaliação'
    if (primaryFlow === 'maintenance') return 'Manutenção do Megahair'
    if (primaryFlow === 'application') return selectedService?.name || 'Aplicação do Megahair'
    return promoData?.serviceName || selectedService?.name || 'Serviço'
  }

  const getDurationMinutes = () => {
    if (primaryFlow === 'evaluation') return 15
    return selectedService?.durationMinutes || 60
  }

  const getBasePrice = () => {
    if (primaryFlow === 'evaluation') return 0
    if (primaryFlow === 'maintenance') return maintenanceType?.price || selectedOption?.price || 0
    if (primaryFlow === 'application') {
      return parsePrice(selectedOption?.price || selectedService?.priceInfo?.fixedPrice || 0)
    }
    return parsePrice(promoData?.price || selectedOption?.price || selectedService?.priceInfo?.fixedPrice || 0)
  }

  const formatList = (items: string[], emptyText: string) =>
    items.length > 0 ? items.join(', ') : emptyText

  const showConfirmation = () => {
    const price = getBasePrice()
    const serviceName = getServiceName()
    // Adjust date for display to avoid timezone issues
    const date = selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR') : ''
    const time = selectedTime ? new Date(selectedTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''

    const questions = [
      { label: 'Nome Completo', value: customerData.name || '' },
      { label: 'Telefone com DDD', value: customerData.phone || '' },
      { label: 'E-mail', value: customerData.email || '' },
      { label: 'Idade', value: customerData.age || '' },
      { label: 'Alergias', value: customerData.allergies || 'Nenhuma' },
      { label: 'Histórico Mega Hair', value: customerData.megaHairHistory || 'Não informado' },
      { label: 'Tipo de Cabelo', value: customerData.hairType || '' },
      { label: 'Cor Natural', value: customerData.hairColor || '' },
      { label: 'Estado do Cabelo', value: customerData.hairState || '' },
      { label: 'Métodos Usados', value: customerData.methods || 'Nenhum' }
    ]

    const questionsText = questions
      .map(q => `✅ ${q.label}: ${q.value}`)
      .join('\n')

    const confirmationText = [
      `🎉 RESUMO DO SEU AGENDAMENTO 🎉`,
      ``,
      `Serviço principal: ${serviceName}`,
      `Duração: ${getDurationMinutes()} minutos`,
      ...(primaryFlow === 'maintenance'
        ? [
            `Tipo: ${maintenanceType?.label || 'Não informado'}`,
            `Valor base: ${maintenanceType?.priceLabel || `R$ ${price}`}`,
            `Situação do cabelo: ${hairSituation || 'Não informado'}`,
          ]
        : []),
      ...(primaryFlow === 'application'
        ? [
            `Serviços adicionais: ${formatList(selectedAddons, 'Nenhum')}`,
            `Kit de manutenção: ${formatList(selectedKitItems, 'Não incluído')}`,
            `Observação: Cliente orientada a vir com cabelo limpo`,
          ]
        : []),
      ...(primaryFlow === 'maintenance'
        ? [
            `Serviços adicionais: ${formatList(selectedAddons, 'Nenhum')}`,
            `Kit de manutenção: ${formatList(selectedKitItems, 'Não incluído')}`,
            `Observação: Cliente orientada a vir com cabelo limpo`,
          ]
        : []),
      `Valor: R$ ${price.toFixed(2).replace('.', ',')}`,
      ``,
      `Data: ${date}`,
      `Horário: ${time}`,
      ...(primaryFlow === 'evaluation'
        ? []
        : [`Pagamento: ${paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito/Débito'}`]),
      ``,
      `-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-`,
      ``,
      `Suas Respostas:`,
      questionsText,
      ``,
      `-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-`,
      ``,
      `Por favor, revise suas informações acima.`,
      `Para concluir, a criação/acesso da conta com senha é obrigatório.`,
      `Deseja confirmar seu agendamento?`,
      `Se quiser alterar algo, clique em Alterar informações.`
    ].join('\n')

    addMessage('bot', confirmationText, { showConfirmation: true })
  }

  const readApiError = async (response: Response, fallback: string) => {
    try {
      const data = await response.json()
      if (data?.error) return String(data.error)
      if (data?.message) return String(data.message)
    } catch {
      // ignore parse errors
    }

    try {
      const text = await response.text()
      if (text) return text
    } catch {
      // ignore text read errors
    }

    return fallback
  }

  const ensureCustomerAccount = async () => {
    try {
      const sessionResponse = await fetch('/api/auth/session', { cache: 'no-store' })
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json().catch(() => null)
        if (sessionData?.user?.id) {
          return { ok: true as const }
        }
      }
    } catch (error) {
      console.warn('Nao foi possivel validar sessao atual no chatbot:', error)
    }

    const email = String(customerData.email || '').trim().toLowerCase()
    const name = String(customerData.name || '').trim()

    if (!email || !name) {
      return {
        ok: false as const,
        error: 'Informe nome e e-mail para criar sua conta antes de concluir o agendamento.',
      }
    }

    const password = window.prompt(
      'Para concluir o agendamento, crie sua senha de acesso (mínimo 6 caracteres).'
    )

    if (!password) {
      return {
        ok: false as const,
        error: 'Cadastro cancelado. O agendamento exige criação de conta.',
      }
    }

    if (password.length < 6) {
      return {
        ok: false as const,
        error: 'A senha precisa ter pelo menos 6 caracteres.',
      }
    }

    const confirmPassword = window.prompt('Confirme sua senha para finalizar o cadastro:')
    if (!confirmPassword) {
      return {
        ok: false as const,
        error: 'Confirmação de senha cancelada.',
      }
    }

    if (password !== confirmPassword) {
      return {
        ok: false as const,
        error: 'As senhas não conferem. Tente novamente.',
      }
    }

    let emailAlreadyExists = false
    let accountCreated = false

    try {
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      if (!registerResponse.ok) {
        const registerError = await readApiError(registerResponse, 'Erro ao criar conta')
        emailAlreadyExists =
          registerResponse.status === 409 && registerError.toLowerCase().includes('email')

        if (!emailAlreadyExists) {
          return {
            ok: false as const,
            error: registerError,
          }
        }
      } else {
        accountCreated = true
      }

      const loginResult = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })

      if (loginResult?.error) {
        return {
          ok: false as const,
          error: emailAlreadyExists
            ? 'Este e-mail já possui conta. Informe a senha correta para concluir o agendamento.'
            : accountCreated
              ? 'Conta criada, mas não foi possível autenticar automaticamente. Faça login e tente novamente.'
              : 'Não foi possível autenticar sua conta.',
        }
      }

      return { ok: true as const }
    } catch (error) {
      console.error('Erro ao preparar conta da cliente no chatbot:', error)
      return {
        ok: false as const,
        error: 'Erro ao criar/acessar conta. Tente novamente.',
      }
    }
  }

  const handleBookingConfirmation = async () => {
    const price = getBasePrice()
    const serviceName = getServiceName()
    const date = selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR') : ''
    const time = selectedTime ? new Date(selectedTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''
    
    const questions = [
      { label: 'Nome', value: customerData.name || '' },
      { label: 'Telefone', value: customerData.phone || '' },
      { label: 'E-mail', value: customerData.email || '' },
      { label: 'Idade', value: customerData.age || '' },
      { label: 'Alergias', value: customerData.allergies || 'Nenhuma' },
      { label: 'Histórico Mega Hair', value: customerData.megaHairHistory || 'Não informado' },
      { label: 'Tipo de Cabelo', value: customerData.hairType || '' },
      { label: 'Cor Natural', value: customerData.hairColor || '' },
      { label: 'Estado do Cabelo', value: customerData.hairState || '' },
      { label: 'Métodos Usados', value: customerData.methods || 'Nenhum' }
    ]

    setIsLoading(true)
    const accountResult = await ensureCustomerAccount()
    if (!accountResult.ok) {
      setIsLoading(false)
      alert(`❌ ${accountResult.error}`)
      return
    }

    let googleCalendarUrl = ''
    try {
      const response = await fetch('/api/chatbot/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: customerData.name,
            phone: customerData.phone,
            email: customerData.email,
          },
          service: {
            name: serviceName,
          },
          scheduledDate: selectedTime || selectedDate,
          durationMinutes: getDurationMinutes(),
          totalPrice: price,
          grams: selectedOption?.grams || null,
          length: selectedOption?.size || selectedOption?.name || null,
          paymentMethod: paymentMethod === 'pix' ? 'PIX' : 'CARD',
          questionnaireData: {
            name: customerData.name || '',
            phone: customerData.phone || '',
            email: customerData.email || '',
            age: customerData.age || '',
            allergies: customerData.allergies || '',
            megaHairHistory: customerData.megaHairHistory || '',
            hairType: customerData.hairType || '',
            hairColor: customerData.hairColor || '',
            hairState: customerData.hairState || '',
            methods: customerData.methods || '',
            primaryFlow: primaryFlow || '',
            primaryCategory:
              primaryFlow === 'evaluation'
                ? 'Agendar avaliação'
                : primaryFlow === 'maintenance'
                  ? 'Manutenção do Megahair'
                  : primaryFlow === 'application'
                    ? 'Aplicação do Megahair'
                    : '',
            maintenanceType: maintenanceType?.label || '',
            maintenanceBasePrice: maintenanceType?.priceLabel || '',
            hairSituation: hairSituation || '',
            additionalServices: selectedAddons.join(', '),
            maintenanceKit: selectedKitItems.join(', '),
            cleanHairObservation:
              primaryFlow === 'maintenance' || primaryFlow === 'application'
                ? 'Cliente orientada a vir com cabelo limpo'
                : '',
          },
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        googleCalendarUrl = String(data.googleCalendarUrl || data.appointment?.googleCalendarUrl || '')
        const bookedSlots = JSON.parse(localStorage.getItem('booked_slots') || '[]')
        bookedSlots.push({
          date: selectedDate,
          time: selectedTime,
          expiry: Date.now() + (24 * 60 * 60 * 1000),
        })
        localStorage.setItem('booked_slots', JSON.stringify(bookedSlots))
      } else {
        const backendError = String(data?.error || 'Falha ao salvar agendamento no backend')
        console.error('Falha ao salvar agendamento no backend:', backendError)
        alert(`❌ ${backendError}`)
        return
      }
    } catch (error) {
      console.error('Erro ao salvar agendamento no backend:', error)
      alert('❌ Não foi possível concluir o agendamento. Tente novamente.')
      return
    } finally {
      setIsLoading(false)
    }

    let message = `🚀 *NOVO AGENDAMENTO - CAROLSOL STUDIO*\n\n`
    message += `*Serviço:* ${serviceName}\n`
    message += `*Duração:* ${getDurationMinutes()} minutos\n`
    if (primaryFlow === 'maintenance') {
      message += `*Tipo de manutenção:* ${maintenanceType?.label || 'Não informado'}\n`
      message += `*Situação do cabelo:* ${hairSituation || 'Não informado'}\n`
    }
    if (primaryFlow === 'maintenance' || primaryFlow === 'application') {
      message += `*Serviços adicionais:* ${formatList(selectedAddons, 'Nenhum')}\n`
      message += `*Kit de manutenção:* ${formatList(selectedKitItems, 'Não incluído')}\n`
      message += `*Observação:* Cliente orientada a vir com cabelo limpo\n`
    }
    message += `*Valor:* R$ ${price.toFixed(2).replace('.', ',')}\n`
    message += `*Data:* ${date}\n`
    message += `*Horário:* ${time}\n`
    message += `*Pagamento:* ${paymentMethod === 'pix' ? 'PIX' : 'Cartão'}\n\n`
    message += `*DADOS DA CLIENTE:*\n`
    questions.forEach(q => {
      if (q.value) message += `✅ *${q.label}:* ${q.value}\n`
    })

    if (initialMessage) {
      message += `\n*Origem:* Promoção Bio Proteína\n`
      message += `*Nota:* ${initialMessage}`
    }
    if (googleCalendarUrl) {
      message += `\n*Google Agenda:* ${googleCalendarUrl}`
    }

    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/5514998373935?text=${encodedMessage}`
    
    window.open(whatsappUrl, '_blank')
    if (googleCalendarUrl && confirm('Deseja adicionar este agendamento no Google Agenda?')) {
      window.open(googleCalendarUrl, '_blank')
    }
    setMessages((prev) =>
      prev.map((message) =>
        message.data?.showConfirmation
          ? { ...message, data: { ...message.data, showConfirmation: false } }
          : message
      )
    )
    addMessage(
      'bot',
      'Obrigada! Seu agendamento foi registrado com sucesso.\n\nDeseja ser redirecionada para o painel do cliente para verificar seus serviços agendados?',
      {
        showAccountRedirect: true,
        accountUrl: '/account?tab=appointments',
      }
    )
  }

  const startOver = () => {
    setMessages([])
    setCurrentStep(0)
    setCurrentQuestionIndex(0)
    setSelectedCategory(null)
    setSelectedService(null)
    setSelectedOption(null)
    setPrimaryFlow(null)
    setMaintenanceType(null)
    setHairSituation('')
    setSelectedAddons([])
    setSelectedKitItems([])
    setSelectedDate('')
    setSelectedTime('')
    setPaymentMethod('pix')
    setCustomerData(EMPTY_CUSTOMER_DATA)
    setQuestionnaireStarted(false)
    initializeChat()
  }

  const canAcceptFreeTextResponse = () => {
    const lastBotMessage = messages.filter((message) => message.type === 'bot').pop()
    if (!lastBotMessage) return false

    return !lastBotMessage.data?.showCategories &&
      !lastBotMessage.data?.services &&
      !lastBotMessage.data?.showDetails &&
      !lastBotMessage.data?.showOptions &&
      !lastBotMessage.data?.showDatePicker &&
      !lastBotMessage.data?.showTimeSlots &&
      !lastBotMessage.data?.showPayment &&
      !lastBotMessage.data?.showLoginPrompt &&
      !lastBotMessage.data?.showConfirmation &&
      !lastBotMessage.data?.showAccountRedirect &&
      !lastBotMessage.data?.showMainMenu &&
      !lastBotMessage.data?.showMaintenanceTypes &&
      !lastBotMessage.data?.showHairSituations &&
      !lastBotMessage.data?.showAdditionalServices &&
      !lastBotMessage.data?.showKitOffer &&
      !lastBotMessage.data?.showKitItems &&
      !lastBotMessage.data?.showFAQ
  }

  const renderMessageData = (data: any) => {
    if (!data) return null

    if (data.showMainMenu) {
      return (
        <div className="mt-4 grid grid-cols-1 gap-3">
          {[
            { label: 'Agendar avaliação', flow: 'evaluation' as PrimaryFlow },
            { label: 'Manutenção do Megahair', flow: 'maintenance' as PrimaryFlow },
            { label: 'Aplicação do Megahair', flow: 'application' as PrimaryFlow },
            { label: 'Perguntas e Respostas', flow: 'faq' as PrimaryFlow },
          ].map((option) => (
            <button
              key={option.flow}
              onClick={() => handleMainOptionSelect(option.flow)}
              className="w-full py-3 px-4 bg-white text-primary border-2 border-primary rounded-xl hover:shadow-md transition-all font-medium text-left"
            >
              {option.label}
            </button>
          ))}
        </div>
      )
    }

    if (data.showMaintenanceTypes) {
      return (
        <div className="mt-4 space-y-3">
          {MAINTENANCE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleMaintenanceTypeSelect(option)}
              className="w-full p-4 bg-gradient-to-r from-[#FFF0F5] to-white rounded-xl hover:shadow-md transition-all border border-pink-200 text-left"
            >
              <div className="flex justify-between gap-3">
                <span className="font-display font-semibold text-lg text-foreground">
                  {option.label}
                </span>
                <span className="font-bold text-primary">{option.priceLabel}</span>
              </div>
            </button>
          ))}
        </div>
      )
    }

    if (data.showHairSituations) {
      return (
        <div className="mt-4 space-y-2">
          {HAIR_SITUATIONS.map((situation) => (
            <button
              key={situation}
              onClick={() => handleHairSituationSelect(situation)}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#FFF0F5] to-white border border-pink-200 rounded-lg hover:bg-primary hover:text-white transition-all text-sm font-medium text-left"
            >
              {situation}
            </button>
          ))}
        </div>
      )
    }

    if (data.showAdditionalServices) {
      return (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-2">
            {ADDITIONAL_SERVICES.map((service) => {
              const selected = selectedAddons.includes(service)
              return (
                <button
                  key={service}
                  onClick={() => toggleAdditionalService(service)}
                  className={`w-full py-3 px-4 rounded-lg border transition-all text-sm font-medium text-left ${
                    selected
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white border-pink-200 text-foreground hover:border-pink-400'
                  }`}
                >
                  {selected ? '✓ ' : ''}{service}
                </button>
              )
            })}
          </div>
          <button
            onClick={handleAdditionalServicesContinue}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#F8B6D8] to-[#E91E63] text-white rounded-xl hover:shadow-lg transition-all font-medium"
          >
            Continuar
          </button>
          <button
            onClick={handleNoAdditionalServices}
            className="w-full py-3 px-4 bg-white text-primary border-2 border-primary rounded-xl hover:shadow-md transition-all font-medium"
          >
            Não quero acrescentar serviços
          </button>
        </div>
      )
    }

    if (data.showKitOffer) {
      return (
        <div className="mt-4 space-y-3">
          <button
            onClick={() => handleKitOfferSelect(true)}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#F8B6D8] to-[#E91E63] text-white rounded-xl hover:shadow-lg transition-all font-medium"
          >
            Sim, quero incluir o kit
          </button>
          <button
            onClick={() => handleKitOfferSelect(false)}
            className="w-full py-3 px-4 bg-white text-primary border-2 border-primary rounded-xl hover:shadow-md transition-all font-medium"
          >
            Não, obrigado
          </button>
        </div>
      )
    }

    if (data.showKitItems) {
      return (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-2">
            {MAINTENANCE_KIT_ITEMS.map((item) => {
              const selected = selectedKitItems.includes(item)
              return (
                <button
                  key={item}
                  onClick={() => toggleKitItem(item)}
                  className={`w-full py-3 px-4 rounded-lg border transition-all text-sm font-medium text-left ${
                    selected
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white border-pink-200 text-foreground hover:border-pink-400'
                  }`}
                >
                  {selected ? '✓ ' : ''}{item}
                </button>
              )
            })}
          </div>
          <button
            onClick={handleKitItemsContinue}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#F8B6D8] to-[#E91E63] text-white rounded-xl hover:shadow-lg transition-all font-medium"
          >
            Continuar
          </button>
        </div>
      )
    }

    if (data.showFAQ) {
      return (
        <div className="mt-4 space-y-2">
          {FAQ_ITEMS.map((item, index) => (
            <button
              key={item.question}
              onClick={() => handleFAQSelect(item)}
              className="w-full py-3 px-4 bg-white border border-pink-200 rounded-lg hover:border-pink-400 hover:shadow-sm transition-all text-sm font-medium text-left"
            >
              {index + 1}. {item.question}
            </button>
          ))}
          <button
            onClick={showMainMenu}
            className="w-full py-3 px-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:shadow-md transition-all font-medium"
          >
            Voltar ao menu principal
          </button>
        </div>
      )
    }

    if (data.showCategories) {
      return (
        <div className="mt-4 grid grid-cols-1 gap-3">
          {[
            { id: 'extensoes', name: 'Extensões / Fibra Russa', nameEmoji: '💖', description: 'Comprimento e volume com técnicas invisíveis', color: 'from-rose-100 to-rose-50', image: '/images/services/extensions-destaque.png' },
            { id: 'tratamentos', name: 'Tratamentos e Alinhamento', nameEmoji: '✨', description: 'Tratamentos que restauram a saúde do seu cabelo', color: 'from-purple-100 to-purple-50', image: '/images/services/tratamentos-destaque.png' },
            { id: 'alisamento', name: 'Alisamento', nameEmoji: '💇‍♀️', description: 'Alinhamento suave e natural para seu cabelo', color: 'from-pink-100 to-pink-50', image: '/images/services/alisamento-destaque.png' },
            { id: 'cronograma', name: 'Cronograma Capilar', nameEmoji: '🌸', description: 'Tratamento completo com acompanhamento semanal', color: 'from-fuchsia-100 to-fuchsia-50', image: '/images/services/cronograma-destaque.png' }
          ].map((cat: any) => (
            <button
              key={cat.id}
              id={cat.id === 'extensoes' ? 'chat-cat-extensoes' : undefined}
              onClick={() => handleCategorySelect(cat)}
              className="w-full text-left p-4 bg-white rounded-xl hover:shadow-lg transition-all border border-pink-100 hover:border-pink-300 group"
            >
              <div className="flex gap-4 items-center">
                <div className={`w-24 h-24 bg-gradient-to-br ${cat.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform overflow-hidden`}>
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.parentElement!.innerHTML = `<span class="text-5xl">${cat.emoji}</span>`
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="font-display font-bold text-xl mb-2 text-foreground leading-tight">{cat.name}</div>
                  <p className="text-base text-muted-foreground mb-0 leading-relaxed">{cat.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )
    }

    if (data.services) {
      return (
        <div className="mt-4 space-y-3">
          {data.services.map((service: Service) => (
            <div
              key={service.id}
              className="w-full text-left p-4 bg-white rounded-xl hover:shadow-lg transition-all border border-pink-100 hover:border-pink-300 group"
            >
              <div className="flex gap-4 items-start">
                <div className="w-28 h-28 bg-gradient-to-br from-pink-100 to-pink-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                  {service.images && service.images.length > 0 ? (
                    <img
                      src={service.images[0]}
                      alt={service.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.parentElement!.innerHTML = `<span class="text-6xl">💇‍♀️</span>`
                      }}
                    />
                  ) : (
                    <span className="text-6xl">💇‍♀️</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-display font-bold text-xl mb-2 text-foreground leading-tight">{service.name}</div>
                  <p className="text-base text-muted-foreground mb-3 leading-relaxed">{service.description}</p>
                  <button
                    onClick={() => handleServiceSelect(service)}
                    className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:shadow-md transition-all text-base font-medium"
                  >
                    Ver detalhes e agendar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (data.showDetails && data.service) {
      return <ServiceDetails service={data.service} onBook={handleBookService} onBack={handleBackToCategories} />
    }

    if (data.showOptions && data.service) {
      return <ServiceOptions service={data.service} onSelect={handleOptionSelect} onBack={handleBackToCategories} />
    }

    if (data.showDatePicker) {
      return (
        <div className="mt-4">
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => handleDateSelect(e.target.value)}
            className="w-full p-3 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )
    }

    if (data.showTimeSlots && data.timeSlots) {
      return (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {data.timeSlots.map((slot: any, index: number) => (
            <button
              key={index}
              onClick={() => !slot.isBooked && handleTimeSelect(slot)}
              disabled={slot.isBooked}
              className={`py-2 px-3 rounded-lg border transition-all text-sm font-medium ${
                slot.isBooked 
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60 line-through' 
                  : 'bg-gradient-to-r from-[#FFF0F5] to-white border-pink-200 hover:bg-primary hover:text-white'
              }`}
            >
              {slot.displayTime}
            </button>
          ))}
        </div>
      )
    }

    if (data.showPayment) {
      return (
        <div className="mt-4 space-y-3">
          <button
            onClick={() => handlePaymentSelect('pix')}
            className={`w-full p-4 rounded-xl transition-all border-2 ${
              paymentMethod === 'pix'
                ? 'bg-primary text-white border-primary'
                : 'bg-gradient-to-r from-[#FFF0F5] to-white border-pink-200'
            }`}
          >
            <div className="font-display font-bold text-xl mb-1">💠 PIX</div>
            <div className="text-sm">Pagamento instantâneo e seguro</div>
          </button>
          <button
            onClick={() => handlePaymentSelect('card')}
            className={`w-full p-4 rounded-xl transition-all border-2 ${
              paymentMethod === 'card'
                ? 'bg-primary text-white border-primary'
                : 'bg-gradient-to-r from-[#FFF0F5] to-white border-pink-200'
            }`}
          >
            <div className="font-display font-bold text-xl mb-1">💳 Cartão</div>
            <div className="text-sm">Crédito ou débito no local</div>
          </button>
        </div>
      )
    }

    if (data.showLoginPrompt) {
      return (
        <div className="mt-4 space-y-3">
          <button
            onClick={() => {
              void handleLoginPromptSelection()
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#F8B6D8] to-[#E91E63] text-white rounded-xl hover:shadow-lg transition-all font-medium"
          >
            Entrar e usar meus dados
          </button>
          <button
            onClick={handleContinueWithoutLogin}
            className="w-full py-3 px-4 bg-white text-primary border-2 border-primary rounded-xl hover:shadow-md transition-all font-medium"
          >
            Continuar sem login
          </button>
        </div>
      )
    }

    if (data.showConfirmation) {
      return (
        <div className="mt-4 space-y-3">
          <button
            onClick={handleBookingConfirmation}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#F8B6D8] to-[#E91E63] text-white rounded-xl hover:shadow-lg transition-all font-medium"
          >
            Confirmar
          </button>
          <button
            onClick={() => {
              setCurrentQuestionIndex(0)
              setCustomerData(EMPTY_CUSTOMER_DATA)
              setQuestionnaireStarted(false)
              setMessages(prev => {
                const questionStartIndex = prev.findIndex(m => m.content.includes('Seu nome completo?'))
                if (questionStartIndex > -1) {
                  return prev.slice(0, questionStartIndex + 1)
                }
                return prev
              })
              setTimeout(() => {
                addMessage('bot', 'Vamos recomeçar! Por favor, informe seu nome completo:')
              }, 500)
            }}
            className="w-full py-3 px-4 bg-white text-primary border-2 border-primary rounded-xl hover:shadow-md transition-all font-medium"
          >
            Alterar informações
          </button>
          <button
            onClick={startOver}
            className="w-full py-3 px-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:shadow-md transition-all font-medium"
          >
            Fazer Novo Agendamento
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-white text-gray-700 border-2 border-gray-300 rounded-xl hover:shadow-md transition-all font-medium"
          >
            Fechar
          </button>
        </div>
      )
    }

    if (data.showAccountRedirect) {
      return (
        <div className="mt-4 space-y-3">
          <button
            onClick={() => handleAccountRedirect(data.accountUrl)}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#F8B6D8] to-[#E91E63] text-white rounded-xl hover:shadow-lg transition-all font-medium"
          >
            Sim, abrir painel do cliente
          </button>
          <button
            onClick={handleSkipAccountRedirect}
            className="w-full py-3 px-4 bg-white text-primary border-2 border-primary rounded-xl hover:shadow-md transition-all font-medium"
          >
            Agora não
          </button>
        </div>
      )
    }

    if (data.questionOptions) {
      return (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {data.questionOptions.map((opt: { label: string; value: string }, index: number) => (
            <button
              key={index}
              onClick={() => {
                const questionIndex = data.questionIndex || 0
                handleNextStep(opt.value)
              }}
              className="py-3 px-4 bg-gradient-to-r from-[#FFF0F5] to-white border border-pink-200 rounded-lg hover:bg-primary hover:text-white transition-all text-sm font-medium text-left"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )
    }

    return null
  }

  const ServiceOptions = ({ service, onSelect, onBack }: { service: Service, onSelect: (option: any) => void, onBack: () => void }) => {
    const priceInfo = service.priceInfo

    return (
      <div className="mt-4 space-y-3">
        {priceInfo?.fixedPrice && (
          <button
            onClick={() => onSelect({ price: priceInfo.fixedPrice, name: 'Pacote Completo' })}
            className="w-full p-4 bg-gradient-to-r from-[#F8B6D8] to-[#E91E63] text-white rounded-xl hover:shadow-lg transition-all"
          >
            <div className="font-display font-bold text-xl mb-1">Pacote Completo</div>
            <div className="text-2xl font-bold">R$ {priceInfo.fixedPrice}</div>
          </button>
        )}

        {priceInfo?.tiers && (
          <div className="space-y-2">
            {priceInfo.tiers.map((tier: any, index: number) => (
              <button
                key={index}
                onClick={() => onSelect(tier)}
                className="w-full p-4 bg-gradient-to-r from-[#FFF0F5] to-white rounded-xl hover:shadow-md transition-all border border-pink-200 text-left"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-display font-semibold text-lg text-foreground">{tier.name}</div>
                  </div>
                  <div className="font-bold text-xl text-primary">R$ {tier.price}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {priceInfo?.table && (
          <div className="space-y-3">
            {priceInfo.table.map((row: any, rowIndex: number) => (
              <div key={rowIndex} className="bg-gradient-to-r from-[#FFF0F5] to-white rounded-xl p-4 border border-pink-200">
                <div className="font-display font-bold text-3xl mb-3 text-foreground">{row.grams}</div>
                {row.lengths.map((length: any, lengthIndex: number) => (
                  <button
                    key={lengthIndex}
                    onClick={() => onSelect({ ...length, grams: row.grams })}
                    className="w-full mt-2 p-3 bg-white rounded-lg hover:shadow-md transition-all text-left border border-pink-100"
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-medium text-foreground">{length.size}</div>
                      <div className="font-bold text-primary">R$ {length.price}</div>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onBack}
          className="w-full p-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium border border-gray-200"
        >
          Voltar para categorias
        </button>
      </div>
    )
  }

  const ServiceDetails = ({ service, onBook, onBack }: { service: Service, onBook: () => void, onBack: () => void }) => {
    const [activeTab, setActiveTab] = useState<'results' | 'video' | 'faq'>('results')

    const faqData: Record<string, { q: string; a: string }[]> = {
      'blindagem-capilar': [
        { q: 'O que é a Blindagem Capilar?', a: 'É um tratamento de hidratação e nutrição profunda que sela as cutículas com queratina e óleos, criando uma película protetora que reduz o frizz e dá brilho sem alisar.' },
        { q: 'Quanto tempo dura o efeito?', a: 'Geralmente de 3 a 4 semanas, dependendo da frequência de lavagens.' },
        { q: 'Pode fazer em cabelo tingido?', a: 'Sim! Pode ser aplicado em cabelos tintos e com mechas.' }
      ],
      'botox-capilar': [
        { q: 'O que é o Botox Capilar?', a: 'É uma reconstrução profunda que repõe massa capilar, vitaminas e aminoácidos, devolvendo o brilho e reduzindo o volume de forma natural sem químicas de alisamento.' },
        { q: 'Alisa o cabelo?', a: 'Não, o Botox Capilar não alisa. Ele reduz volume e dá brilho natural.' },
        { q: 'Quantas sessões preciso?', a: 'Para resultados ótimos, recomendamos 1 vez por mês.' }
      ],
      'progressiva-organica': [
        { q: 'O que é a Progressiva Orgânica?', a: 'É um método de alisamento natural que utiliza ativos orgânicos para reduzir o volume e alinhar os fios, oferecendo um resultado liso com aspecto saudável e menos agressivo.' },
        { q: 'Quanto tempo dura?', a: 'Em média 3 a 4 meses, dependendo do tipo de cabelo.' },
        { q: 'Posso lavar logo após?', a: 'Aguarde 48h antes da primeira lavagem para fixar melhor.' }
      ],
      'invisible-weft': [
        { q: 'O que é a tecnica Invisible Weft Extensions (Ponto Invisível)?', a: 'É uma técnica de mega hair moderna, para ser praticamente imperceptível, confortável e segura para os fios naturais, o ponto invisível utiliza telas extremamente finas costuradas rente ao couro cabeludo, criando um visual contínuo e natural.' },
        { q: 'O ponto invisível danifica o cabelo?', a: 'Não, se aplicado e removido corretamente por um profissional, pois a distribuição de peso é uniforme e não utiliza colas ou queratinas que possam quebrar os fios.' },
        { q: 'Quanto tempo dura a manutenção?', a: 'A manutenção deve ser feita a cada 45 a 60 dias, dependendo do crescimento do seu cabelo, para garantir o conforto e a discrição da técnica.' }
      ],
      'micro-capsula': [
        { q: 'O que é a Micro Cápsula de Queratina?', a: 'É uma técnica de aplicação fio a fio onde pequenas mechas de cabelo são unidas aos fios naturais usando polímero de queratina, oferecendo máxima liberdade e naturalidade.' }
      ],
      'invisible-hair': [
        { q: 'O que é o Invisible Hair Extensions (Fita Adesiva)?', a: 'É uma técnica de aplicação rápida que utiliza fitas adesivas ultrafinas e leves, que ficam totalmente planas contra a cabeça, sendo ideais para quem tem pouco cabelo ou fios finos.' }
      ],
      'cronograma-completo': [
        { q: 'O que é o Pacote Cronograma Capilar?', a: 'É um tratamento planejado de 4 semanas com sessões semanais de hidratação, nutrição e reconstrução, finalizando com uma blindagem para recuperar totalmente a saúde dos fios.' }
      ],
      'default': [
        { q: 'Preciso de teste mecha?', a: 'Recomendamos teste mecha 48h antes para serviços químicos.' },
        { q: 'Quanto tempo dura o procedimento?', a: `${service.durationMinutes} minutos aproximadamente.` },
        { q: 'Posso vir com cabelo sujo?', a: 'Depende do serviço. Geralmente recomendamos cabelo limpo.' }
      ]
    }

    const faqs = faqData[service.id] || faqData['default']

    return (
      <div className="mt-4 space-y-4">
        <div className="flex gap-2 border-b border-pink-200 pb-2">
          <button
            onClick={() => setActiveTab('results')}
            className={`flex-1 py-2 px-3 text-base font-medium rounded-lg transition-all ${
              activeTab === 'results' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            ✨ Resultados
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex-1 py-2 px-3 text-base font-medium rounded-lg transition-all ${
              activeTab === 'video' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            📹 Vídeo
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex-1 py-2 px-3 text-base font-medium rounded-lg transition-all ${
              activeTab === 'faq' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            ❓ Dúvidas
          </button>
        </div>

        <div className="min-h-[300px] max-h-[400px] overflow-y-auto">
          {activeTab === 'results' && (
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-[#FFF0F5] to-white p-4 rounded-xl border border-pink-100">
                <h4 className="font-display font-bold text-xl mb-2 leading-tight">Antes do tratamento</h4>
                <div className="w-full h-48 bg-gradient-to-br from-pink-100 to-pink-50 rounded-lg flex items-center justify-center overflow-hidden cursor-zoom-in group">
                  {service.images && service.images.length > 0 ? (
                    <img
                      src={
                        service.id === 'invisible-weft' ? '/images/antes1.png' : 
                        service.id === 'invisible-hair' ? '/images/fita1.png' : 
                        service.id === 'micro-capsula' ? '/images/queratina1.png' :
                        service.images[0]
                      }
                      alt={service.name}
                      onClick={() => {
                        const url = 
                          service.id === 'invisible-weft' ? '/images/antes1.png' : 
                          service.id === 'invisible-hair' ? '/images/fita1.png' : 
                          service.id === 'micro-capsula' ? '/images/queratina1.png' :
                          service.images![0]
                        setModalImageUrl(url)
                        setIsImageModalOpen(true)
                      }}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.parentElement!.innerHTML = `<span class="text-4xl">💇‍♀️</span>`
                      }}
                    />
                  ) : (
                    <span className="text-4xl">💇‍♀️</span>
                  )}
                </div>
              </div>
              <div className="bg-gradient-to-r from-[#F8B6D8] to-[#E91E63] p-4 rounded-xl text-white">
                <h4 className="font-display font-bold text-xl mb-2 leading-tight">Depois do tratamento ✨</h4>
                <div className="w-full h-48 bg-gradient-to-br from-white/20 to-white/40 rounded-lg flex items-center justify-center overflow-hidden cursor-zoom-in group">
                  {service.images && service.images.length > 0 ? (
                    <img
                      src={
                        service.id === 'invisible-weft' ? '/images/depois1.png' : 
                        service.id === 'invisible-hair' ? '/images/fita2.png' : 
                        service.id === 'micro-capsula' ? '/images/queratina2.png' :
                        (service.images[1] || service.images[0])
                      }
                      alt={service.name}
                      onClick={() => {
                        const url = 
                          service.id === 'invisible-weft' ? '/images/depois1.png' : 
                          service.id === 'invisible-hair' ? '/images/fita2.png' : 
                          service.id === 'micro-capsula' ? '/images/queratina2.png' :
                          (service.images![1] || service.images![0])
                        setModalImageUrl(url)
                        setIsImageModalOpen(true)
                      }}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.parentElement!.innerHTML = `<span class="text-4xl">✨</span>`
                      }}
                    />
                  ) : (
                    <span className="text-4xl">✨</span>
                  )}
                </div>
                <p className="text-base mt-2 leading-relaxed">Resultado incrível de nossas clientes satisfeitas!</p>
              </div>
            </div>
          )}

          {activeTab === 'video' && (
            <div className="bg-gradient-to-r from-[#FFF0F5] to-white p-4 rounded-xl border border-pink-100">
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📹</div>
                <h4 className="font-display font-bold text-xl mb-2 leading-tight">Vídeo de Aplicação</h4>
                <p className="text-base text-muted-foreground mb-4 leading-relaxed">Veja como é realizada a aplicação de {service.name}</p>
                <button className="bg-primary text-white py-3 px-6 rounded-xl font-medium hover:shadow-lg transition-all text-base">
                  ▶️ Assistir Vídeo
                </button>
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white border border-pink-100 rounded-xl overflow-hidden">
                  <details className="group">
                    <summary className="cursor-pointer p-4 flex justify-between items-center bg-gradient-to-r from-[#FFF0F5] to-white hover:from-[#F8B6D8] hover:to-white transition-all">
                      <span className="font-display font-semibold text-base text-foreground">{faq.q}</span>
                      <span className="text-2xl group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="p-4 bg-white border-t border-pink-100">
                      <p className="text-base text-muted-foreground leading-relaxed">{faq.a}</p>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onBook}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-[#F8B6D8] to-[#E91E63] text-white rounded-xl hover:shadow-lg transition-all font-medium"
          >
            Agendar Agora
          </button>
          <button
            onClick={onBack}
            className="flex-1 py-3 px-4 bg-white text-primary border-2 border-primary rounded-xl hover:shadow-md transition-all font-medium"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[600px] flex flex-col p-0 gap-0">
        <DialogHeader className="bg-gradient-to-r from-[#E91E63] to-[#F8B6D8] px-6 py-4 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-white text-lg font-bold flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Carol - Assistente Virtual
          </DialogTitle>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-[#FFF0F5]">
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              message.type === 'bot' ? (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex gap-3 mb-4"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 bg-white rounded-2xl rounded-tl-none p-4 shadow-sm">
                    <p className="text-base md:text-lg whitespace-pre-line text-foreground leading-relaxed">{message.content}</p>
                    {renderMessageData(message.data)}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex gap-3 mb-4 justify-end"
                >
                  <div className="flex-1 bg-primary text-white rounded-2xl rounded-tr-none p-4 max-w-[80%]">
                    <p className="text-base md:text-lg leading-relaxed">{message.content}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-foreground" />
                  </div>
                </motion.div>
              )
            ))}
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3 mb-4"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 bg-white rounded-2xl rounded-tl-none p-4 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t bg-white p-4 flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputValue.trim() && !isLoading) {
                if (canAcceptFreeTextResponse()) {
                  handleNextStep(inputValue.trim())
                  setInputValue('')
                }
              }
            }}
            placeholder="Digite sua resposta..."
            className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-[#E91E63] text-sm"
            disabled={isLoading}
          />
          <button
            onClick={() => {
              if (inputValue.trim() && !isLoading && canAcceptFreeTextResponse()) {
                handleNextStep(inputValue.trim())
                setInputValue('')
              }
            }}
            disabled={isLoading || !inputValue.trim()}
            className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-md hover:bg-primary/90 transition-all disabled:bg-gray-300 disabled:shadow-none"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Image Modal for Results */}
    <AnimatePresence>
      {isImageModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsImageModalOpen(false)}
          className="fixed inset-0 z-[20000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-2xl aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={modalImageUrl}
              alt="Imagem Ampliada"
              className="w-full h-full object-contain"
            />
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-md transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  )
}

export default Chatbot
