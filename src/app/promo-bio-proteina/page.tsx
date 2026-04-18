'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ShoppingBag, Heart, CheckCircle2, Info, Star, X } from 'lucide-react'
import Chatbot from '@/components/chatbot/Chatbot'
import UniqueVisitCounter from '@/components/UniqueVisitCounter'
import { motion, AnimatePresence } from 'framer-motion'
import { getDefaultInternalPage } from '@/lib/internal-pages-defaults'
import {
  asObjectArray,
  asString,
  asStringArray,
  loadInternalPageContent,
} from '@/lib/internal-pages-runtime'

type PromoImage = {
  name: string
  path: string
}

function normalizeImages(rawValue: unknown, fallbackImages: PromoImage[]) {
  const parsed = asObjectArray<Record<string, unknown>>(rawValue, [])
    .map((image) => ({
      name: asString(image.name),
      path: asString(image.path),
    }))
    .filter((image) => image.name && image.path)

  return parsed.length > 0 ? parsed : fallbackImages
}

const defaultContent = getDefaultInternalPage('promo-bio-proteina')?.content || {}
const defaultImages = normalizeImages(defaultContent.images, [])

export default function PromoPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalImage, setModalImage] = useState<string | null>(null)
  const [content, setContent] = useState<Record<string, unknown>>(defaultContent)

  useEffect(() => {
    loadInternalPageContent('promo-bio-proteina').then((pageContent) => {
      setContent(pageContent)
    })
  }, [])

  const images = useMemo(
    () => normalizeImages(content.images, defaultImages),
    [content.images]
  )

  const promoBadgeText = asString(content.badgeText, 'Promocao Especial')
  const promoTitle = asString(content.title, 'Fibra Bio Proteina')
  const promoPriceText = asString(content.priceText, 'R$ 300,00')
  const promoPriceValueForChatbot = asString(content.priceValueForChatbot, '300')
  const promoDescription = asString(content.description)
  const promoInfoTitle = asString(content.infoTitle, 'Cabelo e Aplicacao')
  const promoInfoItems = asStringArray(content.infoItems, [])
  const promoFooterText = asString(content.footerText, 'CarolSol Studio - Transformando com Amor')

  const activeImage = useMemo(() => {
    if (images.length === 0) return null
    if (!selectedImage) return images[0]
    return images.find((image) => image.name === selectedImage) || images[0]
  }, [images, selectedImage])

  const openImageModal = (imagePath: string) => {
    setModalImage(imagePath)
    setIsModalOpen(true)
  }

  const handleBooking = (imageName?: string) => {
    if (imageName) {
      setSelectedImage(imageName)
    }
    setIsChatbotOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-white to-white pb-24">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <ArrowLeft className="w-6 h-6 text-foreground hover:text-primary transition-colors" />
            <span className="font-display font-semibold text-xl text-foreground">Voltar</span>
          </Link>
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 text-primary fill-current" />
            <span className="font-display font-bold text-xl text-gradient-primary tracking-tight">
              CarolSol Studio
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12 lg:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
          <div className="space-y-4">
            <div
              className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white cursor-zoom-in"
              onClick={() => {
                if (activeImage?.path) {
                  openImageModal(activeImage.path)
                }
              }}
            >
              {activeImage?.path ? (
                <Image
                  src={activeImage.path}
                  alt={activeImage.name || promoTitle}
                  fill
                  className="object-cover transition-all duration-500 hover:scale-105"
                  priority
                />
              ) : null}
              <div className="absolute top-4 right-4 bg-primary/90 text-white px-4 py-2 rounded-full font-bold shadow-lg backdrop-blur-sm">
                Valor {promoPriceText}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {images.map((image) => (
                <button
                  key={image.name}
                  onClick={() => setSelectedImage(image.name)}
                  className="flex flex-col gap-2 transition-all group"
                >
                  <div
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all w-full ${
                      selectedImage === image.name
                        ? 'border-primary scale-95 shadow-inner'
                        : 'border-transparent opacity-70 group-hover:opacity-100'
                    }`}
                  >
                    <Image src={image.path} alt={image.name} fill className="object-cover" />
                  </div>
                  <span
                    className={`text-[10px] md:text-xs font-medium text-center leading-tight transition-colors ${
                      selectedImage === image.name
                        ? 'text-primary font-bold'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {image.name.replace('Bio Proteina ', '')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-bold uppercase tracking-wider">
                {promoBadgeText}
              </div>
              <h1 className="font-display text-4xl font-bold text-foreground leading-tight">
                {promoTitle}
              </h1>
              <p className="text-3xl font-bold text-primary">{promoPriceText}</p>
            </div>

            <div className="prose prose-pink">
              <p className="text-lg text-muted-foreground leading-relaxed">
                {promoDescription}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100 space-y-4">
              <h3 className="font-display font-bold text-xl flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                {promoInfoTitle}
              </h3>
              <ul className="space-y-3">
                {promoInfoItems.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 pt-4">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-1">
                Selecione a cor para agendar:
              </p>
              <div className="grid grid-cols-1 gap-2">
                {images.map((image) => (
                  <button
                    key={image.name}
                    onClick={() => handleBooking(image.name)}
                    className={`w-full flex items-center justify-between p-4 bg-white border-2 rounded-2xl transition-all group ${
                      selectedImage === image.name
                        ? 'border-primary shadow-md ring-2 ring-primary/20 scale-[1.02]'
                        : 'border-pink-100 hover:border-pink-300'
                    }`}
                  >
                    <span
                      className={`font-semibold transition-colors ${
                        selectedImage === image.name
                          ? 'text-primary'
                          : 'text-foreground group-hover:text-primary'
                      }`}
                    >
                      {image.name}
                    </span>
                    <div className="flex items-center gap-2 text-primary">
                      <span className="text-sm font-bold">
                        {selectedImage === image.name ? 'Agendar este!' : 'Agendar'}
                      </span>
                      <ShoppingBag className={`w-5 h-5 ${selectedImage === image.name ? 'fill-current' : ''}`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <main className="mx-auto hidden max-w-[1500px] px-8 py-14 lg:block xl:px-12">
        <section className="grid min-h-[720px] grid-cols-[0.92fr_1.08fr] items-center gap-12">
          <div className="relative">
            <div className="absolute -left-8 -top-8 h-64 w-64 rounded-full bg-pink-200/55 blur-3xl" />
            <div
              className="relative aspect-[4/5] cursor-zoom-in overflow-hidden rounded-[3rem] border border-white bg-white p-4 shadow-[0_42px_120px_-75px_rgba(233,30,99,0.9)]"
              onClick={() => {
                if (activeImage?.path) {
                  openImageModal(activeImage.path)
                }
              }}
            >
              <div className="relative h-full overflow-hidden rounded-[2.4rem] bg-pink-50">
                {activeImage?.path ? (
                  <Image
                    src={activeImage.path}
                    alt={activeImage.name || promoTitle}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    priority
                    sizes="42vw"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                <div className="absolute left-7 top-7 rounded-full bg-primary px-5 py-2.5 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg">
                  Valor {promoPriceText}
                </div>
                <div className="absolute bottom-7 left-7 right-7 rounded-[1.75rem] border border-white/25 bg-white/20 p-6 text-white backdrop-blur-md">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-pink-100">
                    Cor selecionada
                  </p>
                  <p className="mt-2 font-display text-3xl font-black">{activeImage?.name || promoTitle}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/85 px-5 py-2.5 text-xs font-black uppercase tracking-[0.24em] text-primary shadow-lg">
              <Star className="h-4 w-4 fill-current" />
              {promoBadgeText}
            </div>

            <div className="space-y-5">
              <h1 className="font-display text-7xl font-black leading-[0.92] tracking-[-0.06em] text-foreground xl:text-8xl">
                {promoTitle}
              </h1>
              <p className="font-display text-5xl font-black text-primary">{promoPriceText}</p>
              <p className="max-w-3xl text-xl leading-9 text-muted-foreground">
                {promoDescription}
              </p>
            </div>

            <div className="grid grid-cols-[1fr_0.95fr] gap-5">
              <div className="rounded-[2rem] border border-pink-100 bg-white p-7 shadow-xl shadow-pink-100/40">
                <h3 className="flex items-center gap-3 font-display text-2xl font-black text-foreground">
                  <Info className="h-6 w-6 text-primary" />
                  {promoInfoTitle}
                </h3>
                <ul className="mt-5 space-y-4">
                  {promoInfoItems.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-base text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-green-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[2rem] border border-pink-100 bg-gradient-to-br from-white to-pink-50 p-7 shadow-xl shadow-pink-100/40">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">
                  Agendamento direto
                </p>
                <p className="mt-3 text-base leading-7 text-muted-foreground">
                  Selecione uma cor abaixo para abrir o chatbot no fluxo da promoção.
                </p>
                <button
                  onClick={() => handleBooking()}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#F8B6D8] to-[#E91E63] px-6 py-4 text-lg font-black text-white shadow-lg transition hover:shadow-xl"
                >
                  <ShoppingBag className="h-6 w-6" />
                  Agendar Aplicacao
                </button>
              </div>
            </div>

            <div>
              <p className="mb-4 text-sm font-black uppercase tracking-[0.24em] text-muted-foreground">
                Selecione a cor para agendar
              </p>
              <div className="grid grid-cols-4 gap-4">
                {images.map((image) => (
                  <button
                    key={image.name}
                    onClick={() => {
                      setSelectedImage(image.name)
                      handleBooking(image.name)
                    }}
                    className={`group overflow-hidden rounded-[1.5rem] border bg-white p-3 text-left shadow-md transition-all ${
                      selectedImage === image.name
                        ? 'border-primary ring-4 ring-primary/15'
                        : 'border-pink-100 hover:border-pink-300'
                    }`}
                  >
                    <div className="relative aspect-square overflow-hidden rounded-[1.1rem] bg-pink-50">
                      <Image
                        src={image.path}
                        alt={image.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="12vw"
                      />
                    </div>
                    <p className="mt-3 min-h-[2.5rem] text-sm font-bold leading-tight text-foreground">
                      {image.name.replace('Bio Proteina ', '')}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t md:hidden z-40">
        <button
          onClick={() => handleBooking()}
          className="w-full bg-gradient-to-r from-[#F8B6D8] to-[#E91E63] text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-6 h-6" />
          Agendar Aplicacao
        </button>
      </div>

      <Chatbot
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        initialMessage={
          selectedImage
            ? `Ola! Tenho interesse na promocao da ${promoTitle} na cor ${selectedImage}. Como posso agendar?`
            : undefined
        }
        promoData={{
          serviceName: selectedImage ? `${promoTitle} (${selectedImage})` : promoTitle,
          price: promoPriceValueForChatbot,
        }}
      />

      <AnimatePresence>
        {isModalOpen && modalImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <Image src={modalImage} alt="Imagem Ampliada" fill className="object-contain" />
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-md transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-12 py-8 text-muted-foreground">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 items-center gap-2 px-4 text-sm">
          <div className="hidden md:block" />
          <div className="flex items-center justify-center gap-2 text-center">
            <Heart className="w-4 h-4 text-primary fill-current" />
            <span>{promoFooterText}</span>
          </div>
          <div className="flex justify-center md:justify-end">
            <UniqueVisitCounter />
          </div>
        </div>
      </footer>
    </div>
  )
}
