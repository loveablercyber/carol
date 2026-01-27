'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Sparkles, Calendar, Star, ArrowLeft, Heart } from 'lucide-react'
import Chatbot from '@/components/chatbot/Chatbot'

const plans = [
  {
    name: 'Clube Essencial',
    price: 'R$180/mês',
    highlight: 'Manutenção básica com cuidado contínuo',
    items: [
      '1 sessão de manutenção por mês',
      'Avaliação capilar completa',
      'Hidratação profissional',
      'Desconto especial em produtos',
    ],
  },
  {
    name: 'Clube Premium',
    price: 'R$280/mês',
    highlight: 'Tratamento mensal + acompanhamento',
    items: [
      '2 sessões de manutenção por mês',
      'Hidratação + nutrição profunda',
      'Cronograma capilar personalizado',
      'Prioridade no agendamento',
    ],
  },
  {
    name: 'Clube Luxo',
    price: 'R$380/mês',
    highlight: 'Experiência completa e exclusiva',
    items: [
      '3 sessões de manutenção por mês',
      'Blindagem capilar trimestral',
      'Acompanhamento exclusivo com especialista',
      'Consultoria de imagem capilar',
    ],
  },
]

export default function ClubeCapilarPage() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-white to-white pb-20">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold text-foreground">Voltar</span>
          </Link>
          <span className="font-display font-bold text-xl text-foreground">Clube Capilar</span>
          <div className="w-10" />
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-md mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Planos exclusivos de manutenção</span>
          </div>
          <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4">
            Clube Capilar CarolSol
          </h1>
          <p className="text-lg text-muted-foreground">
            Mantenha o megahair impecável com acompanhamento mensal, tratamentos personalizados e
            benefícios especiais para clientes do clube.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="bg-white rounded-2xl shadow-lg border border-pink-100 p-6 flex flex-col"
            >
              <div className="mb-4">
                <h2 className="font-display font-bold text-2xl text-foreground">{plan.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{plan.highlight}</p>
              </div>
              <div className="text-3xl font-bold text-primary mb-6">{plan.price}</div>
              <ul className="space-y-3 mb-8">
                {plan.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setIsChatbotOpen(true)}
                className="mt-auto w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                Assinar agora
              </button>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-white rounded-2xl shadow-md p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Calendar,
                title: 'Agendamentos flexíveis',
                description: 'Horários reservados para membros do clube.',
              },
              {
                icon: Star,
                title: 'Tratamentos premium',
                description: 'Produtos profissionais e técnicas exclusivas.',
              },
              {
                icon: Heart,
                title: 'Acompanhamento próximo',
                description: 'Evolução do seu cabelo mês a mês.',
              },
            ].map((benefit) => (
              <div key={benefit.title} className="flex gap-3">
                <benefit.icon className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="font-semibold text-foreground">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-r from-[#E91E63] to-[#F8B6D8] text-white rounded-2xl p-8 text-center shadow-xl">
          <h2 className="font-display font-bold text-3xl mb-3">Pronta para entrar no clube?</h2>
          <p className="text-base mb-6">
            Garanta seu plano e cuide do seu cabelo com quem entende de mega hair.
          </p>
          <button
            onClick={() => setIsChatbotOpen(true)}
            className="bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition"
          >
            Falar com a especialista
          </button>
        </div>
      </section>

      <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
    </main>
  )
}
