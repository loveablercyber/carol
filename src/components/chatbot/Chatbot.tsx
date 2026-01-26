'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Bot, User, ArrowLeft, Calendar, Clock, CreditCard, Check } from 'lucide-react'
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

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, initialMessage, promoData }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [modalImageUrl, setModalImageUrl] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [customerData, setCustomerData] = useState({
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
  })

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
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix')
  const [inputValue, setInputValue] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Garantir que o card de Mega Hair fique em evidência quando a lista de categorias aparece
  useEffect(() => {
    const hasCategories = messages.some((m) => (m as any).data?.showCategories)
    if (hasCategories) {
      setTimeout(() => {
        const megaHairCard = document.getElementById('chat-cat-extensoes')
        megaHairCard?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [messages])

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

  const handlePromoInitiation = (msg: string) => {
    setIsLoading(true)
    setTimeout(() => {
      addMessage('bot', 'Oi! Que maravilha que você se interessou pela nossa Bio Proteína! 😍\n\nEssa fibra é maravilhosa e vai te deixar ainda mais linda. Vamos agendar sua aplicação?')
      setTimeout(() => {
        const nextQuestion = getNextQuestion(0)
        if (nextQuestion) {
          addMessage('bot', 'Para começar, me diz seu nome completo:')
        }
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

  const initializeChat = async () => {
    setIsLoading(true)
    setTimeout(() => {
      addMessage('bot', 'Oi, seja muito bem-vinda 💕\n\nVou te ajudar a escolher o melhor serviço pro seu cabelo.\nÉ rápido e você vê exemplos reais antes de decidir ✨')
      setTimeout(() => {
        addMessage('bot', 'Primeiro, me conta: qual tipo de serviço você está procurando?', { showCategories: true })
        setIsLoading(false)
      }, 800)
    }, 500)
  }

  const handleCategorySelect = async (category: ServiceCategory) => {
    addMessage('user', category.nameEmoji + ' ' + category.name, category)
    setIsLoading(true)
    setSelectedCategory(category)

    try {
      const response = await fetch(`/api/chatbot/services?category=${category.id}`)
      const data = await response.json()

      setTimeout(() => {
        addMessage('bot', 'Perfeito! Aqui estão os serviços disponíveis nessa categoria:', { services: data.services })
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

  const handleOptionSelect = async (option: any) => {
    addMessage('user', `Opção: ${option.name || option.size || 'Pacote'} - R$ ${option.price}`, option)
    setIsLoading(true)
    setSelectedOption(option)
    setCurrentQuestionIndex(0)

    setTimeout(() => {
      const firstQuestion = getNextQuestion(0)
      if (firstQuestion) {
        addMessage('bot', 'Ótimo! 💕 Agora preciso de algumas informações para personalizar seu atendimento.\n\n' + firstQuestion.question, { 
          questionOptions: firstQuestion.options,
          questionIndex: 0
        })
      }
      setIsLoading(false)
    }, 800)
  }

  const handleBackToCategories = () => {
    addMessage('user', 'Voltar às categorias', {})
    setSelectedService(null)
    setSelectedOption(null)

    setTimeout(() => {
      addMessage('bot', 'Sem problemas! 💕\n\nQual tipo de serviço você está procurando?', { showCategories: true })
    }, 500)
  }

  const handleNextStep = (value: string, fieldName?: string) => {
    // Determine the field based on current question index
    const fieldMap = [
      'name',        // question 0
      'phone',       // question 1
      'email',       // question 2
      'age',         // question 3
      'allergies',   // question 4
      'megaHairHistory', // question 5
      'hairType',    // question 6
      'hairColor',   // question 7
      'hairState',   // question 8
      'methods'      // question 9
    ]
    const field = fieldName || fieldMap[currentQuestionIndex]
    
    if (field) {
      setCustomerData(prev => ({ ...prev, [field]: value }))
    }
    addMessage('user', value, {})

    setIsLoading(true)
    setTimeout(() => {
      const nextQIndex = currentQuestionIndex + 1
      const nextQuestion = getNextQuestion(nextQIndex)
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

  const getNextQuestion = (questionIndex: number = 0) => {
    const questions = [
      { field: 'name', question: 'Qual é o seu nome completo?' },
      { field: 'phone', question: `Obrigada, ${customerData.name || ''}! 💕\n\nQual é o seu número de telefone com DDD?` },
      { field: 'email', question: 'Perfeito! Agora me passa seu melhor e-mail:' },
      { field: 'age', question: 'Para personalizar seu atendimento, qual a sua idade?' },
      { field: 'allergies', question: selectedCategory?.id === 'extensoes' ? 'Qual é o seu tipo de cabelo?' : 'Você tem alguma alergia a produtos capilares ou químicos?' },
      { field: 'hairType', question: selectedCategory?.id === 'extensoes' ? 'Já fez mega hair antes? Se sim, conta um pouco sobre sua experiência:' : 'Qual é o seu tipo de cabelo (liso, ondulado, cacheado, crespo)?' },
      { field: 'megaHairHistory', question: 'Qual é a cor natural do seu cabelo?' },
      { field: 'hairColor', question: 'Como está o estado atual do seu cabelo (saudável, ressecado, com pontas duplas, quimicamente tratado)?' },
      { field: 'hairState', question: 'Quais métodos você já usou nos últimos 6 meses (progressiva, botox, tintura, alisamentos)?' },
      { field: 'methods', question: 'Obrigado! Próxima etapa.' }
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

  const showConfirmation = () => {
    const price = promoData?.price || String(selectedOption?.price || selectedService?.priceInfo?.fixedPrice || '0')
    const serviceName = promoData?.serviceName || selectedService?.name || 'Serviço'
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
      `Serviço: ${serviceName}`,
      `Valor: R$ ${price}`,
      ``,
      `Data: ${date}`,
      `Horário: ${time}`,
      `Pagamento: ${paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito/Débito'}`,
      ``,
      `-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-`,
      ``,
      `Suas Respostas:`,
      questionsText,
      ``,
      `-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-`,
      ``,
      `Por favor, revise suas informações acima.`,
      `Se tudo estiver correto, clique em Confirmar.`,
      `Se quiser alterar algo, clique em Editar.`
    ].join('\n')

    addMessage('bot', confirmationText, { showConfirmation: true })
  }

  const handleBookingConfirmation = () => {
    const price = promoData?.price || String(selectedOption?.price || selectedService?.priceInfo?.fixedPrice || '0')
    const serviceName = promoData?.serviceName || selectedService?.name || 'Serviço'
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

    // Save locally to mark as booked for this session
    const bookedSlots = JSON.parse(localStorage.getItem('booked_slots') || '[]')
    bookedSlots.push({
      date: selectedDate,
      time: selectedTime,
      expiry: Date.now() + (24 * 60 * 60 * 1000) // Keep for 24h
    })
    localStorage.setItem('booked_slots', JSON.stringify(bookedSlots))

    let message = `🚀 *NOVO AGENDAMENTO - CAROLSOL STUDIO*\n\n`
    message += `*Serviço:* ${serviceName}\n`
    message += `*Valor:* R$ ${price}\n`
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

    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/5514998373935?text=${encodedMessage}`
    
    window.open(whatsappUrl, '_blank')
    alert('✅ Agendamento enviado para o WhatsApp com sucesso!')
    startOver()
  }

  const startOver = () => {
    setMessages([])
    setCurrentStep(0)
    setCurrentQuestionIndex(0)
    setSelectedCategory(null)
    setSelectedService(null)
    setSelectedOption(null)
    setSelectedDate('')
    setSelectedTime('')
    setPaymentMethod('pix')
    setCustomerData({
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
    })
    initializeChat()
  }

  const renderMessageData = (data: any) => {
    if (!data) return null

    if (data.showCategories) {
      return (
        <div className="mt-4 grid grid-cols-1 gap-3">
          {[
            { id: 'extensoes', name: 'Extensões / Mega Hair', nameEmoji: '💖', description: 'Comprimento e volume com técnicas invisíveis', color: 'from-rose-100 to-rose-50', image: '/images/services/extensions-destaque.png' },
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

    if (data.showConfirmation) {
      return (
        <div className="mt-4 space-y-3">
          <button
            onClick={handleBookingConfirmation}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#F8B6D8] to-[#E91E63] text-white rounded-xl hover:shadow-lg transition-all font-medium"
          >
            Confirmar e Enviar para WhatsApp
          </button>
          <button
            onClick={() => {
              setCurrentQuestionIndex(0)
              setCustomerData({
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
              })
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
            Editar Respostas
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
                const lastBotMessage = messages.filter(m => m.type === 'bot').pop()
                if (lastBotMessage && !lastBotMessage.data?.showCategories && !lastBotMessage.data?.services && !lastBotMessage.data?.showDetails && !lastBotMessage.data?.showOptions && !lastBotMessage.data?.showDatePicker && !lastBotMessage.data?.showTimeSlots && !lastBotMessage.data?.showPayment && !lastBotMessage.data?.showConfirmation) {
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
              if (inputValue.trim() && !isLoading) {
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
