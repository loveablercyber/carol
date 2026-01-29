"use client"

import { useEffect, useMemo, useState } from 'react'
import { toast } from '@/hooks/use-toast'

interface Category {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  stock: number
  isActive: boolean
  featured: boolean
  categoryId: string
  category?: Category
  images: string[]
  description?: string
  shortDescription?: string
}

const initialForm = {
  name: '',
  slug: '',
  price: '',
  stock: '',
  categoryId: '',
  description: '',
  shortDescription: '',
  images: '',
  isActive: true,
  featured: false,
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(initialForm)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active')

  const filteredProducts = useMemo(() => {
    if (!search) return products
    return products.filter((product) =>
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.slug.toLowerCase().includes(search.toLowerCase())
    )
  }, [products, search])

  const activeProducts = useMemo(
    () => filteredProducts.filter((product) => product.isActive),
    [filteredProducts]
  )

  const inactiveProducts = useMemo(
    () => filteredProducts.filter((product) => !product.isActive),
    [filteredProducts]
  )

  const fetchData = async () => {
    setLoading(true)
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/shop/products?all=true&limit=200'),
        fetch('/api/shop/categories?all=true'),
      ])

      const productsData = await productsRes.json()
      const categoriesData = await categoriesRes.json()
      setProducts(productsData.products || [])
      setCategories(categoriesData.categories || [])
    } catch (error) {
      toast({
        title: 'Erro ao carregar produtos',
        description: 'Tente novamente em instantes.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setForm(initialForm)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)

    try {
      const payload = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        price: Number(String(form.price).replace(',', '.')),
        stock: Number(String(form.stock || 0).replace(',', '.')),
        categoryId: form.categoryId,
        description: form.description,
        shortDescription: form.shortDescription,
        images: form.images
          .split(',')
          .map((img) => img.trim())
          .filter(Boolean),
        isActive: form.isActive,
        featured: form.featured,
      }

      const response = await fetch(
        editingId ? `/api/shop/products/${editingId}` : '/api/shop/products',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar produto')
      }

      toast({
        title: editingId ? 'Produto atualizado' : 'Produto criado',
        description: 'Alteracoes salvas com sucesso.',
      })
      resetForm()
      fetchData()
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar produto',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingId(product.id)
    setForm({
      name: product.name,
      slug: product.slug,
      price: String(product.price),
      stock: String(product.stock),
      categoryId: product.categoryId,
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      images: product.images?.join(', ') || '',
      isActive: product.isActive,
      featured: product.featured,
    })
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('Tem certeza que deseja remover este produto?')) return
    try {
      const response = await fetch(`/api/shop/products/${productId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao remover produto')
      }
      const data = await response.json()
      if (data?.softDeleted) {
        toast({ title: 'Produto desativado', description: data.message || 'Produto possui pedidos.' })
      } else {
        toast({ title: 'Produto removido' })
      }
      setProducts((prev) => prev.filter((p) => p.id !== productId))
    } catch (error: any) {
      toast({
        title: 'Erro ao remover produto',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  const handleActivate = async (product: Product) => {
    try {
      const response = await fetch(`/api/shop/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: true,
          inStock: product.stock > 0,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao ativar produto')
      }

      toast({ title: 'Produto ativado' })
      fetchData()
    } catch (error: any) {
      toast({
        title: 'Erro ao ativar produto',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-md p-6 space-y-4"
      >
        <h2 className="font-display font-bold text-xl text-foreground">
          {editingId ? 'Editar produto' : 'Novo produto'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Nome</label>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  name: event.target.value,
                  slug: prev.slug ? prev.slug : slugify(event.target.value),
                }))
              }
              required
              className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Slug</label>
            <input
              value={form.slug}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, slug: event.target.value }))
              }
              required
              className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Preco</label>
            <input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, price: event.target.value }))
              }
              required
              className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Estoque</label>
            <input
              type="number"
              value={form.stock}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, stock: event.target.value }))
              }
              className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Categoria</label>
            <select
              value={form.categoryId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, categoryId: event.target.value }))
              }
              required
              className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
            >
              <option value="">Selecione</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Imagens (URLs)</label>
            <input
              value={form.images}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, images: event.target.value }))
              }
              placeholder="url1, url2"
              className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Descricao curta</label>
          <input
            value={form.shortDescription}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, shortDescription: event.target.value }))
            }
            className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Descricao</label>
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
            rows={4}
            required
            className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
          />
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, isActive: event.target.checked }))
              }
              className="accent-primary"
            />
            Ativo
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, featured: event.target.checked }))
              }
              className="accent-primary"
            />
            Destaque
          </label>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-primary text-white rounded-xl font-semibold disabled:opacity-60"
          >
            {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar produto'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 border border-pink-200 rounded-xl font-semibold text-muted-foreground"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="font-display font-bold text-xl text-foreground">
            Produtos cadastrados
          </h2>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar produto"
            className="w-full md:max-w-sm px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
              activeTab === 'active'
                ? 'bg-primary text-white border-primary'
                : 'border-pink-200 text-muted-foreground hover:border-pink-300'
            }`}
          >
            Ativos ({activeProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
              activeTab === 'inactive'
                ? 'bg-primary text-white border-primary'
                : 'border-pink-200 text-muted-foreground hover:border-pink-300'
            }`}
          >
            Desativados ({inactiveProducts.length})
          </button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Carregando produtos...</p>
        ) : activeTab === 'active' && activeProducts.length === 0 ? (
          <p className="text-muted-foreground">Nenhum produto ativo encontrado.</p>
        ) : activeTab === 'inactive' && inactiveProducts.length === 0 ? (
          <p className="text-muted-foreground">Nenhum produto desativado encontrado.</p>
        ) : (
          <div className="space-y-3">
            {(activeTab === 'active' ? activeProducts : inactiveProducts).map((product) => (
              <div
                key={product.id}
                className="border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    R$ {product.price.toFixed(2).replace('.', ',')} • Estoque {product.stock}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {product.category?.name || 'Sem categoria'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="px-4 py-2 text-sm rounded-lg border border-pink-200 text-primary hover:border-pink-400"
                  >
                    Editar
                  </button>
                  {activeTab === 'inactive' && (
                    <button
                      onClick={() => handleActivate(product)}
                      className="px-4 py-2 text-sm rounded-lg border border-green-200 text-green-700 hover:border-green-400"
                    >
                      Ativar
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="px-4 py-2 text-sm rounded-lg border border-red-200 text-red-600 hover:border-red-400"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
