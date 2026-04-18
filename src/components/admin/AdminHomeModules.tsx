'use client'

import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { HomeModuleConfig } from '@/lib/home-modules-defaults'

function sortModules(modules: HomeModuleConfig[]) {
  return [...modules]
    .sort((a, b) => a.position - b.position)
    .map((module, index) => ({
      ...module,
      position: index,
      instagramPhotos: module.instagramPhotos || [],
      plans: module.plans || [],
    }))
}

function parseListInput(rawValue: string) {
  return rawValue
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

export default function AdminHomeModules() {
  const [modules, setModules] = useState<HomeModuleConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingModuleKey, setSavingModuleKey] = useState('')
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})

  const fetchModules = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/home-modules')
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar modulos.')
      }
      setModules(sortModules(data.modules || []))
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar configuracoes da home',
        description: error?.message || 'Tente novamente em instantes.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModules()
  }, [])

  const hasModules = modules.length > 0

  const canSaveModule = (module: HomeModuleConfig) =>
    module.title.trim().length > 0 &&
    module.description.trim().length > 0 &&
    module.buttonText.trim().length > 0

  const updateModule = (index: number, patch: Partial<HomeModuleConfig>) => {
    setModules((prev) =>
      prev.map((module, itemIndex) =>
        itemIndex === index
          ? {
              ...module,
              ...patch,
            }
          : module
      )
    )
  }

  const moveModule = (index: number, direction: 'up' | 'down') => {
    setModules((prev) => {
      const next = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= next.length) {
        return prev
      }
      const current = next[index]
      next[index] = next[targetIndex]
      next[targetIndex] = current
      return next.map((module, itemIndex) => ({ ...module, position: itemIndex }))
    })
  }

  const handleSave = async (moduleKey?: string) => {
    setSaving(true)
    if (moduleKey) setSavingModuleKey(moduleKey)
    try {
      const payload = {
        modules: modules.map((module, index) => ({
          ...module,
          position: index,
          href: module.href || '',
          image: module.image || '',
          shadow: module.shadow || '',
          instagramUrl: module.instagramUrl || '',
          instagramPhotos: module.instagramPhotos || [],
          plans: module.plans || [],
        })),
      }

      const response = await fetch('/api/admin/home-modules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar modulos.')
      }

      setModules(sortModules(data.modules || []))
      toast({
        title: moduleKey ? 'Modulo atualizado' : 'Pagina inicial atualizada',
        description: moduleKey ? 'Alteracao deste modulo salva com sucesso.' : 'Modulos salvos com sucesso.',
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar modulos',
        description: error?.message || 'Tente novamente em instantes.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
      setSavingModuleKey('')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6">
        <p className="text-muted-foreground">Carregando configuracoes da pagina inicial...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-md p-6 space-y-3">
        <h2 className="font-display font-bold text-xl text-foreground">
          Modulos da Pagina Inicial
        </h2>
        <p className="text-sm text-muted-foreground">
          Ative/desative, edite e reordene os blocos da home. Alteracoes so entram no ar apos
          clicar em salvar.
        </p>
      </div>

      {!hasModules ? (
        <div className="bg-white rounded-2xl shadow-md p-6">
          <p className="text-muted-foreground">Nenhum modulo encontrado.</p>
        </div>
      ) : (
        modules.map((module, index) => (
          <div key={module.key} className="bg-white rounded-2xl shadow-md p-6 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <GripVertical className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-semibold text-foreground">{module.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Chave: {module.key} • Posicao {index + 1}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedModules((prev) => ({
                      ...prev,
                      [module.key]: !prev[module.key],
                    }))
                  }
                  className="px-3 py-2 text-sm rounded-lg border border-pink-200 font-semibold text-primary"
                >
                  {expandedModules[module.key] ? 'Recolher' : 'Editar'}
                </button>
                <button
                  type="button"
                  onClick={() => moveModule(index, 'up')}
                  disabled={index === 0}
                  className="px-3 py-2 text-sm rounded-lg border border-pink-200 disabled:opacity-50"
                >
                  <span className="inline-flex items-center gap-1">
                    <ArrowUp className="w-4 h-4" />
                    Subir
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => moveModule(index, 'down')}
                  disabled={index === modules.length - 1}
                  className="px-3 py-2 text-sm rounded-lg border border-pink-200 disabled:opacity-50"
                >
                  <span className="inline-flex items-center gap-1">
                    <ArrowDown className="w-4 h-4" />
                    Descer
                  </span>
                </button>
                <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={module.enabled}
                    onChange={(event) => updateModule(index, { enabled: event.target.checked })}
                    className="accent-primary"
                  />
                  Ativo
                </label>
              </div>
            </div>

            {expandedModules[module.key] ? (
              <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Titulo</label>
                <input
                  value={module.title}
                  onChange={(event) => updateModule(index, { title: event.target.value })}
                  className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Subtitulo (emoji)</label>
                <input
                  value={module.subtitle}
                  onChange={(event) => updateModule(index, { subtitle: event.target.value })}
                  className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Descricao</label>
              <textarea
                value={module.description}
                onChange={(event) => updateModule(index, { description: event.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Texto do botao</label>
                <input
                  value={module.buttonText}
                  onChange={(event) => updateModule(index, { buttonText: event.target.value })}
                  className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Link (interno ou externo)</label>
                <input
                  value={module.href || ''}
                  onChange={(event) => updateModule(index, { href: event.target.value })}
                  placeholder="/shop ou https://wa.me/..."
                  className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Imagem (URL)</label>
                <input
                  value={module.image || ''}
                  onChange={(event) => updateModule(index, { image: event.target.value })}
                  className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                />
              </div>
              <div className="flex items-center gap-4 pt-8">
                <label className="inline-flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={Boolean(module.openChatbot)}
                    onChange={(event) =>
                      updateModule(index, { openChatbot: event.target.checked })
                    }
                    className="accent-primary"
                  />
                  Abrir chatbot no clique
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={Boolean(module.isPrimary)}
                    onChange={(event) =>
                      updateModule(index, { isPrimary: event.target.checked })
                    }
                    className="accent-primary"
                  />
                  Botao principal
                </label>
              </div>
            </div>

            {module.key === 'club' && (
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Planos/assinaturas (1 por linha)
                </label>
                <textarea
                  value={(module.plans || []).join('\n')}
                  onChange={(event) =>
                    updateModule(index, { plans: parseListInput(event.target.value) })
                  }
                  rows={4}
                  className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                />
              </div>
            )}

            {module.key === 'instagram' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">URL do Instagram</label>
                  <input
                    value={module.instagramUrl || ''}
                    onChange={(event) =>
                      updateModule(index, { instagramUrl: event.target.value })
                    }
                    placeholder="https://www.instagram.com/seu-perfil/"
                    className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Fotos do Instagram (1 por linha)
                  </label>
                  <textarea
                    value={(module.instagramPhotos || []).join('\n')}
                    onChange={(event) =>
                      updateModule(index, { instagramPhotos: parseListInput(event.target.value) })
                    }
                    rows={4}
                    className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleSave(module.key)}
                disabled={!canSaveModule(module) || saving}
                className="px-6 py-3 bg-primary text-white rounded-xl font-semibold disabled:opacity-60"
              >
                {savingModuleKey === module.key ? 'Salvando...' : 'Salvar este modulo'}
              </button>
            </div>
              </>
            ) : null}
          </div>
        ))
      )}
    </div>
  )
}
