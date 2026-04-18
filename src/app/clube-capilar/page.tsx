'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Sparkles, Calendar, Star, ArrowLeft, Heart } from 'lucide-react'
import Chatbot from '@/components/chatbot/Chatbot'
import { getDefaultInternalPage } from '@/lib/internal-pages-defaults'
import {
  asObjectArray,
  asString,
  asStringArray,
  loadInternalPageContent,
} from '@/lib/internal-pages-runtime'

type ClubePlan = {
  name: string
  price: string
  highlight: string
  items: string[]
}

type ClubeBenefit = {
  title: string
  description: string
}

function normalizePlans(rawValue: unknown, fallback: ClubePlan[]) {
  const parsed = asObjectArray<Record<string, unknown>>(rawValue, [])
    .map((plan) => ({
      name: asString(plan.name),
      price: asString(plan.price),
      highlight: asString(plan.highlight),
      items: asStringArray(plan.items, []),
    }))
    .filter((plan) => plan.name && plan.price && plan.highlight && plan.items.length > 0)

  return parsed.length > 0 ? parsed : fallback
}

function normalizeBenefits(rawValue: unknown, fallback: ClubeBenefit[]) {
  const parsed = asObjectArray<Record<string, unknown>>(rawValue, [])
    .map((benefit) => ({
      title: asString(benefit.title),
      description: asString(benefit.description),
    }))
    .filter((benefit) => benefit.title && benefit.description)

  return parsed.length > 0 ? parsed : fallback
}

const defaultContent = getDefaultInternalPage('clube-capilar')?.content || {}
const defaultPlans = normalizePlans(defaultContent.plans, [])
const defaultBenefits = normalizeBenefits(defaultContent.benefits, [])

const benefitIcons = [Calendar, Star, Heart]

export default function ClubeCapilarPage() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const [content, setContent] = useState<Record<string, unknown>>(defaultContent)

  useEffect(() => {
    loadInternalPageContent('clube-capilar').then((pageContent) => setContent(pageContent))
  }, [])

  const badgeText = asString(content.badgeText, 'Planos exclusivos de manutencao')
  const pageTitle = asString(content.title, 'Clube Capilar CarolSol')
  const pageDescription = asString(content.description)
  const plans = useMemo(() => normalizePlans(content.plans, defaultPlans), [content.plans])
  const benefits = useMemo(
    () => normalizeBenefits(content.benefits, defaultBenefits),
    [content.benefits]
  )
  const ctaTitle = asString(content.ctaTitle, 'Pronta para entrar no clube?')
  const ctaDescription = asString(content.ctaDescription)
  const ctaButtonText = asString(content.ctaButtonText, 'Falar com a especialista')

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

      <section className="max-w-6xl mx-auto px-4 py-12 lg:hidden">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-md mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">{badgeText}</span>
          </div>
          <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4">
            {pageTitle}
          </h1>
          <p className="text-lg text-muted-foreground">{pageDescription}</p>
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
            {benefits.map((benefit, index) => {
              const Icon = benefitIcons[index] || Sparkles
              return (
                <div key={benefit.title} className="flex gap-3">
                  <Icon className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="font-semibold text-foreground">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-16 lg:hidden">
        <div className="bg-gradient-to-r from-[#E91E63] to-[#F8B6D8] text-white rounded-2xl p-8 text-center shadow-xl">
          <h2 className="font-display font-bold text-3xl mb-3">{ctaTitle}</h2>
          <p className="text-base mb-6">{ctaDescription}</p>
          <button
            onClick={() => setIsChatbotOpen(true)}
            className="bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition"
          >
            {ctaButtonText}
          </button>
        </div>
      </section>

      <section className="mx-auto hidden max-w-[1500px] px-8 py-14 lg:block xl:px-12">
        <div className="grid min-h-[560px] grid-cols-[0.95fr_1.05fr] items-center gap-12">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/85 px-5 py-2.5 text-xs font-black uppercase tracking-[0.24em] text-primary shadow-lg">
              <Sparkles className="h-4 w-4" />
              {badgeText}
            </div>
            <h1 className="font-display text-7xl font-black leading-[0.92] tracking-[-0.06em] text-foreground xl:text-8xl">
              {pageTitle}
            </h1>
            <p className="max-w-3xl text-xl leading-9 text-muted-foreground">
              {pageDescription}
            </p>
            <button
              onClick={() => setIsChatbotOpen(true)}
              className="inline-flex items-center gap-3 rounded-2xl bg-primary px-8 py-4 text-lg font-black text-white shadow-xl shadow-pink-200 transition hover:bg-primary/90"
            >
              {ctaButtonText}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`flex min-h-[520px] flex-col rounded-[2.25rem] border border-pink-100 bg-white p-7 shadow-xl shadow-pink-100/45 ${
                  index === 1 ? 'scale-105 border-primary/25' : ''
                }`}
              >
                <div className="mb-6">
                  <div className="mb-4 inline-flex rounded-full bg-pink-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
                    Plano {index + 1}
                  </div>
                  <h2 className="font-display text-3xl font-black leading-tight text-foreground">
                    {plan.name}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{plan.highlight}</p>
                </div>
                <div className="mb-7 font-display text-4xl font-black text-primary">{plan.price}</div>
                <ul className="mb-8 space-y-4">
                  {plan.items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-none text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setIsChatbotOpen(true)}
                  className="mt-auto w-full rounded-2xl bg-primary px-6 py-4 font-black text-white transition hover:bg-primary/90"
                >
                  Assinar agora
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 grid grid-cols-[1fr_1.25fr] gap-8">
          <div className="rounded-[2.25rem] bg-gradient-to-r from-[#E91E63] to-[#F8B6D8] p-9 text-white shadow-xl shadow-pink-200">
            <h2 className="font-display text-5xl font-black leading-tight tracking-[-0.05em]">
              {ctaTitle}
            </h2>
            <p className="mt-5 text-lg leading-8">{ctaDescription}</p>
            <button
              onClick={() => setIsChatbotOpen(true)}
              className="mt-8 rounded-2xl bg-white px-8 py-4 text-lg font-black text-primary shadow-lg transition hover:shadow-xl"
            >
              {ctaButtonText}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-5 rounded-[2.25rem] border border-pink-100 bg-white p-8 shadow-xl shadow-pink-100/40">
            {benefits.map((benefit, index) => {
              const Icon = benefitIcons[index] || Sparkles
              return (
                <div key={benefit.title} className="rounded-2xl bg-pink-50/70 p-5">
                  <Icon className="mb-5 h-8 w-8 text-primary" />
                  <h3 className="font-display text-xl font-black text-foreground">{benefit.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{benefit.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
    </main>
  )
}
