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

      <section className="max-w-6xl mx-auto px-4 py-12">
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

      <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
    </main>
  )
}

