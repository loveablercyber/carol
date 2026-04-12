'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Heart, CalendarCheck } from 'lucide-react'
import { getDefaultInternalPage } from '@/lib/internal-pages-defaults'
import {
  asObjectArray,
  asString,
  loadInternalPageContent,
} from '@/lib/internal-pages-runtime'

type Testimonial = {
  id: string
  title: string
  description: string
  before: string
  after: string
  quote: string
  client: string
}

function normalizeTestimonials(rawValue: unknown, fallback: Testimonial[]) {
  const parsed = asObjectArray<Record<string, unknown>>(rawValue, [])
    .map((item, index) => ({
      id: asString(item.id, `resultado-${index + 1}`),
      title: asString(item.title),
      description: asString(item.description),
      before: asString(item.before),
      after: asString(item.after),
      quote: asString(item.quote),
      client: asString(item.client),
    }))
    .filter(
      (item) =>
        item.title &&
        item.description &&
        item.before &&
        item.after &&
        item.quote &&
        item.client
    )

  return parsed.length > 0 ? parsed : fallback
}

const defaultContent = getDefaultInternalPage('depoimentos')?.content || {}
const defaultTestimonials = normalizeTestimonials(defaultContent.testimonials, [])

export default function DepoimentosPage() {
  const [content, setContent] = useState<Record<string, unknown>>(defaultContent)

  useEffect(() => {
    loadInternalPageContent('depoimentos').then((pageContent) => setContent(pageContent))
  }, [])

  const badgeText = asString(content.badgeText, 'Antes & Depois')
  const pageTitle = asString(content.title, 'Depoimentos e Transformacoes')
  const pageDescription = asString(content.description)
  const testimonials = useMemo(
    () => normalizeTestimonials(content.testimonials, defaultTestimonials),
    [content.testimonials]
  )
  const ctaTitle = asString(content.ctaTitle, 'Quer viver sua transformacao?')
  const ctaDescription = asString(content.ctaDescription)
  const ctaButtonText = asString(content.ctaButtonText, 'Agendar atendimento')

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-[#FFF7FB] to-white pb-20">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold text-foreground">Voltar</span>
          </Link>
          <span className="font-display font-bold text-xl text-foreground">Resultados Reais</span>
          <div className="w-10" />
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-12">
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

        <div className="mt-12 grid grid-cols-1 gap-8">
          {testimonials.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-lg border border-pink-100 p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">{item.title}</h2>
                  <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-pink-700 bg-pink-50 px-3 py-2 rounded-full">
                  <Heart className="w-4 h-4" />
                  Resultado aprovado
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl overflow-hidden border border-pink-100 bg-pink-50">
                  <div className="px-4 py-2 text-xs font-semibold text-pink-700">Antes</div>
                  <div className="relative w-full h-72 md:h-80">
                    <Image
                      src={item.before}
                      alt={`${item.title} - Antes`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
                <div className="rounded-xl overflow-hidden border border-pink-100 bg-pink-50">
                  <div className="px-4 py-2 text-xs font-semibold text-pink-700">Depois</div>
                  <div className="relative w-full h-72 md:h-80">
                    <Image
                      src={item.after}
                      alt={`${item.title} - Depois`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-pink-50 rounded-xl p-4 border border-pink-100">
                <p className="text-sm text-foreground italic">“{item.quote}”</p>
                <p className="text-xs text-muted-foreground mt-2">— {item.client}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-r from-[#E91E63] to-[#F8B6D8] text-white rounded-2xl p-8 text-center shadow-xl">
          <h2 className="font-display font-bold text-3xl mb-3">{ctaTitle}</h2>
          <p className="text-base mb-6">{ctaDescription}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition"
          >
            <CalendarCheck className="w-5 h-5" />
            {ctaButtonText}
          </Link>
        </div>
      </section>
    </main>
  )
}

