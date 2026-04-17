'use client'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { toast } from '@/hooks/use-toast'

type SectionKey =
  | 'flowItems'
  | 'services'
  | 'beforeAfterItems'
  | 'videoItems'
  | 'faqItems'

type TabKey =
  | 'flow'
  | 'services'
  | 'beforeAfter'
  | 'videos'
  | 'faq'
  | 'agenda'

type AdminConfig = {
  flowItems: any[]
  services: any[]
  beforeAfterItems: any[]
  videoItems: any[]
  faqItems: any[]
  schedulingSettings: {
    slotIntervalMinutes: number
    defaultDurationMinutes: number
    businessHours: any[]
    manualBlocks: any[]
  }
}

const EMPTY_CONFIG: AdminConfig = {
  flowItems: [],
  services: [],
  beforeAfterItems: [],
  videoItems: [],
  faqItems: [],
  schedulingSettings: {
    slotIntervalMinutes: 60,
    defaultDurationMinutes: 60,
    businessHours: [],
    manualBlocks: [],
  },
}

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'flow', label: 'Chatbot' },
  { key: 'services', label: 'Serviços' },
  { key: 'videos', label: 'Vídeos' },
  { key: 'faq', label: 'FAQ' },
  { key: 'agenda', label: 'Agenda' },
]

const FLOW_TYPES = [
  'text',
  'title',
  'description',
  'single_choice',
  'multi_choice',
  'text_field',
  'number_field',
  'phone_field',
  'email_field',
  'price',
  'observation',
  'summary',
  'image',
  'video',
  'faq',
]

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function reorder<T extends { order?: number }>(items: T[]) {
  return items.map((item, index) => ({ ...item, order: index + 1 }))
}

function toOptionItems(item: any) {
  const existing = Array.isArray(item.optionItems) ? item.optionItems : []
  if (existing.length > 0) {
    return existing
      .map((option: any, index: number) => ({
        id: option.id || newId('opt'),
        label: option.label || '',
        value: option.value || option.label || '',
        price: option.price ?? null,
        priceLabel: option.priceLabel || '',
        active: option.active !== false,
        order: Number(option.order || index + 1),
      }))
      .sort((a: any, b: any) => Number(a.order || 999) - Number(b.order || 999))
  }

  return (Array.isArray(item.options) ? item.options : [])
    .map((label: string, index: number) => ({
      id: `legacy_opt_${index}`,
      label,
      value: label,
      price: null,
      priceLabel: '',
      active: true,
      order: index + 1,
    }))
}

function optionsToLabels(options: any[]) {
  return options
    .filter((option) => option.active !== false && String(option.label || '').trim())
    .sort((a, b) => Number(a.order || 999) - Number(b.order || 999))
    .map((option) => String(option.label).trim())
}

function sortedPriceTable(service: any) {
  return Array.isArray(service.priceTable)
    ? [...service.priceTable].sort((a, b) => Number(a.order || 999) - Number(b.order || 999))
    : []
}

export default function AdminChatbotConfig() {
  const [tab, setTab] = useState<TabKey>('flow')
  const [config, setConfig] = useState<AdminConfig>(EMPTY_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState('')
  const [drag, setDrag] = useState<{ section: SectionKey; index: number } | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/admin/chatbot-config', { cache: 'no-store' })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Erro ao carregar configuração')
        setConfig({ ...EMPTY_CONFIG, ...(data.config || {}) })
      } catch (error: any) {
        toast({
          title: 'Erro ao carregar configuração',
          description: error?.message || 'Tente novamente.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const counts = useMemo(
    () => ({
      flow: config.flowItems.filter((item) => item.active).length,
      services: config.services.filter((item) => item.active).length,
      beforeAfter: config.beforeAfterItems.filter((item) => item.active).length,
      videos: config.videoItems.filter((item) => item.active).length,
      faq: config.faqItems.filter((item) => item.active).length,
    }),
    [config]
  )

  const serviceOptions = useMemo(
    () =>
      [...config.services]
        .sort((a, b) => Number(a.order || 999) - Number(b.order || 999))
        .map((service) => ({
          id: service.id,
          name: service.name || service.id,
        })),
    [config.services]
  )

  const save = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/chatbot-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao salvar')
      setConfig({ ...EMPTY_CONFIG, ...(data.config || {}) })
      toast({ title: 'Configurações salvas' })
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const patchItem = (section: SectionKey, id: string, patch: Record<string, unknown>) => {
    setConfig((prev) => ({
      ...prev,
      [section]: prev[section].map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }))
  }

  const patchFlowOption = (flowId: string, optionId: string, patch: Record<string, unknown>) => {
    setConfig((prev) => ({
      ...prev,
      flowItems: prev.flowItems.map((item) => {
        if (item.id !== flowId) return item
        const nextOptions = toOptionItems(item).map((option) =>
          option.id === optionId ? { ...option, ...patch } : option
        )
        return {
          ...item,
          optionItems: nextOptions,
          options: optionsToLabels(nextOptions),
        }
      }),
    }))
  }

  const addFlowOption = (flowId: string) => {
    setConfig((prev) => ({
      ...prev,
      flowItems: prev.flowItems.map((item) => {
        if (item.id !== flowId) return item
        const nextOptions = [
          ...toOptionItems(item),
          {
            id: newId('opt'),
            label: 'Nova opção',
            value: 'Nova opção',
            price: null,
            priceLabel: '',
            active: true,
            order: toOptionItems(item).length + 1,
          },
        ]
        return {
          ...item,
          optionItems: nextOptions,
          options: optionsToLabels(nextOptions),
        }
      }),
    }))
  }

  const removeFlowOption = (flowId: string, optionId: string) => {
    setConfig((prev) => ({
      ...prev,
      flowItems: prev.flowItems.map((item) => {
        if (item.id !== flowId) return item
        const nextOptions = toOptionItems(item)
          .filter((option) => option.id !== optionId)
          .map((option, index) => ({ ...option, order: index + 1 }))
        return {
          ...item,
          optionItems: nextOptions,
          options: optionsToLabels(nextOptions),
        }
      }),
    }))
  }

  const deleteItem = (section: SectionKey, id: string) => {
    if (!confirm('Remover este item?')) return
    setConfig((prev) => ({
      ...prev,
      [section]: reorder(prev[section].filter((item) => item.id !== id)),
    }))
  }

  const moveItem = (section: SectionKey, toIndex: number) => {
    if (!drag || drag.section !== section || drag.index === toIndex) return
    setConfig((prev) => {
      const next = [...prev[section]]
      const [removed] = next.splice(drag.index, 1)
      next.splice(toIndex, 0, removed)
      return { ...prev, [section]: reorder(next) }
    })
    setDrag(null)
  }

  const uploadMedia = async (
    event: ChangeEvent<HTMLInputElement>,
    key: string,
    onSuccess: (url: string) => void
  ) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(key)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro no upload')
      onSuccess(data.url)
      toast({ title: 'Arquivo enviado' })
    } catch (error: any) {
      toast({
        title: 'Falha no upload',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      event.target.value = ''
      setUploading('')
    }
  }

  const addFlow = () => {
    setConfig((prev) => ({
      ...prev,
      flowItems: reorder([
        ...prev.flowItems,
        {
          id: newId('flow'),
          type: 'single_choice',
          title: 'Nova etapa',
          subtitle: '',
          description: '',
          options: ['Opção 1'],
          price: '',
          grams: '',
          observation: '',
          active: true,
          required: false,
        },
      ]),
    }))
  }

  const addService = () => {
    setConfig((prev) => ({
      ...prev,
      services: reorder([
        ...prev.services,
        {
          id: newId('svc'),
          name: 'Novo serviço',
          category: 'Categoria',
          subcategory: '',
          price: 0,
          priceLabel: '',
          pricePerGram: null,
          minGrams: null,
          maxGrams: null,
          durationMinutes: 60,
          shortDescription: '',
          longDescription: '',
          observations: '',
          extraQuestions: [],
          active: true,
        },
      ]),
    }))
  }

  const addBeforeAfter = () => {
    setConfig((prev) => ({
      ...prev,
      beforeAfterItems: reorder([
        ...prev.beforeAfterItems,
        {
          id: newId('ba'),
          title: 'Novo resultado',
          description: '',
          category: '',
          beforeImageUrl: '',
          afterImageUrl: '',
          active: true,
        },
      ]),
    }))
  }

  const addBeforeAfterForService = (serviceId: string) => {
    const service = config.services.find((item) => item.id === serviceId)
    setConfig((prev) => ({
      ...prev,
      beforeAfterItems: reorder([
        ...prev.beforeAfterItems,
        {
          id: newId('ba'),
          serviceId,
          title: `Resultado - ${service?.name || 'serviço'}`,
          description: '',
          category: service?.category || '',
          beforeImageUrl: '',
          afterImageUrl: '',
          active: true,
        },
      ]),
    }))
  }

  const addVideo = () => {
    setConfig((prev) => ({
      ...prev,
      videoItems: reorder([
        ...prev.videoItems,
        {
          id: newId('vid'),
          title: 'Novo vídeo',
          description: '',
          thumbnailUrl: '',
          videoUrl: '',
          active: true,
        },
      ]),
    }))
  }

  const addFaq = () => {
    setConfig((prev) => ({
      ...prev,
      faqItems: reorder([
        ...prev.faqItems,
        {
          id: newId('faq'),
          question: 'Nova pergunta',
          answer: '',
          active: true,
        },
      ]),
    }))
  }

  const addBlock = () => {
    setConfig((prev) => ({
      ...prev,
      schedulingSettings: {
        ...prev.schedulingSettings,
        manualBlocks: [
          ...(prev.schedulingSettings.manualBlocks || []),
          {
            id: newId('block'),
            date: new Date().toISOString().slice(0, 10),
            start: '12:00',
            end: '13:00',
            reason: 'Bloqueio manual',
            active: true,
          },
        ],
      },
    }))
  }

  const card = (
    section: SectionKey,
    index: number,
    children: React.ReactNode
  ) => (
    <div
      draggable
      onDragStart={() => setDrag({ section, index })}
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => moveItem(section, index)}
      className="cursor-grab rounded-2xl border border-[#d8e3ff] bg-white p-4 shadow-[0_18px_40px_-30px_rgba(31,41,55,0.45)] active:cursor-grabbing"
    >
      {children}
    </div>
  )

  const rowActions = (section: SectionKey, item: any) => (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => patchItem(section, item.id, { active: !item.active })}
        className={`rounded-full px-3 py-1.5 text-xs font-bold ${
          item.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
        }`}
      >
        {item.active ? 'Ativo' : 'Inativo'}
      </button>
      <button
        type="button"
        onClick={() => deleteItem(section, item.id)}
        className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600"
      >
        Remover
      </button>
    </div>
  )

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-md">
        Carregando configurador...
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <style jsx global>{`
        .admin-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #d8e3ff;
          background: white;
          padding: 0.65rem 0.8rem;
          font-size: 0.875rem;
          color: #334155;
          outline: none;
        }
        .admin-input:focus {
          border-color: #6b83ff;
          box-shadow: 0 0 0 3px rgba(107, 131, 255, 0.15);
        }
      `}</style>

      <div className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-[0_18px_40px_-28px_rgba(31,41,55,0.6)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Operação configurável
            </p>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Configurador do chatbot, serviços e agenda
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Edite visualmente fluxos, preços, FAQ, mídia, horários e bloqueios sem alterar código.
            </p>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-[#3247d3] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-18px_rgba(50,71,211,0.9)] transition hover:bg-[#2435ad] disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                tab === item.key
                  ? 'bg-[#3247d3] text-white'
                  : 'bg-[#edf2ff] text-slate-700 hover:bg-[#dfe8ff]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <Metric label="Etapas" value={counts.flow} />
          <Metric label="Serviços" value={counts.services} />
          <Metric label="Resultados" value={counts.beforeAfter} />
          <Metric label="Vídeos" value={counts.videos} />
          <Metric label="FAQs" value={counts.faq} />
        </div>
      </div>

      {tab === 'flow' && (
        <Section title="Fluxo do chatbot" description="Arraste para reordenar etapas, edite botões, textos, preços e observações." actionLabel="Adicionar etapa" onAction={addFlow}>
          {config.flowItems.map((item, index) =>
            card('flowItems', index, (
              <div key={item.id} className="space-y-4">
                <Header eyebrow={`Etapa #${index + 1}`} title={item.title} actions={rowActions('flowItems', item)} />
                <div className="grid gap-3 md:grid-cols-3">
                  <Field label="Tipo">
                    <select value={item.type || 'text'} onChange={(event) => patchItem('flowItems', item.id, { type: event.target.value })} className="admin-input">
                      {FLOW_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </Field>
                  <TextInput label="Título" value={item.title} onChange={(value) => patchItem('flowItems', item.id, { title: value })} />
                  <TextInput label="Subtítulo" value={item.subtitle} onChange={(value) => patchItem('flowItems', item.id, { subtitle: value })} />
                </div>
                <TextArea label="Descrição" value={item.description} onChange={(value) => patchItem('flowItems', item.id, { description: value })} />
                <div className="grid gap-3 md:grid-cols-3">
                  <TextInput label="Preço" value={item.price} onChange={(value) => patchItem('flowItems', item.id, { price: value })} />
                  <TextInput label="Gramas" value={item.grams} onChange={(value) => patchItem('flowItems', item.id, { grams: value })} />
                  <Field label="Obrigatório">
                    <label className="flex h-11 items-center gap-2 rounded-lg border border-[#d8e3ff] px-3 text-sm">
                      <input type="checkbox" checked={Boolean(item.required)} onChange={(event) => patchItem('flowItems', item.id, { required: event.target.checked })} className="accent-[#3247d3]" />
                      Campo obrigatório
                    </label>
                  </Field>
                </div>
                <FlowOptionEditor
                  item={item}
                  onChange={patchFlowOption}
                  onAdd={addFlowOption}
                  onRemove={removeFlowOption}
                />
                <TextArea label="Observação" value={item.observation} onChange={(value) => patchItem('flowItems', item.id, { observation: value })} />
              </div>
            ))
          )}
        </Section>
      )}

      {tab === 'services' && (
        <Section title="Serviços e opções" description="Crie serviços, subserviços, categorias, preços, gramas, duração e observações." actionLabel="Adicionar serviço" onAction={addService}>
          {config.services.map((item, index) =>
            card('services', index, (
              <div key={item.id} className="space-y-4">
                <Header eyebrow={`Serviço #${index + 1}`} title={item.name} actions={rowActions('services', item)} />
                <div className="grid gap-3 md:grid-cols-4">
                  <TextInput label="Nome" value={item.name} onChange={(value) => patchItem('services', item.id, { name: value })} />
                  <TextInput label="Categoria" value={item.category} onChange={(value) => patchItem('services', item.id, { category: value })} />
                  <TextInput label="Subcategoria" value={item.subcategory} onChange={(value) => patchItem('services', item.id, { subcategory: value })} />
                  <NumberInput label="Duração (min)" value={item.durationMinutes} onChange={(value) => patchItem('services', item.id, { durationMinutes: value })} />
                </div>
                <div className="grid gap-3 md:grid-cols-5">
                  <NumberInput label="Valor base" value={item.price} step="0.01" onChange={(value) => patchItem('services', item.id, { price: value })} />
                  <TextInput label="Texto do valor" value={item.priceLabel} onChange={(value) => patchItem('services', item.id, { priceLabel: value })} />
                  <NumberInput label="Valor por grama" value={item.pricePerGram ?? ''} step="0.01" onChange={(value) => patchItem('services', item.id, { pricePerGram: value || null })} />
                  <NumberInput label="Gramas mín." value={item.minGrams ?? ''} onChange={(value) => patchItem('services', item.id, { minGrams: value || null })} />
                  <NumberInput label="Gramas máx." value={item.maxGrams ?? ''} onChange={(value) => patchItem('services', item.id, { maxGrams: value || null })} />
                </div>
                <TextArea label="Descrição curta" value={item.shortDescription} onChange={(value) => patchItem('services', item.id, { shortDescription: value })} />
                <TextArea label="Descrição longa" value={item.longDescription} onChange={(value) => patchItem('services', item.id, { longDescription: value })} />
                <TextArea label="Observações" value={item.observations} onChange={(value) => patchItem('services', item.id, { observations: value })} />
                <ServicePriceTableEditor
                  service={item}
                  onChange={(priceTable) => patchItem('services', item.id, { priceTable })}
                />
                <div className="space-y-3 rounded-xl border border-[#d8e3ff] bg-[#f8faff] p-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                        Antes e depois do serviço
                      </p>
                      <p className="text-xs text-slate-500">
                        Upload e edição centralizados neste serviço.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addBeforeAfterForService(item.id)}
                      className="rounded-lg border border-[#b8c7ff] bg-white px-3 py-2 text-xs font-bold text-[#3247d3]"
                    >
                      Adicionar resultado
                    </button>
                  </div>
                  {config.beforeAfterItems.filter((media) => media.serviceId === item.id).length === 0 ? (
                    <p className="text-sm text-slate-500">Nenhum resultado vinculado.</p>
                  ) : (
                    <div className="space-y-3">
                      {config.beforeAfterItems
                        .filter((media) => media.serviceId === item.id)
                        .map((media) => (
                          <div key={media.id} className="space-y-3 rounded-lg border border-white bg-white p-3">
                            <div className="grid gap-3 md:grid-cols-2">
                              <TextInput label="Título" value={media.title} onChange={(value) => patchItem('beforeAfterItems', media.id, { title: value })} />
                              <TextInput label="Descrição" value={media.description} onChange={(value) => patchItem('beforeAfterItems', media.id, { description: value })} />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                              <MediaUpload label="Imagem antes" value={media.beforeImageUrl} uploading={uploading === `${media.id}-before`} onUpload={(event) => uploadMedia(event, `${media.id}-before`, (url) => patchItem('beforeAfterItems', media.id, { beforeImageUrl: url }))} onClear={() => patchItem('beforeAfterItems', media.id, { beforeImageUrl: '' })} />
                              <MediaUpload label="Imagem depois" value={media.afterImageUrl} uploading={uploading === `${media.id}-after`} onUpload={(event) => uploadMedia(event, `${media.id}-after`, (url) => patchItem('beforeAfterItems', media.id, { afterImageUrl: url }))} onClear={() => patchItem('beforeAfterItems', media.id, { afterImageUrl: '' })} />
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteItem('beforeAfterItems', media.id)}
                              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600"
                            >
                              Remover resultado
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                <div className="rounded-xl border border-[#d8e3ff] bg-[#f8faff] p-3 text-sm text-slate-600">
                  Conteúdo vinculado: {config.beforeAfterItems.filter((media) => media.serviceId === item.id).length} resultado(s),{' '}
                  {config.videoItems.filter((media) => media.serviceId === item.id).length} vídeo(s),{' '}
                  {config.faqItems.filter((faq) => faq.serviceId === item.id).length} dúvida(s).
                  Use as abas Antes/Depois, Vídeos e FAQ para editar o conteúdo visual deste serviço.
                </div>
              </div>
            ))
          )}
        </Section>
      )}

      {tab === 'beforeAfter' && (
        <Section title="Antes e depois" description="Cadastre resultados com upload, preview, categoria e ordem." actionLabel="Adicionar resultado" onAction={addBeforeAfter}>
          {config.beforeAfterItems.map((item, index) =>
            card('beforeAfterItems', index, (
              <div key={item.id} className="space-y-4">
                <Header eyebrow={`Resultado #${index + 1}`} title={item.title} actions={rowActions('beforeAfterItems', item)} />
                <div className="grid gap-3 md:grid-cols-3">
                  <TextInput label="Título" value={item.title} onChange={(value) => patchItem('beforeAfterItems', item.id, { title: value })} />
                  <ServiceSelect label="Serviço vinculado" value={item.serviceId || ''} services={serviceOptions} onChange={(value) => patchItem('beforeAfterItems', item.id, { serviceId: value })} />
                  <TextInput label="Categoria" value={item.category} onChange={(value) => patchItem('beforeAfterItems', item.id, { category: value })} />
                  <TextInput label="Descrição" value={item.description} onChange={(value) => patchItem('beforeAfterItems', item.id, { description: value })} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <MediaUpload label="Imagem antes" value={item.beforeImageUrl} uploading={uploading === `${item.id}-before`} onUpload={(event) => uploadMedia(event, `${item.id}-before`, (url) => patchItem('beforeAfterItems', item.id, { beforeImageUrl: url }))} onClear={() => patchItem('beforeAfterItems', item.id, { beforeImageUrl: '' })} />
                  <MediaUpload label="Imagem depois" value={item.afterImageUrl} uploading={uploading === `${item.id}-after`} onUpload={(event) => uploadMedia(event, `${item.id}-after`, (url) => patchItem('beforeAfterItems', item.id, { afterImageUrl: url }))} onClear={() => patchItem('beforeAfterItems', item.id, { afterImageUrl: '' })} />
                </div>
              </div>
            ))
          )}
        </Section>
      )}

      {tab === 'videos' && (
        <Section title="Vídeos" description="Cadastre links, thumbnails, descrições, ordem e status." actionLabel="Adicionar vídeo" onAction={addVideo}>
          {config.videoItems.map((item, index) =>
            card('videoItems', index, (
              <div key={item.id} className="space-y-4">
                <Header eyebrow={`Vídeo #${index + 1}`} title={item.title} actions={rowActions('videoItems', item)} />
                <div className="grid gap-3 md:grid-cols-3">
                  <TextInput label="Título" value={item.title} onChange={(value) => patchItem('videoItems', item.id, { title: value })} />
                  <ServiceSelect label="Serviço vinculado" value={item.serviceId || ''} services={serviceOptions} onChange={(value) => patchItem('videoItems', item.id, { serviceId: value })} />
                  <TextInput label="Link do vídeo" value={item.videoUrl} onChange={(value) => patchItem('videoItems', item.id, { videoUrl: value })} />
                  <TextInput label="Descrição" value={item.description} onChange={(value) => patchItem('videoItems', item.id, { description: value })} />
                </div>
                <MediaUpload label="Thumbnail" value={item.thumbnailUrl} uploading={uploading === `${item.id}-thumb`} onUpload={(event) => uploadMedia(event, `${item.id}-thumb`, (url) => patchItem('videoItems', item.id, { thumbnailUrl: url }))} onClear={() => patchItem('videoItems', item.id, { thumbnailUrl: '' })} />
              </div>
            ))
          )}
        </Section>
      )}

      {tab === 'faq' && (
        <Section title="Dúvidas / FAQ" description="Edite perguntas e respostas exibidas no chatbot." actionLabel="Adicionar pergunta" onAction={addFaq}>
          {config.faqItems.map((item, index) =>
            card('faqItems', index, (
              <div key={item.id} className="space-y-4">
                <Header eyebrow={`Pergunta #${index + 1}`} title={item.question} actions={rowActions('faqItems', item)} />
                <ServiceSelect label="Serviço vinculado (opcional)" value={item.serviceId || ''} services={serviceOptions} onChange={(value) => patchItem('faqItems', item.id, { serviceId: value })} />
                <TextInput label="Pergunta" value={item.question} onChange={(value) => patchItem('faqItems', item.id, { question: value })} />
                <TextArea label="Resposta" value={item.answer} onChange={(value) => patchItem('faqItems', item.id, { answer: value })} />
              </div>
            ))
          )}
        </Section>
      )}

      {tab === 'agenda' && (
        <AgendaEditor
          config={config}
          setConfig={setConfig}
          addBlock={addBlock}
        />
      )}
    </div>
  )
}

function AgendaEditor({
  config,
  setConfig,
  addBlock,
}: {
  config: AdminConfig
  setConfig: React.Dispatch<React.SetStateAction<AdminConfig>>
  addBlock: () => void
}) {
  const updateBusinessHour = (day: number, patch: Record<string, unknown>) => {
    setConfig((prev) => ({
      ...prev,
      schedulingSettings: {
        ...prev.schedulingSettings,
        businessHours: prev.schedulingSettings.businessHours.map((item) =>
          Number(item.day) === day ? { ...item, ...patch } : item
        ),
      },
    }))
  }

  const updateBlock = (id: string, patch: Record<string, unknown>) => {
    setConfig((prev) => ({
      ...prev,
      schedulingSettings: {
        ...prev.schedulingSettings,
        manualBlocks: prev.schedulingSettings.manualBlocks.map((item) =>
          item.id === id ? { ...item, ...patch } : item
        ),
      },
    }))
  }

  const removeBlock = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      schedulingSettings: {
        ...prev.schedulingSettings,
        manualBlocks: prev.schedulingSettings.manualBlocks.filter((item) => item.id !== id),
      },
    }))
  }

  return (
    <Section title="Configuração de agenda" description="Configure funcionamento, duração padrão, intervalos, feriados, pausas e bloqueios." actionLabel="Adicionar bloqueio" onAction={addBlock}>
      <div className="rounded-2xl border border-[#d8e3ff] bg-white p-4 shadow-[0_18px_40px_-30px_rgba(31,41,55,0.45)]">
        <div className="grid gap-3 md:grid-cols-2">
          <NumberInput label="Intervalo entre horários (min)" value={config.schedulingSettings.slotIntervalMinutes} onChange={(value) => setConfig((prev) => ({ ...prev, schedulingSettings: { ...prev.schedulingSettings, slotIntervalMinutes: value } }))} />
          <NumberInput label="Duração padrão (min)" value={config.schedulingSettings.defaultDurationMinutes} onChange={(value) => setConfig((prev) => ({ ...prev, schedulingSettings: { ...prev.schedulingSettings, defaultDurationMinutes: value } }))} />
        </div>
      </div>

      <div className="rounded-2xl border border-[#d8e3ff] bg-white p-4 shadow-[0_18px_40px_-30px_rgba(31,41,55,0.45)]">
        <h3 className="mb-4 font-display text-lg font-bold text-slate-900">Funcionamento semanal</h3>
        <div className="space-y-3">
          {config.schedulingSettings.businessHours.map((day) => (
            <div key={day.day} className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 md:grid-cols-[1fr_120px_120px]">
              <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={Boolean(day.active)} onChange={(event) => updateBusinessHour(day.day, { active: event.target.checked })} className="accent-[#3247d3]" />
                {day.label}
              </label>
              <input type="time" value={day.start || '09:00'} onChange={(event) => updateBusinessHour(day.day, { start: event.target.value })} className="admin-input" />
              <input type="time" value={day.end || '18:00'} onChange={(event) => updateBusinessHour(day.day, { end: event.target.value })} className="admin-input" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#d8e3ff] bg-white p-4 shadow-[0_18px_40px_-30px_rgba(31,41,55,0.45)]">
        <h3 className="mb-4 font-display text-lg font-bold text-slate-900">Bloqueios manuais</h3>
        <div className="space-y-3">
          {(config.schedulingSettings.manualBlocks || []).length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum bloqueio cadastrado.</p>
          ) : (
            config.schedulingSettings.manualBlocks.map((block) => (
              <div key={block.id} className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 md:grid-cols-[140px_110px_110px_1fr_auto_auto]">
                <input type="date" value={block.date || ''} onChange={(event) => updateBlock(block.id, { date: event.target.value })} className="admin-input" />
                <input type="time" value={block.start || '09:00'} onChange={(event) => updateBlock(block.id, { start: event.target.value })} className="admin-input" />
                <input type="time" value={block.end || '10:00'} onChange={(event) => updateBlock(block.id, { end: event.target.value })} className="admin-input" />
                <input value={block.reason || ''} onChange={(event) => updateBlock(block.id, { reason: event.target.value })} placeholder="Motivo" className="admin-input" />
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={Boolean(block.active)} onChange={(event) => updateBlock(block.id, { active: event.target.checked })} className="accent-[#3247d3]" />
                  Ativo
                </label>
                <button type="button" onClick={() => removeBlock(block.id)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600">Remover</button>
              </div>
            ))
          )}
        </div>
      </div>
    </Section>
  )
}

function Section({ title, description, actionLabel, onAction, children }: {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_40px_-28px_rgba(31,41,55,0.45)] md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="font-display text-xl font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        <button type="button" onClick={onAction} className="rounded-xl border border-[#b8c7ff] bg-white px-4 py-2 text-sm font-bold text-[#3247d3] transition hover:border-[#6b83ff]">
          {actionLabel}
        </button>
      </div>
      {children}
    </section>
  )
}

function Header({ eyebrow, title, actions }: { eyebrow: string; title: string; actions: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{eyebrow}</p>
        <h3 className="font-display text-lg font-bold text-slate-900">{title || 'Sem título'}</h3>
      </div>
      {actions}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function TextInput({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <input value={value || ''} onChange={(event) => onChange(event.target.value)} className="admin-input" />
    </Field>
  )
}

function NumberInput({ label, value, step, onChange }: { label: string; value?: number | string; step?: string; onChange: (value: number) => void }) {
  return (
    <Field label={label}>
      <input type="number" min={0} step={step || '1'} value={value ?? ''} onChange={(event) => onChange(Number(event.target.value || 0))} className="admin-input" />
    </Field>
  )
}

function TextArea({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <textarea rows={3} value={value || ''} onChange={(event) => onChange(event.target.value)} className="admin-input" />
    </Field>
  )
}

function ServiceSelect({
  label,
  value,
  services,
  onChange,
}: {
  label: string
  value: string
  services: Array<{ id: string; name: string }>
  onChange: (value: string) => void
}) {
  return (
    <Field label={label}>
      <select value={value || ''} onChange={(event) => onChange(event.target.value)} className="admin-input">
        <option value="">Geral / sem vínculo</option>
        {services.map((service) => (
          <option key={service.id} value={service.id}>
            {service.name}
          </option>
        ))}
      </select>
    </Field>
  )
}

function FlowOptionEditor({
  item,
  onChange,
  onAdd,
  onRemove,
}: {
  item: any
  onChange: (flowId: string, optionId: string, patch: Record<string, unknown>) => void
  onAdd: (flowId: string) => void
  onRemove: (flowId: string, optionId: string) => void
}) {
  const options = toOptionItems(item)

  return (
    <div className="space-y-3 rounded-xl border border-[#d8e3ff] bg-[#f8faff] p-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            Botões/opções visuais
          </p>
          <p className="text-xs text-slate-500">
            Use o campo valor para adicionais e kit quando quiser cobrar futuramente.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAdd(item.id)}
          className="rounded-lg border border-[#b8c7ff] bg-white px-3 py-2 text-xs font-bold text-[#3247d3]"
        >
          Adicionar opção
        </button>
      </div>
      {options.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma opção cadastrada.</p>
      ) : (
        <div className="space-y-2">
          {options.map((option) => (
            <div key={option.id} className="grid gap-2 rounded-lg border border-white bg-white p-2 md:grid-cols-[1.4fr_1fr_110px_1fr_auto_auto]">
              <input
                value={option.label || ''}
                onChange={(event) =>
                  onChange(item.id, option.id, {
                    label: event.target.value,
                    value: option.value || event.target.value,
                  })
                }
                placeholder="Texto exibido"
                className="admin-input"
              />
              <input
                value={option.value || ''}
                onChange={(event) => onChange(item.id, option.id, { value: event.target.value })}
                placeholder="Valor interno"
                className="admin-input"
              />
              <input
                type="number"
                min={0}
                step="0.01"
                value={option.price ?? ''}
                onChange={(event) =>
                  onChange(item.id, option.id, {
                    price: event.target.value === '' ? null : Number(event.target.value),
                  })
                }
                placeholder="Valor"
                className="admin-input"
              />
              <input
                value={option.priceLabel || ''}
                onChange={(event) => onChange(item.id, option.id, { priceLabel: event.target.value })}
                placeholder="Texto do valor"
                className="admin-input"
              />
              <label className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={option.active !== false}
                  onChange={(event) => onChange(item.id, option.id, { active: event.target.checked })}
                  className="accent-[#3247d3]"
                />
                Ativo
              </label>
              <button
                type="button"
                onClick={() => onRemove(item.id, option.id)}
                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ServicePriceTableEditor({
  service,
  onChange,
}: {
  service: any
  onChange: (priceTable: any[]) => void
}) {
  const table = sortedPriceTable(service)
  const commit = (nextTable: any[]) =>
    onChange(nextTable.map((row, index) => ({ ...row, order: index + 1 })))

  const updateRow = (rowId: string, patch: Record<string, unknown>) => {
    commit(table.map((row) => (row.id === rowId ? { ...row, ...patch } : row)))
  }

  const updateLength = (rowId: string, lengthId: string, patch: Record<string, unknown>) => {
    commit(
      table.map((row) =>
        row.id === rowId
          ? {
              ...row,
              lengths: (Array.isArray(row.lengths) ? row.lengths : []).map((length: any) =>
                length.id === lengthId ? { ...length, ...patch } : length
              ),
            }
          : row
      )
    )
  }

  const addRow = () => {
    commit([
      ...table,
      {
        id: newId('price_row'),
        grams: '100g',
        active: true,
        order: table.length + 1,
        lengths: [
          {
            id: newId('price_len'),
            size: '60/65/70cm',
            price: 0,
            active: true,
            order: 1,
          },
        ],
      },
    ])
  }

  const removeRow = (rowId: string) => {
    commit(table.filter((row) => row.id !== rowId))
  }

  const addLength = (rowId: string) => {
    commit(
      table.map((row) => {
        if (row.id !== rowId) return row
        const lengths = Array.isArray(row.lengths) ? row.lengths : []
        return {
          ...row,
          lengths: [
            ...lengths,
            {
              id: newId('price_len'),
              size: '75/80cm',
              price: 0,
              active: true,
              order: lengths.length + 1,
            },
          ],
        }
      })
    )
  }

  const removeLength = (rowId: string, lengthId: string) => {
    commit(
      table.map((row) =>
        row.id === rowId
          ? {
              ...row,
              lengths: (Array.isArray(row.lengths) ? row.lengths : []).filter(
                (length: any) => length.id !== lengthId
              ),
            }
          : row
      )
    )
  }

  return (
    <div className="space-y-3 rounded-xl border border-[#d8e3ff] bg-[#f8faff] p-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            Tabela visual de gramas, tamanhos e valores
          </p>
          <p className="text-xs text-slate-500">
            Edite valores como 100g, 60/65/70cm e R$ 360 exibidos no chatbot.
          </p>
        </div>
        <button
          type="button"
          onClick={addRow}
          className="rounded-lg border border-[#b8c7ff] bg-white px-3 py-2 text-xs font-bold text-[#3247d3]"
        >
          Adicionar gramas
        </button>
      </div>
      {table.length === 0 ? (
        <p className="text-sm text-slate-500">
          Sem tabela. O chatbot usará o valor base do serviço.
        </p>
      ) : (
        <div className="space-y-3">
          {table.map((row) => (
            <div key={row.id} className="space-y-2 rounded-lg border border-white bg-white p-3">
              <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
                <input
                  value={row.grams || ''}
                  onChange={(event) => updateRow(row.id, { grams: event.target.value })}
                  placeholder="Ex: 100g"
                  className="admin-input"
                />
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={row.active !== false}
                    onChange={(event) => updateRow(row.id, { active: event.target.checked })}
                    className="accent-[#3247d3]"
                  />
                  Ativo
                </label>
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600"
                >
                  Remover gramas
                </button>
              </div>
              <div className="space-y-2">
                {(Array.isArray(row.lengths) ? row.lengths : []).map((length: any) => (
                  <div key={length.id} className="grid gap-2 md:grid-cols-[1fr_120px_auto_auto]">
                    <input
                      value={length.size || ''}
                      onChange={(event) => updateLength(row.id, length.id, { size: event.target.value })}
                      placeholder="Ex: 60/65/70cm"
                      className="admin-input"
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={length.price ?? ''}
                      onChange={(event) =>
                        updateLength(row.id, length.id, {
                          price: Number(event.target.value || 0),
                        })
                      }
                      placeholder="Valor"
                      className="admin-input"
                    />
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <input
                        type="checkbox"
                        checked={length.active !== false}
                        onChange={(event) =>
                          updateLength(row.id, length.id, { active: event.target.checked })
                        }
                        className="accent-[#3247d3]"
                      />
                      Ativo
                    </label>
                    <button
                      type="button"
                      onClick={() => removeLength(row.id, length.id)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600"
                    >
                      Remover
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addLength(row.id)}
                  className="rounded-lg border border-[#b8c7ff] px-3 py-2 text-xs font-bold text-[#3247d3]"
                >
                  Adicionar tamanho
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MediaUpload({ label, value, uploading, onUpload, onClear }: {
  label: string
  value?: string
  uploading: boolean
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
        {value ? <button type="button" onClick={onClear} className="text-xs font-bold text-red-600">Remover</button> : null}
      </div>
      <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#b8c7ff] bg-[#f8faff] p-4 text-center text-sm text-slate-500 transition hover:border-[#6b83ff]">
        {value ? (
          <img src={value} alt={label} className="h-40 w-full rounded-lg object-cover" />
        ) : (
          <span>{uploading ? 'Enviando...' : 'Clique para enviar arquivo'}</span>
        )}
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" onChange={onUpload} className="hidden" />
      </label>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#d8e3ff] bg-gradient-to-b from-white to-[#f8faff] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="font-display text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}
