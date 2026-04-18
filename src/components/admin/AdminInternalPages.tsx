
'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { DEFAULT_INTERNAL_PAGES, InternalPageSlug } from '@/lib/internal-pages-defaults'

type InternalPage = {
  slug: InternalPageSlug
  title: string
  content: Record<string, unknown>
}

const PAGE_LABELS: Record<InternalPageSlug, string> = {
  'promo-bio-proteina': 'Promocao Bio Proteina',
  services: 'Servicos',
  'clube-capilar': 'Clube Capilar',
  depoimentos: 'Depoimentos',
  profissional: 'Profissional',
}

const SLUG_ORDER = DEFAULT_INTERNAL_PAGES.map((page) => page.slug)

function isInternalPageSlug(value: string): value is InternalPageSlug {
  return SLUG_ORDER.includes(value as InternalPageSlug)
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function asObjectArray(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => asRecord(item))
    .filter((item) => Object.keys(item).length > 0)
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return []

  return value.filter((item): item is string => typeof item === 'string')
}

function linesToList(rawValue: string) {
  return rawValue
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function listToLines(value: unknown) {
  return asStringArray(value).join('\n')
}

function mergePagesWithDefaults(rawPages: unknown): InternalPage[] {
  const parsedPages = Array.isArray(rawPages)
    ? rawPages
        .map((rawPage) => {
          const page = asRecord(rawPage)
          const slug = asString(page.slug)
          if (!isInternalPageSlug(slug)) return null

          return {
            slug,
            title: asString(page.title, PAGE_LABELS[slug]),
            content: asRecord(page.content),
          }
        })
        .filter((page): page is InternalPage => Boolean(page))
    : []

  const parsedMap = new Map(parsedPages.map((page) => [page.slug, page]))

  return DEFAULT_INTERNAL_PAGES.map((defaults) => {
    const saved = parsedMap.get(defaults.slug)

    return {
      slug: defaults.slug,
      title: saved?.title || defaults.title,
      content: {
        ...defaults.content,
        ...(saved?.content || {}),
      },
    }
  })
}

type FieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

function TextField({ label, value, onChange, placeholder }: FieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-foreground">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
      />
    </div>
  )
}

type TextAreaFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
}: TextAreaFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-foreground">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
      />
    </div>
  )
}

type SectionCardProps = {
  title: string
  description?: string
  children: React.ReactNode
}

function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <details className="group rounded-2xl border border-pink-100 bg-pink-50/30">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden">
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground">{title}</h3>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-primary shadow-sm">
          <span className="group-open:hidden">Editar</span>
          <span className="hidden group-open:inline">Recolher</span>
        </span>
      </summary>
      <div className="space-y-4 border-t border-pink-100 p-5">{children}</div>
    </details>
  )
}

export default function AdminInternalPages() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pages, setPages] = useState<InternalPage[]>([])
  const [activeSlug, setActiveSlug] = useState<InternalPageSlug>('promo-bio-proteina')

  const fetchPages = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/internal-pages')
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar paginas internas.')
      }

      const merged = mergePagesWithDefaults(data.pages)
      setPages(merged)
      setActiveSlug((current) =>
        merged.some((page) => page.slug === current) ? current : merged[0]?.slug || 'promo-bio-proteina'
      )
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar paginas internas',
        description: error?.message || 'Tente novamente em instantes.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPages()
  }, [])

  const canSave = useMemo(
    () => pages.length > 0 && pages.every((page) => page.title.trim().length > 0),
    [pages]
  )

  const activePage = useMemo(
    () => pages.find((page) => page.slug === activeSlug) || null,
    [pages, activeSlug]
  )

  const updatePage = (slug: InternalPageSlug, updater: (page: InternalPage) => InternalPage) => {
    setPages((prev) =>
      prev.map((page) => {
        if (page.slug !== slug) return page
        return updater(page)
      })
    )
  }

  const updateTitle = (slug: InternalPageSlug, value: string) => {
    updatePage(slug, (page) => ({
      ...page,
      title: value,
    }))
  }

  const updateContentField = (
    slug: InternalPageSlug,
    key: string,
    value: string | string[] | Record<string, unknown>[]
  ) => {
    updatePage(slug, (page) => ({
      ...page,
      content: {
        ...page.content,
        [key]: value,
      },
    }))
  }

  const updateObjectArrayItem = (
    slug: InternalPageSlug,
    key: string,
    index: number,
    patch: Record<string, unknown>
  ) => {
    updatePage(slug, (page) => {
      const items = asObjectArray(page.content[key])
      if (index < 0 || index >= items.length) {
        return page
      }

      const nextItems = items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...patch,
            }
          : item
      )

      return {
        ...page,
        content: {
          ...page.content,
          [key]: nextItems,
        },
      }
    })
  }

  const addObjectArrayItem = (
    slug: InternalPageSlug,
    key: string,
    newItem: Record<string, unknown>
  ) => {
    updatePage(slug, (page) => {
      const items = asObjectArray(page.content[key])
      return {
        ...page,
        content: {
          ...page.content,
          [key]: [...items, newItem],
        },
      }
    })
  }

  const removeObjectArrayItem = (slug: InternalPageSlug, key: string, index: number) => {
    updatePage(slug, (page) => {
      const items = asObjectArray(page.content[key])
      if (index < 0 || index >= items.length) {
        return page
      }

      return {
        ...page,
        content: {
          ...page.content,
          [key]: items.filter((_, itemIndex) => itemIndex !== index),
        },
      }
    })
  }

  const handleSave = async () => {
    if (!canSave) {
      toast({
        title: 'Nao foi possivel salvar',
        description: 'Preencha os titulos de todas as paginas antes de salvar.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const payload = {
        pages: pages.map((page) => ({
          slug: page.slug,
          title: page.title.trim(),
          content: page.content,
        })),
      }

      const response = await fetch('/api/admin/internal-pages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar paginas internas.')
      }

      const merged = mergePagesWithDefaults(data.pages)
      setPages(merged)
      toast({
        title: 'Paginas internas atualizadas',
        description: 'Conteudo salvo com sucesso.',
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar paginas internas',
        description: error?.message || 'Tente novamente em instantes.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const renderPromoEditor = (page: InternalPage) => {
    const images = asObjectArray(page.content.images)

    return (
      <div className="space-y-5">
        <SectionCard title="Informacoes principais">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Texto do selo"
              value={asString(page.content.badgeText)}
              onChange={(value) => updateContentField(page.slug, 'badgeText', value)}
            />
            <TextField
              label="Titulo de destaque"
              value={asString(page.content.title)}
              onChange={(value) => updateContentField(page.slug, 'title', value)}
            />
            <TextField
              label="Preco exibido"
              value={asString(page.content.priceText)}
              onChange={(value) => updateContentField(page.slug, 'priceText', value)}
            />
            <TextField
              label="Preco para chatbot"
              value={asString(page.content.priceValueForChatbot)}
              onChange={(value) => updateContentField(page.slug, 'priceValueForChatbot', value)}
            />
          </div>
          <TextAreaField
            label="Descricao"
            value={asString(page.content.description)}
            onChange={(value) => updateContentField(page.slug, 'description', value)}
            rows={4}
          />
          <TextField
            label="Texto de rodape"
            value={asString(page.content.footerText)}
            onChange={(value) => updateContentField(page.slug, 'footerText', value)}
          />
        </SectionCard>

        <SectionCard title="Bloco de informacoes" description="Use uma linha por item.">
          <TextField
            label="Titulo do bloco"
            value={asString(page.content.infoTitle)}
            onChange={(value) => updateContentField(page.slug, 'infoTitle', value)}
          />
          <TextAreaField
            label="Itens"
            value={listToLines(page.content.infoItems)}
            onChange={(value) => updateContentField(page.slug, 'infoItems', linesToList(value))}
            rows={5}
          />
        </SectionCard>

        <SectionCard title="Imagens" description="Cadastre nome e caminho da imagem.">
          <div className="space-y-4">
            {images.map((image, index) => (
              <div key={`promo-image-${index}`} className="border border-pink-100 rounded-xl p-4 space-y-3 bg-white">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeObjectArrayItem(page.slug, 'images', index)}
                    className="text-xs text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remover
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <TextField
                    label="Nome"
                    value={asString(image.name)}
                    onChange={(value) =>
                      updateObjectArrayItem(page.slug, 'images', index, { name: value })
                    }
                  />
                  <TextField
                    label="Caminho da imagem"
                    value={asString(image.path)}
                    onChange={(value) =>
                      updateObjectArrayItem(page.slug, 'images', index, { path: value })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => addObjectArrayItem(page.slug, 'images', { name: '', path: '' })}
            className="px-4 py-2 border border-pink-200 rounded-lg text-sm font-medium inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar imagem
          </button>
        </SectionCard>
      </div>
    )
  }

  const renderServicesEditor = (page: InternalPage) => {
    const categories = asObjectArray(page.content.categories)

    return (
      <div className="space-y-5">
        <SectionCard title="Conteudo da pagina">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Titulo"
              value={asString(page.content.title)}
              onChange={(value) => updateContentField(page.slug, 'title', value)}
            />
            <TextField
              label="Subtitulo"
              value={asString(page.content.subtitle)}
              onChange={(value) => updateContentField(page.slug, 'subtitle', value)}
            />
          </div>
        </SectionCard>

        <SectionCard title="Categorias de servico">
          <div className="space-y-4">
            {categories.map((category, index) => (
              <div
                key={`service-category-${index}`}
                className="border border-pink-100 rounded-xl p-4 space-y-3 bg-white"
              >
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeObjectArrayItem(page.slug, 'categories', index)}
                    className="text-xs text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remover
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <TextField
                    label="ID"
                    value={asString(category.id)}
                    onChange={(value) =>
                      updateObjectArrayItem(page.slug, 'categories', index, { id: value })
                    }
                  />
                  <TextField
                    label="Nome"
                    value={asString(category.name)}
                    onChange={(value) =>
                      updateObjectArrayItem(page.slug, 'categories', index, { name: value })
                    }
                  />
                  <TextField
                    label="Emoji"
                    value={asString(category.nameEmoji)}
                    onChange={(value) =>
                      updateObjectArrayItem(page.slug, 'categories', index, {
                        nameEmoji: value,
                      })
                    }
                  />
                  <TextField
                    label="Imagem"
                    value={asString(category.image)}
                    onChange={(value) =>
                      updateObjectArrayItem(page.slug, 'categories', index, { image: value })
                    }
                  />
                </div>
                <TextAreaField
                  label="Descricao"
                  value={asString(category.description)}
                  onChange={(value) =>
                    updateObjectArrayItem(page.slug, 'categories', index, {
                      description: value,
                    })
                  }
                  rows={3}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              addObjectArrayItem(page.slug, 'categories', {
                id: '',
                name: '',
                nameEmoji: '✨',
                description: '',
                image: '',
              })
            }
            className="px-4 py-2 border border-pink-200 rounded-lg text-sm font-medium inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar categoria
          </button>
        </SectionCard>
      </div>
    )
  }

  const renderClubeEditor = (page: InternalPage) => {
    const plans = asObjectArray(page.content.plans)
    const benefits = asObjectArray(page.content.benefits)

    return (
      <div className="space-y-5">
        <SectionCard title="Conteudo principal">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Texto do selo"
              value={asString(page.content.badgeText)}
              onChange={(value) => updateContentField(page.slug, 'badgeText', value)}
            />
            <TextField
              label="Titulo"
              value={asString(page.content.title)}
              onChange={(value) => updateContentField(page.slug, 'title', value)}
            />
          </div>
          <TextAreaField
            label="Descricao"
            value={asString(page.content.description)}
            onChange={(value) => updateContentField(page.slug, 'description', value)}
            rows={4}
          />
        </SectionCard>

        <SectionCard title="Planos">
          <div className="space-y-4">
            {plans.map((plan, index) => (
              <div key={`club-plan-${index}`} className="border border-pink-100 rounded-xl p-4 space-y-3 bg-white">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeObjectArrayItem(page.slug, 'plans', index)}
                    className="text-xs text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remover
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <TextField
                    label="Nome"
                    value={asString(plan.name)}
                    onChange={(value) => updateObjectArrayItem(page.slug, 'plans', index, { name: value })}
                  />
                  <TextField
                    label="Preco"
                    value={asString(plan.price)}
                    onChange={(value) => updateObjectArrayItem(page.slug, 'plans', index, { price: value })}
                  />
                </div>
                <TextField
                  label="Resumo"
                  value={asString(plan.highlight)}
                  onChange={(value) => updateObjectArrayItem(page.slug, 'plans', index, { highlight: value })}
                />
                <TextAreaField
                  label="Itens do plano"
                  value={listToLines(plan.items)}
                  onChange={(value) =>
                    updateObjectArrayItem(page.slug, 'plans', index, {
                      items: linesToList(value),
                    })
                  }
                  rows={5}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              addObjectArrayItem(page.slug, 'plans', {
                name: '',
                price: '',
                highlight: '',
                items: [],
              })
            }
            className="px-4 py-2 border border-pink-200 rounded-lg text-sm font-medium inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar plano
          </button>
        </SectionCard>

        <SectionCard title="Beneficios">
          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <div key={`club-benefit-${index}`} className="border border-pink-100 rounded-xl p-4 space-y-3 bg-white">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeObjectArrayItem(page.slug, 'benefits', index)}
                    className="text-xs text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remover
                  </button>
                </div>
                <TextField
                  label="Titulo"
                  value={asString(benefit.title)}
                  onChange={(value) =>
                    updateObjectArrayItem(page.slug, 'benefits', index, { title: value })
                  }
                />
                <TextAreaField
                  label="Descricao"
                  value={asString(benefit.description)}
                  onChange={(value) =>
                    updateObjectArrayItem(page.slug, 'benefits', index, { description: value })
                  }
                  rows={3}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => addObjectArrayItem(page.slug, 'benefits', { title: '', description: '' })}
            className="px-4 py-2 border border-pink-200 rounded-lg text-sm font-medium inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar beneficio
          </button>
        </SectionCard>

        <SectionCard title="Bloco de chamada final">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Titulo do CTA"
              value={asString(page.content.ctaTitle)}
              onChange={(value) => updateContentField(page.slug, 'ctaTitle', value)}
            />
            <TextField
              label="Texto do botao"
              value={asString(page.content.ctaButtonText)}
              onChange={(value) => updateContentField(page.slug, 'ctaButtonText', value)}
            />
          </div>
          <TextAreaField
            label="Descricao do CTA"
            value={asString(page.content.ctaDescription)}
            onChange={(value) => updateContentField(page.slug, 'ctaDescription', value)}
            rows={3}
          />
        </SectionCard>
      </div>
    )
  }

  const renderDepoimentosEditor = (page: InternalPage) => {
    const testimonials = asObjectArray(page.content.testimonials)

    return (
      <div className="space-y-5">
        <SectionCard title="Conteudo principal">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Texto do selo"
              value={asString(page.content.badgeText)}
              onChange={(value) => updateContentField(page.slug, 'badgeText', value)}
            />
            <TextField
              label="Titulo"
              value={asString(page.content.title)}
              onChange={(value) => updateContentField(page.slug, 'title', value)}
            />
          </div>
          <TextAreaField
            label="Descricao"
            value={asString(page.content.description)}
            onChange={(value) => updateContentField(page.slug, 'description', value)}
            rows={4}
          />
        </SectionCard>

        <SectionCard title="Lista de depoimentos">
          <div className="space-y-4">
            {testimonials.map((item, index) => (
              <div
                key={`testimonial-${index}`}
                className="border border-pink-100 rounded-xl p-4 space-y-3 bg-white"
              >
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeObjectArrayItem(page.slug, 'testimonials', index)}
                    className="text-xs text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remover
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <TextField
                    label="ID"
                    value={asString(item.id)}
                    onChange={(value) =>
                      updateObjectArrayItem(page.slug, 'testimonials', index, { id: value })
                    }
                  />
                  <TextField
                    label="Cliente"
                    value={asString(item.client)}
                    onChange={(value) =>
                      updateObjectArrayItem(page.slug, 'testimonials', index, { client: value })
                    }
                  />
                  <TextField
                    label="Titulo"
                    value={asString(item.title)}
                    onChange={(value) =>
                      updateObjectArrayItem(page.slug, 'testimonials', index, { title: value })
                    }
                  />
                  <TextField
                    label="Imagem antes"
                    value={asString(item.before)}
                    onChange={(value) =>
                      updateObjectArrayItem(page.slug, 'testimonials', index, { before: value })
                    }
                  />
                  <TextField
                    label="Imagem depois"
                    value={asString(item.after)}
                    onChange={(value) =>
                      updateObjectArrayItem(page.slug, 'testimonials', index, { after: value })
                    }
                  />
                </div>

                <TextAreaField
                  label="Descricao do resultado"
                  value={asString(item.description)}
                  onChange={(value) =>
                    updateObjectArrayItem(page.slug, 'testimonials', index, { description: value })
                  }
                  rows={3}
                />

                <TextAreaField
                  label="Depoimento"
                  value={asString(item.quote)}
                  onChange={(value) =>
                    updateObjectArrayItem(page.slug, 'testimonials', index, { quote: value })
                  }
                  rows={3}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              addObjectArrayItem(page.slug, 'testimonials', {
                id: '',
                title: '',
                description: '',
                before: '',
                after: '',
                quote: '',
                client: '',
              })
            }
            className="px-4 py-2 border border-pink-200 rounded-lg text-sm font-medium inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar depoimento
          </button>
        </SectionCard>

        <SectionCard title="Bloco de chamada final">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Titulo do CTA"
              value={asString(page.content.ctaTitle)}
              onChange={(value) => updateContentField(page.slug, 'ctaTitle', value)}
            />
            <TextField
              label="Texto do botao"
              value={asString(page.content.ctaButtonText)}
              onChange={(value) => updateContentField(page.slug, 'ctaButtonText', value)}
            />
          </div>
          <TextAreaField
            label="Descricao do CTA"
            value={asString(page.content.ctaDescription)}
            onChange={(value) => updateContentField(page.slug, 'ctaDescription', value)}
            rows={3}
          />
        </SectionCard>
      </div>
    )
  }

  const renderProfissionalEditor = (page: InternalPage) => {
    const highlights = asObjectArray(page.content.highlights)

    return (
      <div className="space-y-5">
        <SectionCard title="Dados principais">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Titulo da pagina"
              value={asString(page.content.pageTitle)}
              onChange={(value) => updateContentField(page.slug, 'pageTitle', value)}
            />
            <TextField
              label="Nome da profissional"
              value={asString(page.content.profileName)}
              onChange={(value) => updateContentField(page.slug, 'profileName', value)}
            />
            <TextField
              label="Cargo"
              value={asString(page.content.profileRole)}
              onChange={(value) => updateContentField(page.slug, 'profileRole', value)}
            />
            <TextField
              label="Cidade/UF"
              value={asString(page.content.location)}
              onChange={(value) => updateContentField(page.slug, 'location', value)}
            />
            <TextField
              label="Imagem de perfil"
              value={asString(page.content.profileImage)}
              onChange={(value) => updateContentField(page.slug, 'profileImage', value)}
            />
            <TextField
              label="Texto do botao de agendamento"
              value={asString(page.content.bookingButtonText)}
              onChange={(value) => updateContentField(page.slug, 'bookingButtonText', value)}
            />
          </div>
          <TextAreaField
            label="Selos (1 por linha)"
            value={listToLines(page.content.badges)}
            onChange={(value) => updateContentField(page.slug, 'badges', linesToList(value))}
            rows={4}
          />
        </SectionCard>

        <SectionCard title="Bloco de perfil">
          <TextField
            label="Titulo do bloco"
            value={asString(page.content.profileSectionTitle)}
            onChange={(value) => updateContentField(page.slug, 'profileSectionTitle', value)}
          />
          <TextAreaField
            label="Descricao"
            value={asString(page.content.profileDescription)}
            onChange={(value) => updateContentField(page.slug, 'profileDescription', value)}
            rows={5}
          />
        </SectionCard>

        <SectionCard title="Destaques">
          <div className="space-y-4">
            {highlights.map((item, index) => (
              <div key={`highlight-${index}`} className="border border-pink-100 rounded-xl p-4 space-y-3 bg-white">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeObjectArrayItem(page.slug, 'highlights', index)}
                    className="text-xs text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remover
                  </button>
                </div>
                <TextField
                  label="Titulo"
                  value={asString(item.title)}
                  onChange={(value) =>
                    updateObjectArrayItem(page.slug, 'highlights', index, { title: value })
                  }
                />
                <TextAreaField
                  label="Descricao"
                  value={asString(item.description)}
                  onChange={(value) =>
                    updateObjectArrayItem(page.slug, 'highlights', index, {
                      description: value,
                    })
                  }
                  rows={3}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => addObjectArrayItem(page.slug, 'highlights', { title: '', description: '' })}
            className="px-4 py-2 border border-pink-200 rounded-lg text-sm font-medium inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar destaque
          </button>
        </SectionCard>

        <SectionCard title="Processo e tecnicas">
          <TextAreaField
            label="Etapas do atendimento (1 por linha)"
            value={listToLines(page.content.techniques)}
            onChange={(value) => updateContentField(page.slug, 'techniques', linesToList(value))}
            rows={6}
          />
        </SectionCard>

        <SectionCard title="Bloco do Instagram">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Titulo"
              value={asString(page.content.instagramTitle)}
              onChange={(value) => updateContentField(page.slug, 'instagramTitle', value)}
            />
            <TextField
              label="Texto do botao"
              value={asString(page.content.instagramButtonText)}
              onChange={(value) => updateContentField(page.slug, 'instagramButtonText', value)}
            />
            <TextField
              label="URL do Instagram"
              value={asString(page.content.instagramUrl)}
              onChange={(value) => updateContentField(page.slug, 'instagramUrl', value)}
            />
          </div>
          <TextAreaField
            label="Descricao"
            value={asString(page.content.instagramDescription)}
            onChange={(value) => updateContentField(page.slug, 'instagramDescription', value)}
            rows={3}
          />
          <TextAreaField
            label="Fotos do Instagram (1 por linha)"
            value={listToLines(page.content.instagramPhotos)}
            onChange={(value) =>
              updateContentField(page.slug, 'instagramPhotos', linesToList(value))
            }
            rows={6}
          />
        </SectionCard>
      </div>
    )
  }

  const renderPageEditor = (page: InternalPage) => {
    if (page.slug === 'promo-bio-proteina') return renderPromoEditor(page)
    if (page.slug === 'services') return renderServicesEditor(page)
    if (page.slug === 'clube-capilar') return renderClubeEditor(page)
    if (page.slug === 'depoimentos') return renderDepoimentosEditor(page)
    if (page.slug === 'profissional') return renderProfissionalEditor(page)

    return null
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6">
        <p className="text-muted-foreground">Carregando paginas internas...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-md p-6 space-y-2">
        <h2 className="font-display font-bold text-xl text-foreground">Editor Visual de Paginas Internas</h2>
        <p className="text-sm text-muted-foreground">
          Edite cada pagina por campos visuais. Todas as alteracoes sao salvas no mesmo painel,
          sem precisar mexer em JSON manual.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-4 flex flex-wrap gap-2">
        {pages.map((page) => (
          <button
            key={page.slug}
            type="button"
            onClick={() => setActiveSlug(page.slug)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeSlug === page.slug
                ? 'bg-primary text-white'
                : 'bg-pink-50 text-foreground hover:bg-pink-100'
            }`}
          >
            {PAGE_LABELS[page.slug]}
          </button>
        ))}
      </div>

      {activePage ? (
        <div className="bg-white rounded-2xl shadow-md p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">Slug</label>
              <input
                value={activePage.slug}
                disabled
                className="w-full px-4 py-3 border border-pink-100 rounded-lg bg-pink-50 text-muted-foreground"
              />
            </div>
            <TextField
              label="Titulo da pagina (admin)"
              value={activePage.title}
              onChange={(value) => updateTitle(activePage.slug, value)}
            />
          </div>

          {renderPageEditor(activePage)}
        </div>
      ) : null}

      <div className="bg-white rounded-2xl shadow-md p-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Dica: campos de lista usam uma linha por item para facilitar a edicao.
        </p>
        <button
          type="button"
          disabled={!canSave || saving}
          onClick={handleSave}
          className="px-6 py-3 bg-primary text-white rounded-xl font-semibold disabled:opacity-60"
        >
          {saving ? 'Salvando...' : 'Salvar pagina atual'}
        </button>
      </div>
    </div>
  )
}
