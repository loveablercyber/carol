"use client"

import { useEffect, useState } from 'react'
import { toast } from '@/hooks/use-toast'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  order: number
  isActive: boolean
}

const initialForm = {
  name: '',
  slug: '',
  description: '',
  image: '',
  order: '0',
  isActive: true,
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(initialForm)

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/shop/categories?all=true')
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      toast({
        title: 'Erro ao carregar categorias',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
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
        description: form.description,
        image: form.image,
        order: Number(form.order),
        isActive: form.isActive,
      }

      const response = await fetch(
        editingId ? `/api/shop/categories/${editingId}` : '/api/shop/categories',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar categoria')
      }

      toast({
        title: editingId ? 'Categoria atualizada' : 'Categoria criada',
      })
      resetForm()
      fetchCategories()
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar categoria',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingId(category.id)
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: category.image || '',
      order: String(category.order ?? 0),
      isActive: category.isActive,
    })
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Deseja remover esta categoria?')) return
    try {
      const response = await fetch(`/api/shop/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao remover categoria')
      }

      toast({ title: 'Categoria removida' })
      setCategories((prev) => prev.filter((cat) => cat.id !== categoryId))
    } catch (error: any) {
      toast({
        title: 'Erro ao remover categoria',
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
          {editingId ? 'Editar categoria' : 'Nova categoria'}
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
            <label className="block text-sm font-semibold mb-2">Imagem (URL)</label>
            <input
              value={form.image}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, image: event.target.value }))
              }
              className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Ordem</label>
            <input
              type="number"
              value={form.order}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, order: event.target.value }))
              }
              className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Descricao</label>
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
            rows={3}
            className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, isActive: event.target.checked }))
            }
            className="accent-primary"
          />
          Categoria ativa
        </label>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-primary text-white rounded-xl font-semibold disabled:opacity-60"
          >
            {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar categoria'}
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
        <h2 className="font-display font-bold text-xl text-foreground">
          Categorias cadastradas
        </h2>
        {loading ? (
          <p className="text-muted-foreground">Carregando categorias...</p>
        ) : categories.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma categoria encontrada.</p>
        ) : (
          <div className="space-y-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{category.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Ordem: {category.order} • {category.isActive ? 'Ativa' : 'Inativa'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="px-4 py-2 text-sm rounded-lg border border-pink-200 text-primary hover:border-pink-400"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
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
