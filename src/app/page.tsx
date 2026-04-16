'use client'

import { ComponentType, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Calendar,
  DollarSign,
  ShoppingBag,
  Sparkles,
  Camera,
  User,
  Instagram,
  Mail,
  Star,
  Heart,
  CalendarPlus,
  MessageCircle,
  LayoutDashboard,
} from 'lucide-react'
import Chatbot from '@/components/chatbot/Chatbot'
import UniqueVisitCounter from '@/components/UniqueVisitCounter'
import {
  DEFAULT_HOME_MODULES,
  HomeIconName,
  HomeModuleConfig,
} from '@/lib/home-modules-defaults'

const iconByName: Record<HomeIconName, ComponentType<{ className?: string }>> = {
  Calendar,
  Sparkles,
  DollarSign,
  ShoppingBag,
  Camera,
  User,
  Instagram,
  Mail,
}

const sortModules = (modules: HomeModuleConfig[]) =>
  [...modules].sort((a, b) => a.position - b.position)

const defaultModules = sortModules(DEFAULT_HOME_MODULES.filter((module) => module.enabled))

const HeroSection = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12 px-4">
      <div className="w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden shadow-2xl border-4 border-white relative">
        <Image
          src="/images/carol.png"
          alt="Carol - Profissional de Megahair e Perucas"
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 256px, 320px"
        />
      </div>

      <div className="max-w-2xl space-y-4">
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gradient-primary">
          Megahair, Perucas e Tratamentos Capilares com Etica e Amor.
        </h1>

        <p className="text-lg md:text-xl font-medium text-foreground">
          Há 15 anos transformando vidas com serviços acessíveis e atendimento humano.
        </p>

        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {[
            { icon: Star, text: '15 Anos de Experiência' },
            { icon: User, text: 'Atendimento Individual' },
            { icon: Calendar, text: 'Agendamento Online' },
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

const ActionCard = ({
  data,
  onClick,
}: {
  data: HomeModuleConfig
  onClick?: () => void
}) => {
  const Icon = iconByName[data.icon] || Sparkles
  const instagramPhotos = data.instagramPhotos ?? []

  return (
    <div className={`${data.color} rounded-2xl p-6 ${data.shadow || 'shadow-md'} transition-all duration-300`}>
      <div className={`flex flex-col gap-4 ${data.textColor}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="text-3xl mb-2">{data.subtitle}</div>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-1">{data.title}</h2>
            <p className="text-sm md:text-base opacity-80 font-sans">{data.description}</p>
          </div>
          <Icon className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0" />
        </div>

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

        {instagramPhotos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {instagramPhotos.map((photo, index) => (
              <div key={index} className="relative w-full h-20 sm:h-24 md:h-28 rounded-lg overflow-hidden">
                <Image
                  src={photo}
                  alt={`Instagram CarolSolHair ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 48vw, 20vw"
                />
              </div>
            ))}
          </div>
        )}

        {data.plans && data.plans.length > 0 && (
          <div className="grid grid-cols-3 gap-2 text-center">
            {data.plans.map((plan, index) => (
              <div key={index} className="bg-white/50 backdrop-blur-sm rounded-lg py-3 px-2">
                <span className="font-bold text-lg">{plan}</span>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
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
      </div>
    </div>
  )
}

export default function Home() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const [modules, setModules] = useState<HomeModuleConfig[]>(defaultModules)
  const [loadingModules, setLoadingModules] = useState(true)
  const [showSchedulingHint, setShowSchedulingHint] = useState(false)

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await fetch('/api/home/modules', { cache: 'no-store' })
        const data = await response.json()
        if (!response.ok || !Array.isArray(data?.modules)) {
          throw new Error(data?.error || 'Erro ao carregar modulos')
        }
        setModules(sortModules(data.modules))
      } catch (error) {
        console.error('Erro ao carregar modulos da home:', error)
        setModules(defaultModules)
      } finally {
        setLoadingModules(false)
      }
    }

    fetchModules()
  }, [])

  const supportUrl = useMemo(
    () => modules.find((module) => module.key === 'support')?.href,
    [modules]
  )

  const hasSchedulingModule = useMemo(
    () => modules.some((module) => module.key === 'scheduling'),
    [modules]
  )

  useEffect(() => {
    if (!hasSchedulingModule) {
      setShowSchedulingHint(false)
      return
    }

    const timer = window.setTimeout(() => {
      setShowSchedulingHint(true)
    }, 5000)

    return () => window.clearTimeout(timer)
  }, [hasSchedulingModule])

  const openModuleLink = (target: string) => {
    if (target.startsWith('http://') || target.startsWith('https://')) {
      window.open(target, '_blank', 'noopener,noreferrer')
      return
    }
    window.location.href = target
  }

  const handleCardClick = (module: HomeModuleConfig) => {
    if (module.openChatbot) {
      openSchedulingChatbot()
      return
    }

    if (module.href) {
      openModuleLink(module.href)
      return
    }

    if (module.instagramUrl) {
      openModuleLink(module.instagramUrl)
    }
  }

  const openSchedulingChatbot = () => {
    setShowSchedulingHint(false)
    setIsChatbotOpen(true)
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-lg mx-auto px-4 pb-8">
        <div className="pt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-pink-200 text-sm font-semibold text-foreground hover:border-pink-400"
          >
            <LayoutDashboard className="w-4 h-4 text-primary" />
            Painel Cliente
          </Link>
          {supportUrl && (
            <a
              href={supportUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366] text-white text-sm font-semibold hover:opacity-90"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          )}
        </div>

        <HeroSection />

        <div className="flex flex-col gap-6 pt-8">
          {modules.map((module) => (
            <ActionCard
              key={module.key}
              data={module}
              onClick={() => handleCardClick(module)}
            />
          ))}

          {!loadingModules && modules.length === 0 && (
            <div className="bg-white rounded-2xl shadow-md p-6 text-center text-muted-foreground">
              Nenhum modulo ativo para exibir na pagina inicial.
            </div>
          )}
        </div>
      </div>

      {hasSchedulingModule && (
        <div className="fixed bottom-24 right-4 md:bottom-28 md:right-7 z-[10000] flex items-end gap-3">
          {showSchedulingHint && (
            <div
              role="status"
              className="relative max-w-[230px] rounded-2xl border border-pink-100 bg-white/95 px-4 py-3 pr-9 text-left text-sm text-foreground shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-right-3 duration-500"
            >
              <button
                type="button"
                aria-label="Fechar aviso de agendamento"
                onClick={() => setShowSchedulingHint(false)}
                className="absolute right-3 top-2 text-lg leading-none text-muted-foreground hover:text-primary"
              >
                ×
              </button>
              <p className="font-display text-base font-bold text-primary">
                Agende seu atendimento
              </p>
              <p className="mt-1 leading-snug text-muted-foreground">
                Clique aqui para escolher serviço, data e horário pelo chatbot.
              </p>
            </div>
          )}
          <button
            type="button"
            aria-label="Agendar meu atendimento"
            onClick={openSchedulingChatbot}
            className="group relative flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#E91E63] via-[#F06292] to-[#F8B6D8] text-white shadow-[0_18px_45px_rgba(233,30,99,0.35)] ring-4 ring-white/90 transition-all duration-300 hover:scale-105 hover:shadow-[0_22px_55px_rgba(233,30,99,0.45)] focus:outline-none focus:ring-4 focus:ring-pink-200 btn-shine"
          >
            <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
            <CalendarPlus className="relative z-10 h-8 w-8 md:h-10 md:w-10" />
          </button>
        </div>
      )}

      <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />

      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-[0_-4px_20px_rgba(233,30,99,0.1)] py-4 px-4 z-50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 items-center gap-2 text-sm text-muted-foreground">
          <div className="hidden md:block" />
          <div className="flex items-center justify-center gap-2">
            <Heart className="w-4 h-4 text-primary fill-current" />
            <span>CarolSol Studio - Transformando com Amor</span>
            <Heart className="w-4 h-4 text-primary fill-current" />
          </div>
          <div className="flex justify-center md:justify-end">
            <UniqueVisitCounter />
          </div>
        </div>
      </footer>
    </main>
  )
}
