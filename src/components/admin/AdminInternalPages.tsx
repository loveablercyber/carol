'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from '@/hooks/use-toast'

type InternalPage = {
  slug: string
  title: string
  content: Record<string, unknown>
}

type InternalPageDraft = {
  slug: string
  title: string
  contentText: string
  parseError: string
}

function toPrettyJson(value: unknown) {
  return JSON.stringify(value, null, 2)
}

export default function AdminInternalPages() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [drafts, setDrafts] = useState<InternalPageDraft[]>([])

  const fetchPages = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/internal-pages')
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar paginas.')
      }

      const pages: InternalPage[] = Array.isArray(data.pages) ? data.pages : []
      setDrafts(
        pages.map((page) => ({
          slug: page.slug,
          title: page.title,
          contentText: toPrettyJson(page.content || {}),
          parseError: '',
        }))
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

  const hasValidationError = useMemo(
    () =>
      drafts.some(
        (draft) =>
          draft.title.trim().length === 0 ||
          draft.contentText.trim().length === 0 ||
          Boolean(draft.parseError)
      ),
    [drafts]
  )

  const updateDraft = (index: number, patch: Partial<InternalPageDraft>) => {
    setDrafts((prev) =>
      prev.map((draft, itemIndex) =>
        itemIndex === index
          ? {
              ...draft,
              ...patch,
            }
          : draft
      )
    )
  }

  const validateAndParseContent = (rawText: string) => {
    try {
      const parsed = JSON.parse(rawText)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {
          error: 'O conteudo deve ser um objeto JSON.',
          parsed: null,
        }
      }
      return {
        error: '',
        parsed: parsed as Record<string, unknown>,
      }
    } catch {
      return {
        error: 'JSON invalido. Revise o formato do conteudo.',
        parsed: null,
      }
    }
  }

  const handleContentBlur = (index: number, rawText: string) => {
    const validation = validateAndParseContent(rawText)
    if (validation.error) {
      updateDraft(index, { parseError: validation.error })
      return
    }

    updateDraft(index, {
      parseError: '',
      contentText: toPrettyJson(validation.parsed),
    })
  }

  const handleSave = async () => {
    const normalized = drafts.map((draft) => {
      const validation = validateAndParseContent(draft.contentText)
      return {
        draft,
        validation,
      }
    })

    let hasError = false
    normalized.forEach(({ draft, validation }, index) => {
      if (!draft.title.trim()) {
        hasError = true
        updateDraft(index, { parseError: 'Titulo obrigatorio.' })
        return
      }
      if (validation.error) {
        hasError = true
        updateDraft(index, { parseError: validation.error })
      }
    })

    if (hasError) {
      toast({
        title: 'Nao foi possivel salvar',
        description: 'Corrija os campos com erro antes de continuar.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const payload = {
        pages: normalized.map(({ draft, validation }) => ({
          slug: draft.slug,
          title: draft.title.trim(),
          content: validation.parsed || {},
        })),
      }

      const response = await fetch('/api/admin/internal-pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar paginas internas.')
      }

      const pages: InternalPage[] = Array.isArray(data.pages) ? data.pages : []
      setDrafts(
        pages.map((page) => ({
          slug: page.slug,
          title: page.title,
          contentText: toPrettyJson(page.content || {}),
          parseError: '',
        }))
      )

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
        <h2 className="font-display font-bold text-xl text-foreground">
          Editor de Paginas Internas
        </h2>
        <p className="text-sm text-muted-foreground">
          Edite o titulo e o JSON de conteudo de cada pagina interna. As chaves do JSON controlam
          textos, valores, listas de itens e imagens.
        </p>
      </div>

      {drafts.map((draft, index) => (
        <div key={draft.slug} className="bg-white rounded-2xl shadow-md p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-muted-foreground">{draft.slug}</p>
            <label className="block text-sm font-semibold text-foreground">Titulo da pagina</label>
            <input
              value={draft.title}
              onChange={(event) => updateDraft(index, { title: event.target.value, parseError: '' })}
              className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Conteudo (JSON)
            </label>
            <textarea
              value={draft.contentText}
              onChange={(event) =>
                updateDraft(index, { contentText: event.target.value, parseError: '' })
              }
              onBlur={(event) => handleContentBlur(index, event.target.value)}
              rows={18}
              className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400 font-mono text-xs"
            />
            {draft.parseError && (
              <p className="mt-2 text-sm text-red-600">{draft.parseError}</p>
            )}
          </div>
        </div>
      ))}

      <div className="bg-white rounded-2xl shadow-md p-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Dica: nao remova chaves importantes do JSON para evitar quebra de layout.
        </p>
        <button
          type="button"
          disabled={saving || hasValidationError}
          onClick={handleSave}
          className="px-6 py-3 bg-primary text-white rounded-xl font-semibold disabled:opacity-60"
        >
          {saving ? 'Salvando...' : 'Salvar paginas internas'}
        </button>
      </div>
    </div>
  )
}

