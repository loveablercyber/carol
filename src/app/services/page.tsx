'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Sparkles, ShoppingBag, ArrowLeft } from 'lucide-react'
import { getDefaultInternalPage } from '@/lib/internal-pages-defaults'
import {
  asObjectArray,
  asString,
  loadInternalPageContent,
} from '@/lib/internal-pages-runtime'

const Chatbot = dynamic(() => import('@/components/chatbot/Chatbot'), {
  ssr: false,
})

interface ServiceCategory {
  id: string
  name: string
  nameEmoji: string
  description: string
  image: string
}

function normalizeCategories(rawValue: unknown, fallback: ServiceCategory[]) {
  const parsed = asObjectArray<Record<string, unknown>>(rawValue, [])
    .map((category, index) => {
      const id = asString(category.id, `categoria-${index + 1}`)
      const name = asString(category.name)
      return {
        id,
        name:
          id === 'extensoes' && /mega hair/i.test(name)
            ? 'Extensoes / Fibra Russa'
            : name,
        nameEmoji: asString(category.nameEmoji, '✨'),
        description: asString(category.description),
        image: asString(category.image),
      }
    })
    .filter((category) => category.name && category.description && category.image)

  return parsed.length > 0 ? parsed : fallback
}

const defaultContent = getDefaultInternalPage('services')?.content || {}
const defaultCategories = normalizeCategories(defaultContent.categories, [])

export default function ServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null)
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const [content, setContent] = useState<Record<string, unknown>>(defaultContent)

  useEffect(() => {
    loadInternalPageContent('services').then((pageContent) => setContent(pageContent))
  }, [])

  const pageTitle = asString(content.title, 'Nossos Servicos')
  const pageSubtitle = asString(
    content.subtitle,
    'Escolha um servico e veja os resultados incriveis que podemos criar para voce'
  )
  const categories = useMemo(
    () => normalizeCategories(content.categories, defaultCategories),
    [content.categories]
  )

  const openChatbotForCategory = (category: ServiceCategory) => {
    setSelectedCategory(category)
    setIsChatbotOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-white to-white pb-20">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <ArrowLeft className="w-6 h-6 text-foreground hover:text-primary transition-colors" />
            <span className="font-display font-semibold text-xl text-foreground">Voltar</span>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-pink-500" />
            <span className="font-display font-bold text-2xl text-gradient-primary">
              CarolSol Studio
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4 leading-tight">
            {pageTitle}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{pageSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="group cursor-pointer"
              onClick={() => openChatbotForCategory(category)}
            >
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-pink-100 hover:border-pink-300 hover:shadow-xl transition-all duration-300">
                <div className="relative h-48 md:h-64 overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(event) => {
                      const target = event.currentTarget as HTMLImageElement
                      target.src =
                        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDUwMCAzMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmZmYwZjUiLz48L3N2Zz4='
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/40 flex items-center justify-center">
                    <span className="text-5xl">{category.nameEmoji}</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-display font-bold text-2xl mb-3 text-foreground">
                    {category.nameEmoji} {category.name}
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {category.description}
                  </p>
                  <button className="w-full mt-4 py-3 px-6 bg-gradient-to-r from-[#F8B6D8] to-[#E91E63] text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    <span>Agendar este servico</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {isChatbotOpen && (
        <Chatbot
          isOpen={isChatbotOpen}
          onClose={() => {
            setIsChatbotOpen(false)
            setSelectedCategory(null)
          }}
          preSelectedCategory={selectedCategory}
        />
      )}
    </div>
  )
}
