'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

type ShippingRuleScope = 'CATEGORY' | 'PRODUCT'

type CatalogCategory = {
  id: string
  name: string
  slug: string
}

type CatalogProduct = {
  id: string
  name: string
  slug: string
  categoryId: string
  category: {
    name: string
  }
}

type ShippingSettingsPayload = {
  config: {
    id: string
    originZipCode: string
    defaultCost: number
    expressMultiplier: number
    freeShippingMin: number
    enableCorreios: boolean
  }
  rules: Array<{
    id: string
    scope: ShippingRuleScope
    targetId: string
    targetLabel: string | null
    fixedCost: number
    deliveryDays: number
    isActive: boolean
  }>
}

type ShippingRuleForm = {
  id?: string
  scope: ShippingRuleScope
  targetId: string
  targetLabel: string
  fixedCost: string
  deliveryDays: string
  isActive: boolean
}

export default function AdminShipping() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [config, setConfig] = useState({
    originZipCode: '01001001',
    defaultCost: '20',
    expressMultiplier: '2.5',
    freeShippingMin: '300',
    enableCorreios: true,
  })
  const [rules, setRules] = useState<ShippingRuleForm[]>([])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/shipping')
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar configuracoes de frete')
      }

      const settings: ShippingSettingsPayload = data.settings
      setCategories(data.catalogs?.categories || [])
      setProducts(data.catalogs?.products || [])
      setConfig({
        originZipCode: settings.config.originZipCode || '01001001',
        defaultCost: String(settings.config.defaultCost ?? 20),
        expressMultiplier: String(settings.config.expressMultiplier ?? 2.5),
        freeShippingMin: String(settings.config.freeShippingMin ?? 300),
        enableCorreios: Boolean(settings.config.enableCorreios),
      })
      setRules(
        (settings.rules || []).map((rule) => ({
          id: rule.id,
          scope: rule.scope,
          targetId: rule.targetId,
          targetLabel: rule.targetLabel || '',
          fixedCost: String(rule.fixedCost ?? 0),
          deliveryDays: String(rule.deliveryDays ?? 7),
          isActive: Boolean(rule.isActive),
        }))
      )
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar frete',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const productMap = useMemo(
    () => new Map(products.map((item) => [item.id, item])),
    [products]
  )
  const categoryMap = useMemo(
    () => new Map(categories.map((item) => [item.id, item])),
    [categories]
  )

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      {
        scope: 'CATEGORY',
        targetId: '',
        targetLabel: '',
        fixedCost: config.defaultCost,
        deliveryDays: '7',
        isActive: true,
      },
    ])
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        config: {
          originZipCode: config.originZipCode,
          defaultCost: Number(config.defaultCost || 0),
          expressMultiplier: Number(config.expressMultiplier || 2.5),
          freeShippingMin: Number(config.freeShippingMin || 300),
          enableCorreios: config.enableCorreios,
        },
        rules: rules
          .filter((rule) => rule.targetId)
          .map((rule) => ({
            id: rule.id,
            scope: rule.scope,
            targetId: rule.targetId,
            targetLabel: rule.targetLabel || null,
            fixedCost: Number(rule.fixedCost || 0),
            deliveryDays: Number(rule.deliveryDays || 7),
            isActive: rule.isActive,
          })),
      }

      const response = await fetch('/api/admin/shipping', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar frete')
      }
      toast({
        title: 'Frete atualizado',
        description: 'Configuracoes e regras foram salvas.',
      })
      await fetchSettings()
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar frete',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
        <h2 className="font-display font-bold text-xl text-foreground">
          Configuracao de Frete
        </h2>
        {loading ? (
          <p className="text-muted-foreground">Carregando configuracoes...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">CEP origem da loja</label>
                <input
                  value={config.originZipCode}
                  onChange={(event) =>
                    setConfig((prev) => ({
                      ...prev,
                      originZipCode: event.target.value.replace(/\D/g, '').slice(0, 8),
                    }))
                  }
                  className="w-full px-4 py-3 border border-pink-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Frete padrao (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.defaultCost}
                  onChange={(event) =>
                    setConfig((prev) => ({ ...prev, defaultCost: event.target.value }))
                  }
                  className="w-full px-4 py-3 border border-pink-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Multiplicador expresso
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={config.expressMultiplier}
                  onChange={(event) =>
                    setConfig((prev) => ({
                      ...prev,
                      expressMultiplier: event.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-pink-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Minimo para frete gratis (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={config.freeShippingMin}
                  onChange={(event) =>
                    setConfig((prev) => ({ ...prev, freeShippingMin: event.target.value }))
                  }
                  className="w-full px-4 py-3 border border-pink-200 rounded-lg"
                />
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={config.enableCorreios}
                onChange={(event) =>
                  setConfig((prev) => ({
                    ...prev,
                    enableCorreios: event.target.checked,
                  }))
                }
                className="accent-primary"
              />
              Usar integracao Correios quando nao houver regra especifica
            </label>
          </>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display font-bold text-lg text-foreground">
            Regras por Categoria ou Produto
          </h3>
          <button
            type="button"
            onClick={addRule}
            className="px-4 py-2 rounded-lg border border-pink-200 text-sm font-semibold inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar regra
          </button>
        </div>

        {rules.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma regra cadastrada. O sistema usara o frete padrao.
          </p>
        ) : (
          <div className="space-y-4">
            {rules.map((rule, index) => {
              const selectedProduct = productMap.get(rule.targetId)
              const selectedCategory = categoryMap.get(rule.targetId)
              const resolvedLabel =
                rule.scope === 'PRODUCT'
                  ? selectedProduct?.name || rule.targetLabel
                  : selectedCategory?.name || rule.targetLabel

              return (
                <div
                  key={`${rule.id || 'new'}-${index}`}
                  className="border border-pink-100 rounded-xl p-4 space-y-3 bg-pink-50/30"
                >
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setRules((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
                      }
                      className="text-xs text-red-600 inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remover
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-2">Escopo</label>
                      <select
                        value={rule.scope}
                        onChange={(event) =>
                          setRules((prev) =>
                            prev.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    scope: event.target.value as ShippingRuleScope,
                                    targetId: '',
                                    targetLabel: '',
                                  }
                                : item
                            )
                          )
                        }
                        className="w-full px-3 py-2 border border-pink-200 rounded-lg"
                      >
                        <option value="CATEGORY">Categoria</option>
                        <option value="PRODUCT">Produto</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-2">
                        {rule.scope === 'PRODUCT' ? 'Produto' : 'Categoria'}
                      </label>
                      <select
                        value={rule.targetId}
                        onChange={(event) =>
                          setRules((prev) =>
                            prev.map((item, itemIndex) => {
                              if (itemIndex !== index) return item
                              const targetId = event.target.value
                              const targetLabel =
                                item.scope === 'PRODUCT'
                                  ? productMap.get(targetId)?.name || ''
                                  : categoryMap.get(targetId)?.name || ''
                              return {
                                ...item,
                                targetId,
                                targetLabel,
                              }
                            })
                          )
                        }
                        className="w-full px-3 py-2 border border-pink-200 rounded-lg"
                      >
                        <option value="">Selecione</option>
                        {(rule.scope === 'PRODUCT' ? products : categories).map((item: any) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                            {item.category?.name ? ` (${item.category.name})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-2">Frete fixo (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={rule.fixedCost}
                        onChange={(event) =>
                          setRules((prev) =>
                            prev.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, fixedCost: event.target.value }
                                : item
                            )
                          )
                        }
                        className="w-full px-3 py-2 border border-pink-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-2">Prazo (dias)</label>
                      <input
                        type="number"
                        min={1}
                        value={rule.deliveryDays}
                        onChange={(event) =>
                          setRules((prev) =>
                            prev.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, deliveryDays: event.target.value }
                                : item
                            )
                          )
                        }
                        className="w-full px-3 py-2 border border-pink-200 rounded-lg"
                      />
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm font-medium pt-7">
                      <input
                        type="checkbox"
                        checked={rule.isActive}
                        onChange={(event) =>
                          setRules((prev) =>
                            prev.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, isActive: event.target.checked }
                                : item
                            )
                          )
                        }
                        className="accent-primary"
                      />
                      Regra ativa
                    </label>
                  </div>

                  {resolvedLabel ? (
                    <p className="text-xs text-muted-foreground">
                      Aplicado em: <span className="font-semibold">{resolvedLabel}</span>
                    </p>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 flex items-center justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-6 py-3 bg-primary text-white rounded-xl font-semibold disabled:opacity-60"
        >
          {saving ? 'Salvando...' : 'Salvar frete'}
        </button>
      </div>
    </div>
  )
}

