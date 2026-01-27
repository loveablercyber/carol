'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Star, MapPin, Sparkles, Heart, Scissors, BadgeCheck, Instagram } from 'lucide-react'
import Chatbot from '@/components/chatbot/Chatbot'

const instagramPhotos = [
  '/assets/salon.png',
  '/assets/transformation.png',
  '/assets/hair-closeup.png',
  '/assets/products.png',
  '/images/perfil.jpg',
  '/images/services/extensions-destaque.png',
  '/images/services/megahair-invisible.png',
  '/images/services/megahair-fita.png',
]

const highlights = [
  {
    title: 'Especialista em Mega Hair',
    description: '✨ Técnicas modernas, aplicação segura e manutenção cuidadosa.',
  },
  {
    title: 'Bio Orgânico & Fibra Russa',
    description: '🌿 Seleção de fios premium para naturalidade e leveza.',
  },
  {
    title: 'Fita Adesiva, Microlink e Entrelaçamento',
    description: '🔗 Protocolos personalizados para cada estilo de vida.',
  },
]

const techniques = [
  'Diagnóstico capilar detalhado',
  'Mapeamento de couro cabeludo',
  'Planejamento de volume e cor',
  'Aplicação com acabamento invisível',
  'Manutenção mensal orientada',
  'Cuidados pós-procedimento',
]

export default function ProfissionalPage() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const photos = useMemo(() => [...instagramPhotos].sort(() => Math.random() - 0.5).slice(0, 5), [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-[#FFF7FB] to-white pb-20">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold text-foreground">Voltar</span>
          </Link>
          <span className="font-display font-bold text-xl text-foreground">Conhecer a Profissional</span>
          <div className="w-10" />
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 items-start">
          <div className="flex flex-col items-center text-center bg-white rounded-2xl shadow-xl p-6">
            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl relative">
              <Image
                src="/images/perfil.jpg"
                alt="CarolSol - Especialista em Mega Hair"
                fill
                className="object-cover"
                sizes="160px"
                priority
              />
            </div>
            <h1 className="mt-6 font-display text-3xl font-bold text-foreground">Carol Sol</h1>
            <p className="text-sm text-muted-foreground mt-2">✨ Especialista em Mega Hair</p>
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              <span>📍 Bauru - SP</span>
            </div>
            <button
              onClick={() => setIsChatbotOpen(true)}
              className="mt-6 w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition"
            >
              Agendar atendimento
            </button>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-md p-8">
              <div className="flex flex-wrap gap-3 mb-4">
                {[
                  { icon: Star, text: '14 anos de experiência' },
                  { icon: Sparkles, text: 'Atendimento humanizado' },
                  { icon: BadgeCheck, text: 'Protocolos personalizados' },
                ].map((badge) => (
                  <div key={badge.text} className="flex items-center gap-2 bg-pink-50 text-pink-900 px-3 py-2 rounded-full text-xs font-semibold">
                    <badge.icon className="w-4 h-4" />
                    <span>{badge.text}</span>
                  </div>
                ))}
              </div>
              <h2 className="font-display text-3xl font-bold text-foreground mb-3">Perfil profissional</h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Carol Sol é uma profissional especializada em mega hair, com foco em resultados naturais e
                duradouros. O atendimento é feito de forma individual, combinando diagnóstico capilar,
                seleção de fios premium e técnicas de aplicação seguras. Cada procedimento é pensado para
                valorizar a identidade de cada cliente e garantir conforto durante o uso.
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {highlights.map((item) => (
                  <div key={item.title} className="bg-pink-50/60 rounded-xl p-4">
                    <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-8">
              <div className="flex items-center gap-3 mb-4">
                <Scissors className="w-6 h-6 text-primary" />
                <h2 className="font-display text-2xl font-bold text-foreground">Como é o atendimento</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {techniques.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <Heart className="w-4 h-4 text-primary mt-1" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#E91E63] to-[#F8B6D8] text-white rounded-2xl p-8 shadow-xl">
              <h2 className="font-display text-3xl font-bold mb-3">Quer conhecer o resultado real?</h2>
              <p className="text-base mb-6">Veja a rotina, transformações e bastidores no Instagram.</p>
              <div className="grid grid-cols-5 gap-2 mb-6">
                {photos.map((photo, i) => (
                  <div key={photo} className="relative w-full aspect-[3/2] rounded-lg overflow-hidden">
                    <Image
                      src={photo}
                      alt={`Instagram CarolSolHair ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 20vw, 10vw"
                    />
                  </div>
                ))}
              </div>
              <a
                href="https://www.instagram.com/carolsolhair/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition"
              >
                <Instagram className="w-5 h-5" />
                Acessar perfil no Instagram
              </a>
            </div>
          </div>
        </div>
      </section>

      <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
    </main>
  )
}
