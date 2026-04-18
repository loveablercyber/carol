'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  Star,
  MapPin,
  Sparkles,
  Heart,
  Scissors,
  BadgeCheck,
  Instagram,
} from 'lucide-react'
import Chatbot from '@/components/chatbot/Chatbot'
import { getDefaultInternalPage } from '@/lib/internal-pages-defaults'
import {
  asObjectArray,
  asString,
  asStringArray,
  loadInternalPageContent,
} from '@/lib/internal-pages-runtime'

type Highlight = {
  title: string
  description: string
}

function normalizeHighlights(rawValue: unknown, fallback: Highlight[]) {
  const parsed = asObjectArray<Record<string, unknown>>(rawValue, [])
    .map((item) => ({
      title: asString(item.title),
      description: asString(item.description),
    }))
    .filter((item) => item.title && item.description)

  return parsed.length > 0 ? parsed : fallback
}

const defaultContent = getDefaultInternalPage('profissional')?.content || {}
const defaultHighlights = normalizeHighlights(defaultContent.highlights, [])

export default function ProfissionalPage() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const [content, setContent] = useState<Record<string, unknown>>(defaultContent)

  useEffect(() => {
    loadInternalPageContent('profissional').then((pageContent) => setContent(pageContent))
  }, [])

  const pageTitle = asString(content.pageTitle, 'Conhecer a Profissional')
  const profileName = asString(content.profileName, 'Carol Sol')
  const profileRole = asString(content.profileRole, 'Especialista em Mega Hair')
  const profileLocation = asString(content.location, 'Bauru - SP')
  const profileImage = asString(content.profileImage, '/images/perfil.png')
  const bookingButtonText = asString(content.bookingButtonText, 'Agendar atendimento')
  const badges = asStringArray(content.badges, [])
  const profileSectionTitle = asString(content.profileSectionTitle, 'Perfil profissional')
  const profileDescription = asString(content.profileDescription)
  const highlights = useMemo(
    () => normalizeHighlights(content.highlights, defaultHighlights),
    [content.highlights]
  )
  const techniques = asStringArray(content.techniques, [])
  const instagramTitle = asString(content.instagramTitle, 'Quer conhecer o resultado real?')
  const instagramDescription = asString(content.instagramDescription)
  const instagramButtonText = asString(content.instagramButtonText, 'Acessar perfil no Instagram')
  const instagramUrl = asString(content.instagramUrl, 'https://www.instagram.com/carolsolhair/')
  const instagramPhotos = asStringArray(content.instagramPhotos, []).slice(0, 8)
  const photos = instagramPhotos.slice(0, 5)

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-[#FFF7FB] to-white pb-20">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold text-foreground">Voltar</span>
          </Link>
          <span className="font-display font-bold text-xl text-foreground">{pageTitle}</span>
          <div className="w-10" />
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-12 lg:hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 items-start">
          <div className="flex flex-col items-center text-center bg-white rounded-2xl shadow-xl p-6">
            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl relative">
              <Image
                src={profileImage}
                alt={`${profileName} - ${profileRole}`}
                fill
                className="object-cover"
                sizes="160px"
                priority
              />
            </div>
            <h1 className="mt-6 font-display text-3xl font-bold text-foreground">{profileName}</h1>
            <p className="text-sm text-muted-foreground mt-2">✨ {profileRole}</p>
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              <span>📍 {profileLocation}</span>
            </div>
            <button
              onClick={() => setIsChatbotOpen(true)}
              className="mt-6 w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition"
            >
              {bookingButtonText}
            </button>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-md p-8">
              <div className="flex flex-wrap gap-3 mb-4">
                {badges.map((badge, index) => {
                  const Icon = [Star, Sparkles, BadgeCheck][index] || Sparkles
                  return (
                    <div
                      key={`${badge}-${index}`}
                      className="flex items-center gap-2 bg-pink-50 text-pink-900 px-3 py-2 rounded-full text-xs font-semibold"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{badge}</span>
                    </div>
                  )
                })}
              </div>
              <h2 className="font-display text-3xl font-bold text-foreground mb-3">
                {profileSectionTitle}
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                {profileDescription}
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
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Como e o atendimento
                </h2>
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
              <h2 className="font-display text-3xl font-bold mb-3">{instagramTitle}</h2>
              <p className="text-base mb-6">{instagramDescription}</p>
              <div className="grid grid-cols-5 gap-2 mb-6">
                {photos.map((photo, index) => (
                  <div key={`${photo}-${index}`} className="relative w-full aspect-[3/2] rounded-lg overflow-hidden">
                    <Image
                      src={photo}
                      alt={`Instagram CarolSolHair ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 20vw, 10vw"
                    />
                  </div>
                ))}
              </div>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition"
              >
                <Instagram className="w-5 h-5" />
                {instagramButtonText}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto hidden max-w-[1500px] px-8 py-14 lg:block xl:px-12">
        <div className="grid min-h-[680px] grid-cols-[0.9fr_1.1fr] items-center gap-12">
          <div className="relative">
            <div className="absolute -left-8 -top-8 h-64 w-64 rounded-full bg-pink-200/55 blur-3xl" />
            <div className="relative overflow-hidden rounded-[3rem] border border-white bg-white p-4 shadow-[0_42px_120px_-75px_rgba(233,30,99,0.9)]">
              <div className="relative h-[690px] overflow-hidden rounded-[2.4rem] bg-pink-50">
                <Image
                  src={profileImage}
                  alt={`${profileName} - ${profileRole}`}
                  fill
                  className="object-cover object-[50%_18%]"
                  sizes="42vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-7 left-7 right-7 rounded-[1.75rem] border border-white/25 bg-white/18 p-6 text-white backdrop-blur-md">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-pink-100">
                    {profileRole}
                  </p>
                  <h1 className="mt-2 font-display text-5xl font-black tracking-[-0.05em]">
                    {profileName}
                  </h1>
                  <div className="mt-4 flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="h-4 w-4 text-pink-100" />
                    <span>{profileLocation}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/85 px-5 py-2.5 text-xs font-black uppercase tracking-[0.24em] text-primary shadow-lg">
              <BadgeCheck className="h-4 w-4" />
              {pageTitle}
            </div>

            <div>
              <h2 className="font-display text-7xl font-black leading-[0.92] tracking-[-0.06em] text-foreground xl:text-8xl">
                {profileSectionTitle}
              </h2>
              <p className="mt-6 max-w-4xl text-xl leading-9 text-muted-foreground">
                {profileDescription}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {badges.map((badge, index) => {
                const Icon = [Star, Sparkles, BadgeCheck][index] || Sparkles
                return (
                  <div
                    key={`${badge}-${index}`}
                    className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-pink-900 shadow-md"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span>{badge}</span>
                  </div>
                )
              })}
            </div>

            <div className="grid grid-cols-3 gap-5">
              {highlights.map((item) => (
                <div key={item.title} className="rounded-[1.75rem] border border-pink-100 bg-white p-6 shadow-xl shadow-pink-100/40">
                  <h3 className="font-display text-2xl font-black text-foreground">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsChatbotOpen(true)}
              className="inline-flex items-center gap-3 rounded-2xl bg-primary px-8 py-4 text-lg font-black text-white shadow-xl shadow-pink-200 transition hover:bg-primary/90"
            >
              {bookingButtonText}
            </button>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-[0.92fr_1.08fr] gap-8">
          <div className="rounded-[2.25rem] border border-pink-100 bg-white p-8 shadow-xl shadow-pink-100/40">
            <div className="mb-6 flex items-center gap-3">
              <Scissors className="h-7 w-7 text-primary" />
              <h2 className="font-display text-3xl font-black text-foreground">
                Como e o atendimento
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {techniques.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-pink-50/70 p-4">
                  <Heart className="mt-1 h-4 w-4 flex-none text-primary" />
                  <span className="text-sm leading-6 text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.25rem] bg-gradient-to-r from-[#E91E63] to-[#F8B6D8] p-8 text-white shadow-xl shadow-pink-200">
            <h2 className="font-display text-4xl font-black tracking-[-0.04em]">{instagramTitle}</h2>
            <p className="mt-4 text-lg leading-8">{instagramDescription}</p>
            <div className="mt-7 grid grid-cols-5 gap-3">
              {photos.map((photo, index) => (
                <div key={`${photo}-${index}`} className="relative aspect-[3/4] overflow-hidden rounded-2xl">
                  <Image
                    src={photo}
                    alt={`Instagram CarolSolHair ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="9vw"
                  />
                </div>
              ))}
            </div>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-4 font-black text-primary shadow-lg transition hover:shadow-xl"
            >
              <Instagram className="h-5 w-5" />
              {instagramButtonText}
            </a>
          </div>
        </div>
      </section>

      <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
    </main>
  )
}
