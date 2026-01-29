'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Calendar, DollarSign, ShoppingBag, Sparkles, Camera, User, Instagram, Mail, Star, Heart, Clock, CalendarPlus } from 'lucide-react'
import Chatbot from '@/components/chatbot/Chatbot'

const cardData = [
  {
    icon: Calendar,
    title: 'Agendar um Serviço',
    subtitle: '💇‍♀️',
    description: 'Agendamento online rápido e fácil',
    color: 'bg-primary',
    textColor: 'text-primary-foreground',
    buttonText: 'Agendar Agora',
    isPrimary: true
  },
  {
    icon: Sparkles,
    title: 'Promoção Bio Proteína',
    subtitle: '✨',
    description: 'Aproveite nossa nova fibra de alta qualidade por apenas R$ 300!',
    href: '/promo-bio-proteina',
    color: 'bg-gradient-to-br from-[#FFD700] to-[#FFA500]',
    textColor: 'text-white',
    buttonText: 'Ver Promoção',
    shadow: 'shadow-xl'
  },
  {
    icon: DollarSign,
    title: 'Ver Serviços e Valores',
    subtitle: '💰',
    description: 'Conheça nossos serviços e preços',
    href: '/services',
    color: 'bg-white',
    textColor: 'text-foreground',
    buttonText: 'Ver Lista',
    shadow: 'shadow-lg',
  },
  {
    icon: ShoppingBag,
    title: 'Comprar Perucas & Produtos',
    subtitle: '💎',
    description: 'Produtos de alta qualidade',
    href: '/shop',
    image: '/assets/products.png',
    buttonText: 'Acessar Loja',
    color: 'bg-white',
    textColor: 'text-foreground'
  },
  {
    icon: Sparkles,
    title: 'Assinar Clube Capilar',
    subtitle: '🌸',
    description: 'Planos exclusivos de manutenção',
    href: '/clube-capilar',
    plans: ['R$180/mês', 'R$280/mês', 'R$380/mês'],
    buttonText: 'Assinar Agora',
    color: 'bg-[#F8B6D8]',
    textColor: 'text-foreground'
  },
  {
    icon: Camera,
    title: 'Ver Resultados Reais',
    subtitle: '📸',
    description: 'Transformações incríveis de nossas clientes',
    image: '/assets/transformat.png',
    href: '/depoimentos',
    buttonText: 'Ver Depoimentos',
    color: 'bg-white',
    textColor: 'text-foreground'
  },
  {
    icon: User,
    title: 'Conhecer a Profissional',
    subtitle: '👩‍🦰',
    description: 'Carol - 14 anos de experiência',
    href: '/profissional',
    image: '/images/perfil.png',
    buttonText: 'Saiba Mais',
    color: 'bg-[#FFF0F5]',
    textColor: 'text-foreground'
  },
  {
    icon: Instagram,
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
    shadow: 'shadow-lg'
  },
  {
    icon: Mail,
    title: 'Fale com o Suporte',
    subtitle: '💬',
    description: 'Estamos aqui para ajudar você',
    buttonText: 'Entrar em Contato',
    color: 'bg-[#F8B6D8]',
    textColor: 'text-foreground'
  }
]

const HeroSection = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12 px-4">
      {/* Professional Portrait */}
      <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shadow-2xl border-4 border-white relative">
        <Image
          src="/images/perfil.png"
          alt="Carol - Profissional de Megahair e Perucas"
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 128px, 160px"
        />
      </div>

      {/* Branding Element */}
      <div className="max-w-2xl space-y-4">
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gradient-primary">
          Megahair, Perucas e Tratamentos Capilares com Ética e Amor.
        </h1>

        {/* Headline */}
        <p className="text-lg md:text-xl font-medium text-foreground">
          Há 14 anos transformando vidas com serviços acessíveis e atendimento humano.
        </p>

        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {[
            { icon: Star, text: '14 Anos de Experiência' },
            { icon: User, text: 'Atendimento Individual' },
            { icon: Calendar, text: 'Agendamento Online' }
          ].map((badge, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md text-sm md:text-base"
            >
              <badge.icon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              <span className="font-medium">{badge.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const ActionCard = ({ data, index, onClick }: { data: typeof cardData[0], index: number, onClick?: () => void }) => {
  const Icon = data.icon
  const instagramPhotos = data.instagramPhotos ?? []

  return (
    <div
      className={`${data.color} rounded-2xl p-6 ${data.shadow || 'shadow-md'} transition-all duration-300`}
    >
      <div className={`flex flex-col gap-4 ${data.textColor}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="text-3xl mb-2">{data.subtitle}</div>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-1">
              {data.title}
            </h2>
            <p className="text-sm md:text-base opacity-80 font-sans">
              {data.description}
            </p>
          </div>
          <Icon className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0" />
        </div>

        {/* Image if present */}
        {data.image && (
          <div className="w-full h-56 md:h-72 rounded-xl overflow-hidden relative">
            <Image
              src={data.image}
              alt={data.title}
              fill
              className="object-cover hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 192px, 224px"
            />
          </div>
        )}

        {/* Instagram photos */}
        {instagramPhotos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {instagramPhotos.map((photo, i) => (
              <div key={i} className="relative w-full h-20 sm:h-24 md:h-28 rounded-lg overflow-hidden">
                <Image
                  src={photo}
                  alt={`Instagram CarolSolHair ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 48vw, 20vw"
                />
              </div>
            ))}
          </div>
        )}

        {/* Plans if present */}
        {data.plans && (
          <div className="grid grid grid-cols-3 gap-2 text-center">
            {data.plans.map((plan, i) => (
              <div key={i} className="bg-white/50 backdrop-blur-sm rounded-lg py-3 px-2">
                <span className="font-bold text-lg">{plan}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA Button */}
        {data.instagramUrl ? (
          <a
            href={data.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className={`
              ${data.isPrimary ? 'bg-white text-primary' : 'bg-primary text-white'}
              btn-glow font-semibold py-4 px-6 rounded-xl text-lg
              hover:shadow-xl transition-all duration-300
              min-h-[52px] flex items-center justify-center gap-2
            `}
          >
            {data.buttonText}
            <Heart className={`w-5 h-5 ${data.isPrimary ? 'fill-current' : ''}`} />
          </a>
        ) : (
          <button
            onClick={onClick}
            className={`
              ${data.isPrimary ? 'bg-white text-primary' : 'bg-primary text-white'}
              btn-glow font-semibold py-4 px-6 rounded-xl text-lg
              hover:shadow-xl transition-all duration-300
              min-h-[52px] flex items-center justify-center gap-2
            `}
          >
            {data.buttonText}
            <Heart className={`w-5 h-5 ${data.isPrimary ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)

  return (
    <main className="min-h-screen">
      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* Hero Section */}
        <HeroSection />

        {/* Cards Container */}
        <div className="flex flex-col gap-6 pt-8">
          {cardData.map((card, index) => {
            const handleClick = () => {
              if (card.href) {
                window.location.href = card.href
              } else if (card.instagramUrl) {
                window.open(card.instagramUrl, '_blank', 'noopener,noreferrer')
              } else if (card.isPrimary || index === 0) {
                setIsChatbotOpen(true)
              }
            }
            return <ActionCard key={index} data={card} index={index} onClick={handleClick} />
          })}
        </div>
      </div>

      {/* Floating Scheduling Button */}
      <button
        onClick={() => setIsChatbotOpen(true)}
        className="fixed bottom-20 md:bottom-24 right-4 md:right-6 z-[10000] bg-gradient-to-r from-[#E91E63] to-[#F8B6D8] text-white px-6 py-4 rounded-full shadow-2xl hover:shadow-xl transition-all flex items-center gap-3 btn-shine"
      >
        <CalendarPlus className="w-6 h-6" />
        <span className="font-semibold text-base md:text-lg">Agendar meu atendimento</span>
      </button>

      {/* Chatbot Modal */}
      <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />

      {/* Sticky Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-[0_-4px_20px_rgba(233,30,99,0.1)] py-4 px-4 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Heart className="w-4 h-4 text-primary fill-current" />
          <span>CarolSol Studio - Transformando com Amor</span>
          <Heart className="w-4 h-4 text-primary fill-current" />
        </div>
      </footer>
    </main>
  )
}
