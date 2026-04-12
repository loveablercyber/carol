'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from '@/hooks/use-toast'

type Review = {
  id: string
  productId: string
  rating: number
  title: string | null
  comment: string
  author: string | null
  verified: boolean
  isActive: boolean
  createdAt: string
  user: { id: string; name: string | null; email: string } | null
  product: { id: string; name: string; slug: string }
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [search, setSearch] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [edits, setEdits] = useState<Record<string, Partial<Review>>>({})

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status,
      })
      if (search.trim()) {
        params.set('search', search.trim())
      }
      const response = await fetch(`/api/admin/reviews?${params.toString()}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar comentarios')
      }
      setReviews(data.reviews || [])
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar comentarios',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [status])

  const filteredBySearch = useMemo(() => {
    if (!search.trim()) return reviews
    const term = search.toLowerCase()
    return reviews.filter(
      (review) =>
        review.comment.toLowerCase().includes(term) ||
        (review.title || '').toLowerCase().includes(term) ||
        (review.author || '').toLowerCase().includes(term) ||
        review.product.name.toLowerCase().includes(term)
    )
  }, [reviews, search])

  const getEdit = (review: Review) =>
    edits[review.id] || {
      rating: review.rating,
      title: review.title || '',
      comment: review.comment,
      author: review.author || '',
      verified: review.verified,
      isActive: review.isActive,
    }

  const saveReview = async (review: Review) => {
    const payload = getEdit(review)
    setSavingId(review.id)
    try {
      const response = await fetch(`/api/admin/reviews/${review.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar comentario')
      }
      setReviews((prev) =>
        prev.map((item) => (item.id === review.id ? { ...item, ...data.review } : item))
      )
      setEdits((prev) => {
        const next = { ...prev }
        delete next[review.id]
        return next
      })
      toast({ title: 'Comentario atualizado' })
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar comentario',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSavingId(null)
    }
  }

  const removeReview = async (reviewId: string) => {
    if (!confirm('Remover este comentario?')) return
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao remover comentario')
      }
      setReviews((prev) => prev.filter((item) => item.id !== reviewId))
      toast({ title: 'Comentario removido' })
    } catch (error: any) {
      toast({
        title: 'Erro ao remover comentario',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-xl text-foreground">
              Comentarios e Avaliacoes
            </h2>
            <p className="text-sm text-muted-foreground">
              Modere comentarios, ajuste nota e mantenha apenas conteudo valido.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as any)}
              className="px-4 py-2 border border-pink-200 rounded-lg"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar comentario..."
              className="px-4 py-2 border border-pink-200 rounded-lg"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-md p-6 text-muted-foreground">
          Carregando comentarios...
        </div>
      ) : filteredBySearch.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md p-6 text-muted-foreground">
          Nenhum comentario encontrado.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBySearch.map((review) => {
            const edit = getEdit(review)
            return (
              <div
                key={review.id}
                className="bg-white rounded-2xl shadow-md p-5 space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{review.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Autor: {review.author || review.user?.name || review.user?.email || 'Cliente'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        review.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {review.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        review.verified
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {review.verified ? 'Verificado' : 'Nao verificado'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-2">Nota</label>
                    <select
                      value={String(edit.rating || 5)}
                      onChange={(event) =>
                        setEdits((prev) => ({
                          ...prev,
                          [review.id]: {
                            ...edit,
                            rating: Number(event.target.value),
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-pink-200 rounded-lg"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm font-medium pt-7">
                    <input
                      type="checkbox"
                      checked={Boolean(edit.isActive)}
                      onChange={(event) =>
                        setEdits((prev) => ({
                          ...prev,
                          [review.id]: {
                            ...edit,
                            isActive: event.target.checked,
                          },
                        }))
                      }
                      className="accent-primary"
                    />
                    Comentario ativo
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm font-medium pt-7">
                    <input
                      type="checkbox"
                      checked={Boolean(edit.verified)}
                      onChange={(event) =>
                        setEdits((prev) => ({
                          ...prev,
                          [review.id]: {
                            ...edit,
                            verified: event.target.checked,
                          },
                        }))
                      }
                      className="accent-primary"
                    />
                    Compra verificada
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-2">Autor exibido</label>
                    <input
                      value={String(edit.author || '')}
                      onChange={(event) =>
                        setEdits((prev) => ({
                          ...prev,
                          [review.id]: {
                            ...edit,
                            author: event.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-pink-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2">Titulo</label>
                    <input
                      value={String(edit.title || '')}
                      onChange={(event) =>
                        setEdits((prev) => ({
                          ...prev,
                          [review.id]: {
                            ...edit,
                            title: event.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-pink-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2">Comentario</label>
                  <textarea
                    rows={3}
                    value={String(edit.comment || '')}
                    onChange={(event) =>
                      setEdits((prev) => ({
                        ...prev,
                        [review.id]: {
                          ...edit,
                          comment: event.target.value,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 border border-pink-200 rounded-lg"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => removeReview(review.id)}
                    className="px-4 py-2 rounded-lg border border-red-200 text-red-600 font-semibold"
                  >
                    Excluir
                  </button>
                  <button
                    type="button"
                    onClick={() => saveReview(review)}
                    disabled={savingId === review.id}
                    className="px-4 py-2 rounded-lg bg-primary text-white font-semibold disabled:opacity-60"
                  >
                    {savingId === review.id ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

