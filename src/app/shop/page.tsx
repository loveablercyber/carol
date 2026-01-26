'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, Search, SlidersHorizontal, Star, Heart, ChevronDown, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDescription: string
  price: number
  compareAtPrice?: number
  images: string[]
  hairType?: string
  texture?: string
  color?: string
  inStock: boolean
  stock: number
  featured: boolean
  avgRating: number
  reviewCount: number
  category: {
    id: string
    name: string
    slug: string
  }
}

interface Category {
  id: string
  name: string
  slug: string
  description: string
  image: string
  productCount: number
}

interface Filters {
  category?: string
  hairType?: string
  texture?: string
  minPrice?: number
  maxPrice?: number
  search?: string
}

export default function ShopPage() {
  const router = useRouter()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Filtros
  const [filters, setFilters] = useState<Filters>({
    category: undefined,
    search: '',
  })

  const [sortBy, setSortBy] = useState('createdAt')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Ler filtros da URL no client
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setFilters((prev) => ({
      ...prev,
      category: params.get('category') || undefined,
      search: params.get('search') || '',
    }))
  }, [])

  // Opções de filtros
  const hairTypes = ['HUMANO', 'SINTÉTICO', 'MISTO']
  const textures = ['LISO', 'CACHEADO', 'ONDULADO']
  const sortOptions = [
    { value: 'createdAt', label: 'Mais Recentes' },
    { value: 'price-asc', label: 'Menor Preço' },
    { value: 'price-desc', label: 'Maior Preço' },
    { value: 'name', label: 'Nome A-Z' },
  ]

  // Debounce para busca
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search)
    }, 500)
    return () => clearTimeout(timer)
  }, [filters.search])

  // Buscar produtos
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (filters.category) params.append('category', filters.category)
        if (filters.hairType) params.append('hairType', filters.hairType)
        if (filters.texture) params.append('texture', filters.texture)
        if (filters.minPrice) params.append('minPrice', filters.minPrice.toString())
        if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString())
        if (debouncedSearch) params.append('search', debouncedSearch)
        params.append('sortBy', sortBy)
        params.append('page', page.toString())
        params.append('limit', '12')

        const response = await fetch(`/api/shop/products?${params.toString()}`)
        const data = await response.json()
        setProducts(data.products || [])
        setTotalPages(data.pagination?.totalPages || 1)
      } catch (error) {
        console.error('Erro ao buscar produtos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [filters, debouncedSearch, sortBy, page])

  // Buscar categorias
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/shop/categories')
        const data = await response.json()
        setCategories(data.categories || [])
      } catch (error) {
        console.error('Erro ao buscar categorias:', error)
      }
    }

    fetchCategories()
  }, [])

  // Buscar carrinho
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await fetch('/api/shop/cart')
        const data = await response.json()
        setCartCount(data.totals?.itemCount || 0)
      } catch (error) {
        console.error('Erro ao buscar carrinho:', error)
      }
    }

    fetchCart()
  }, [])

  // Adicionar ao carrinho
  const addToCart = async (productId: string) => {
    try {
      const response = await fetch('/api/shop/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      })

      if (response.ok) {
        const data = await response.json()
        setCartCount((current) => data.totals?.itemCount ?? current + 1)
        toast({
          title: 'Adicionado ao carrinho',
          description: 'Produto incluído com sucesso.',
        })
      } else {
        toast({
          title: 'Não foi possível adicionar',
          description: 'Tente novamente em instantes.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error)
      toast({
        title: 'Erro ao adicionar ao carrinho',
        description: 'Verifique sua conexão e tente de novo.',
        variant: 'destructive',
      })
    }
  }

  // Limpar filtros
  const clearFilters = () => {
    setFilters({ search: filters.search })
    setPage(1)
  }

  // Contar filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.category) count++
    if (filters.hairType) count++
    if (filters.texture) count++
    if (filters.minPrice || filters.maxPrice) count++
    return count
  }, [filters])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-white to-white pb-24">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-foreground">Voltar</span>
          </Link>
          <h1 className="font-display font-bold text-xl text-foreground">Loja Online</h1>
          <Link href="/shop/cart" className="relative">
            <ShoppingBag className="w-6 h-6 text-foreground" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Barra de Busca */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar de Filtros */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-lg">Filtros</h2>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Limpar
                  </button>
                )}
              </div>

              {/* Categorias */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Categorias</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      checked={!filters.category}
                      onChange={() => setFilters({ ...filters, category: undefined })}
                      className="text-primary focus:ring-pink-400"
                    />
                    <span>Todas</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        checked={filters.category === cat.id}
                        onChange={() => setFilters({ ...filters, category: cat.id })}
                        className="text-primary focus:ring-pink-400"
                      />
                      <span>{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tipo de Cabelo */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Tipo de Cabelo</h3>
                <div className="space-y-2">
                  {hairTypes.map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="hairType"
                        checked={filters.hairType === type}
                        onChange={() => setFilters({ ...filters, hairType: type })}
                        className="text-primary focus:ring-pink-400"
                      />
                      <span className="capitalize">{type.toLowerCase()}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Textura */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Textura</h3>
                <div className="space-y-2">
                  {textures.map((texture) => (
                    <label key={texture} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="texture"
                        checked={filters.texture === texture}
                        onChange={() => setFilters({ ...filters, texture: texture })}
                        className="text-primary focus:ring-pink-400"
                      />
                      <span className="capitalize">{texture.toLowerCase()}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Preço */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Faixa de Preço</h3>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice || ''}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-pink-200 rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice || ''}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-pink-200 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Conteúdo Principal */}
          <div className="flex-1">
            {/* Mobile Filters Toggle */}
            <div className="lg:hidden mb-6">
              <button
                onClick={() => setFiltersOpen(true)}
                className="w-full py-3 bg-white rounded-xl shadow-md flex items-center justify-center gap-2 font-semibold"
              >
                <SlidersHorizontal className="w-5 h-5" />
                Filtros ({activeFiltersCount})
              </button>
            </div>

            {/* Header com Contagem e Ordenação */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                {products.length} produto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid de Produtos */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-md p-6 animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="font-display font-bold text-xl text-foreground mb-2">
                  Nenhum produto encontrado
                </h3>
                <p className="text-muted-foreground">
                  Tente ajustar seus filtros ou buscar por outro termo
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/shop/products/${product.slug}`}
                    className="bg-white rounded-2xl shadow-md overflow-hidden border border-pink-100 hover:border-pink-300 hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className="relative h-64 overflow-hidden">
                      {product.images[0] && (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      )}
                      {product.featured && (
                        <span className="absolute top-3 left-3 bg-gradient-to-r from-[#F8B6D8] to-[#E91E63] text-white text-xs font-bold px-3 py-1 rounded-full">
                          Destaque
                        </span>
                      )}
                      <button className="absolute top-3 right-3 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-md">
                        <Heart className="w-5 h-5 text-gray-400 hover:text-red-500 transition-colors" />
                      </button>
                      {!product.inStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">Esgotado</span>
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <p className="text-xs text-primary mb-1">{product.category.name}</p>
                      <h3 className="font-display font-bold text-lg mb-2 text-foreground line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {product.shortDescription || product.description}
                      </p>

                      <div className="flex items-center gap-1 mb-3">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">{product.avgRating}</span>
                        <span className="text-xs text-muted-foreground">
                          ({product.reviewCount})
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          {product.compareAtPrice && (
                            <span className="text-sm text-muted-foreground line-through mr-2">
                              R$ {product.compareAtPrice.toFixed(2).replace('.', ',')}
                            </span>
                          )}
                          <div className="font-display font-bold text-xl text-primary">
                            R$ {product.price.toFixed(2).replace('.', ',')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white rounded-lg border border-pink-200 disabled:opacity-50"
                >
                  Anterior
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`px-4 py-2 rounded-lg ${
                      page === i + 1
                        ? 'bg-primary text-white'
                        : 'bg-white border border-pink-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white rounded-lg border border-pink-200 disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setFiltersOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-white overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-lg">Filtros</h2>
                <button onClick={() => setFiltersOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Mesmos filtros da sidebar */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Categorias</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="category-mobile"
                      checked={!filters.category}
                      onChange={() => setFilters({ ...filters, category: undefined })}
                      className="text-primary"
                    />
                    <span>Todas</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="category-mobile"
                        checked={filters.category === cat.id}
                        onChange={() => setFilters({ ...filters, category: cat.id })}
                        className="text-primary"
                      />
                      <span>{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-3">Tipo de Cabelo</h3>
                <div className="space-y-2">
                  {hairTypes.map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="hairType-mobile"
                        checked={filters.hairType === type}
                        onChange={() => setFilters({ ...filters, hairType: type })}
                        className="text-primary"
                      />
                      <span className="capitalize">{type.toLowerCase()}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-3">Textura</h3>
                <div className="space-y-2">
                  {textures.map((texture) => (
                    <label key={texture} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="texture-mobile"
                        checked={filters.texture === texture}
                        onChange={() => setFilters({ ...filters, texture: texture })}
                        className="text-primary"
                      />
                      <span className="capitalize">{texture.toLowerCase()}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-3">Faixa de Preço</h3>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice || ''}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-pink-200 rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice || ''}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-pink-200 rounded-lg"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  clearFilters()
                  setFiltersOpen(false)
                }}
                className="w-full py-3 bg-primary text-white rounded-xl font-semibold"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
