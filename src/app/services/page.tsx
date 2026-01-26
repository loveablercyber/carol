'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, DollarSign, ShoppingBag, Sparkles, Camera, User, Instagram, Mail, Star, Heart, Clock, ArrowLeft } from 'lucide-react'
import Chatbot from '@/components/chatbot/Chatbot'

interface ServiceCategory {
  id: string
  name: string
  nameEmoji: string
  description: string
  image: string
}

interface Service {
  id: string
  name: string
  description: string
  images: string[]
  durationMinutes: number
  priceInfo: {
    tiers?: Array<{ name: string; price: number }>
    table?: Array<{ grams: string; lengths: Array<{ size: string; price: number }> }>
    fixedPrice?: number
  }
}

export default function ServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedOption, setSelectedOption] = useState<any>(null)
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const [isBookingFlow, setIsBookingFlow] = useState(false)

  const categories: ServiceCategory[] = [
    {
      id: 'extensoes',
      name: 'Extensões / Mega Hair',
      nameEmoji: '💖',
      description: 'Comprimento e volume com técnicas invisíveis',
      image: '/images/services/extensions-destaque.png'
    },
    {
      id: 'tratamentos',
      name: 'Tratamentos e Alinhamento',
      nameEmoji: '✨',
      description: 'Tratamentos que restauram a saúde do seu cabelo',
      image: '/images/services/tratamentos-destaque.png'
    },
    {
      id: 'alisamento',
      name: 'Alisamento',
      nameEmoji: '💇‍♀️',
      description: 'Alinhamento suave e natural para seu cabelo',
      image: '/images/services/alisamento-destaque.png'
    },
    {
      id: 'cronograma',
      name: 'Cronograma Capilar',
      nameEmoji: '🌸',
      description: 'Tratamento completo com acompanhamento semanal',
      image: '/images/services/cronograma-destaque.png'
    }
  ]

  const openChatbotForCategory = (category: ServiceCategory) => {
    setSelectedCategory(category)
    setIsChatbotOpen(true)
    setIsBookingFlow(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-white to-white pb-20">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <ArrowLeft className="w-6 h-6 text-foreground hover:text-primary transition-colors" />
            <span className="font-display font-semibold text-xl text-foreground">Voltar</span>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-pink-500" />
            <span className="font-display font-bold text-2xl text-gradient-primary">CarolSol Studio</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4 leading-tight">
            Nossos Serviços
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha um serviço e veja os resultados incríveis que podemos criar para você
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="group cursor-pointer" onClick={() => openChatbotForCategory(category)}>
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-pink-100 hover:border-pink-300 hover:shadow-xl transition-all duration-300">
                <div className="relative h-48 md:h-64 overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aW0iMCAwIDI0IDIwIiB4bWxucz0aHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmYwZDUiLz48L3N2Z+'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/40 flex items-center justify-center">
                    <span className="text-5xl">{category.nameEmoji}</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-display font-bold text-2xl mb-3 text-foreground">
                    {category.nameEmoji} {category.name}
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {category.description}
                  </p>
                  <button className="w-full mt-4 py-3 px-6 bg-gradient-to-r from-[#F8B6D8] to-[#E91E63] text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    <span>Agendar este serviço</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {isChatbotOpen && (
        <Chatbot
          isOpen={isChatbotOpen}
          onClose={() => {
            setIsChatbotOpen(false)
            setSelectedCategory(null)
            setSelectedService(null)
            setSelectedOption(null)
            setIsBookingFlow(false)
          }}
          preSelectedCategory={selectedCategory}
          preSelectedService={selectedService}
        />
      )}
    </div>
  )
}
