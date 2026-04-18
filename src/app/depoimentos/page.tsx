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

      <section className="max-w-5xl mx-auto px-4 pb-16 lg:hidden">
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

      <section className="mx-auto hidden max-w-[1500px] px-8 py-14 lg:block xl:px-12">
        <div className="grid min-h-[520px] grid-cols-[0.88fr_1.12fr] items-center gap-12">
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
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-2xl bg-primary px-8 py-4 text-lg font-black text-white shadow-xl shadow-pink-200 transition hover:bg-primary/90"
            >
              <CalendarCheck className="h-5 w-5" />
              {ctaButtonText}
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {testimonials.slice(0, 2).map((item, index) => (
              <div
                key={item.id}
                className={`overflow-hidden rounded-[2.25rem] border border-white bg-white shadow-xl shadow-pink-100/45 ${
                  index === 1 ? 'translate-y-12' : ''
                }`}
              >
                <div className="grid grid-cols-2">
                  <div className="relative h-72">
                    <Image
                      src={item.before}
                      alt={`${item.title} - Antes`}
                      fill
                      className="object-cover"
                      sizes="20vw"
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-primary">
                      Antes
                    </span>
                  </div>
                  <div className="relative h-72">
                    <Image
                      src={item.after}
                      alt={`${item.title} - Depois`}
                      fill
                      className="object-cover"
                      sizes="20vw"
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-black text-white">
                      Depois
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h2 className="font-display text-2xl font-black text-foreground">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-24 grid grid-cols-2 gap-8">
          {testimonials.map((item) => (
            <article key={item.id} className="rounded-[2.25rem] border border-pink-100 bg-white p-7 shadow-xl shadow-pink-100/40">
              <div className="mb-6 flex items-start justify-between gap-5">
                <div>
                  <h2 className="font-display text-3xl font-black text-foreground">{item.title}</h2>
                  <p className="mt-2 text-base leading-7 text-muted-foreground">{item.description}</p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-pink-50 px-4 py-2 text-xs font-black text-pink-700">
                  <Heart className="h-4 w-4" />
                  Resultado aprovado
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="overflow-hidden rounded-[1.5rem] border border-pink-100 bg-pink-50">
                  <div className="px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-pink-700">Antes</div>
                  <div className="relative h-96">
                    <Image
                      src={item.before}
                      alt={`${item.title} - Antes`}
                      fill
                      className="object-cover"
                      sizes="24vw"
                    />
                  </div>
                </div>
                <div className="overflow-hidden rounded-[1.5rem] border border-pink-100 bg-pink-50">
                  <div className="px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-pink-700">Depois</div>
                  <div className="relative h-96">
                    <Image
                      src={item.after}
                      alt={`${item.title} - Depois`}
                      fill
                      className="object-cover"
                      sizes="24vw"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-pink-100 bg-pink-50 p-5">
                <p className="text-base italic leading-7 text-foreground">“{item.quote}”</p>
                <p className="mt-3 text-sm font-semibold text-muted-foreground">— {item.client}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-16 rounded-[2.25rem] bg-gradient-to-r from-[#E91E63] to-[#F8B6D8] p-10 text-center text-white shadow-xl shadow-pink-200">
          <h2 className="font-display text-5xl font-black tracking-[-0.05em]">{ctaTitle}</h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8">{ctaDescription}</p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-white px-8 py-4 text-lg font-black text-primary shadow-lg transition hover:shadow-xl"
          >
            <CalendarCheck className="h-5 w-5" />
            {ctaButtonText}
          </Link>
        </div>
      </section>
    </main>
  )
}
