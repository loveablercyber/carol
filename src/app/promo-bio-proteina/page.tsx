'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ShoppingBag, Heart, CheckCircle2, Info, Star, X } from 'lucide-react'
import Chatbot from '@/components/chatbot/Chatbot'
import { motion, AnimatePresence } from 'framer-motion'

const images = [
  { name: 'Bio Proteína Marsala', path: '/images/Bio Proteína Marsala.jpeg' },
  { name: 'Bio Proteína Loiro Mel', path: '/images/Bio Proteína Loiro Mel.jpeg' },
  { name: 'Bio Proteína Loiro Clarisso', path: '/images/Bio Proteína Loiro Clarisso.jpeg' },
  { name: 'Bio Proteína Loiro Dourado', path: '/images/Bio Proteína Loiro Dourado.jpeg' },
]

export default function PromoPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalImage, setModalImage] = useState<string | null>(null)

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
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <ArrowLeft className="w-6 h-6 text-foreground hover:text-primary transition-colors" />
            <span className="font-display font-semibold text-xl text-foreground">Voltar</span>
          </Link>
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 text-primary fill-current" />
            <span className="font-display font-bold text-xl text-gradient-primary tracking-tight">CarolSol Studio</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
          {/* Gallery Section */}
          <div className="space-y-4">
            <div 
              className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white cursor-zoom-in"
              onClick={() => openImageModal(selectedImage ? images.find(img => img.name === selectedImage)?.path || images[0].path : images[0].path)}
            >
              <Image
                src={selectedImage ? images.find(img => img.name === selectedImage)?.path || images[0].path : images[0].path}
                alt={selectedImage || 'Fibra Bio Proteína'}
                fill
                className="object-cover transition-all duration-500 hover:scale-105"
                priority
              />
              <div className="absolute top-4 right-4 bg-primary/90 text-white px-4 py-2 rounded-full font-bold shadow-lg backdrop-blur-sm">
                Valor 300$
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {images.map((img) => (
                <button
                  key={img.name}
                  onClick={() => setSelectedImage(img.name)}
                  className={`flex flex-col gap-2 transition-all group`}
                >
                  <div className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all w-full ${
                    selectedImage === img.name ? 'border-primary scale-95 shadow-inner' : 'border-transparent opacity-70 group-hover:opacity-100'
                  }`}>
                    <Image
                      src={img.path}
                      alt={img.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className={`text-[10px] md:text-xs font-medium text-center leading-tight transition-colors ${selectedImage === img.name ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                    {img.name.replace('Bio Proteína ', '')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Info Section */}
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-bold uppercase tracking-wider">
                Promoção Especial
              </div>
              <h1 className="font-display text-4xl font-bold text-foreground leading-tight">
                Fibra Bio Proteína
              </h1>
              <p className="text-3xl font-bold text-primary">R$ 300,00</p>
            </div>

            <div className="prose prose-pink">
              <p className="text-lg text-muted-foreground leading-relaxed">
                A Fibra Bio Proteína é um material sintético de alta qualidade, projetado para apliques, que oferece toque macio e leveza, permitindo o uso de cremes e calor (até 180°C, dependendo do modelo) para estilização.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100 space-y-4">
              <h3 className="font-display font-bold text-xl flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Cabelo e Aplicação
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-muted-foreground">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Quantidade até 200 gramas</span>
                </li>
                <li className="flex items-start gap-3 text-muted-foreground">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Aplicação inclusa no valor</span>
                </li>
                <li className="flex items-start gap-3 text-muted-foreground">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Escolha a sua cor favorita abaixo</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3 pt-4">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-1">Selecione a cor para agendar:</p>
              <div className="grid grid-cols-1 gap-2">
                {images.map((img) => (
                  <button
                    key={img.name}
                    onClick={() => handleBooking(img.name)}
                    className={`w-full flex items-center justify-between p-4 bg-white border-2 rounded-2xl transition-all group ${
                      selectedImage === img.name 
                        ? 'border-primary shadow-md ring-2 ring-primary/20 scale-[1.02]' 
                        : 'border-pink-100 hover:border-pink-300'
                    }`}
                  >
                    <span className={`font-semibold transition-colors ${selectedImage === img.name ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>
                      {img.name}
                    </span>
                    <div className="flex items-center gap-2 text-primary">
                      <span className="text-sm font-bold">{selectedImage === img.name ? 'Agendar este!' : 'Agendar'}</span>
                      <ShoppingBag className={`w-5 h-5 ${selectedImage === img.name ? 'fill-current' : ''}`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t md:hidden z-40">
        <button
          onClick={() => handleBooking()}
          className="w-full bg-gradient-to-r from-[#F8B6D8] to-[#E91E63] text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-6 h-6" />
          Agendar Aplicação
        </button>
      </div>

      <Chatbot
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        initialMessage={selectedImage ? `Olá! Tenho interesse na promoção da Fibra Bio Proteína na cor ${selectedImage}. Como posso agendar?` : undefined}
        promoData={{
          serviceName: selectedImage ? `Bio Proteína (${selectedImage})` : 'Fibra Bio Proteína',
          price: '300'
        }}
      />

      {/* Image Modal */}
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
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={modalImage}
                alt="Imagem Ampliada"
                fill
                className="object-contain"
              />
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

      {/* Footer */}
      <footer className="mt-12 py-8 text-center text-muted-foreground">
        <div className="flex items-center justify-center gap-2 text-sm">
          <Heart className="w-4 h-4 text-primary fill-current" />
          <span>CarolSol Studio - Transformando com Amor</span>
        </div>
      </footer>
    </div>
  )
}
