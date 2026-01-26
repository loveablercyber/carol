'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, Star, Heart, ChevronLeft, ChevronRight, Plus, Minus, Truck, Shield, RefreshCw } from 'lucide-react'
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
  specs: Record<string, any>
  hairType?: string
  texture?: string
  color?: string
  length?: number
  weight: number
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
  reviews: Review[]
}

interface Review {
  id: string
  author: string
  rating: number
  title?: string
  comment: string
  verified: boolean
  createdAt: string
}

export default function ProductPage() {
  const params = useParams()
  const slug = params.slug as string

  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [cartCount, setCartCount] = useState(0)
  const [addingToCart, setAddingToCart] = useState(false)

  // Buscar produto
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/shop/products/${slug}`)
        const data = await response.json()

        if (data.product) {
          setProduct(data.product)
          setRelatedProducts(data.relatedProducts || [])
          setSelectedImage(0)
        }
      } catch (error) {
        console.error('Erro ao buscar produto:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [slug])

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
  const addToCart = async () => {
    if (!product) return

    setAddingToCart(true)
    try {
      const response = await fetch('/api/shop/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity }),
      })

      if (response.ok) {
        const data = await response.json()
        setCartCount((current) => data.totals?.itemCount ?? current + quantity)
        toast({
          title: 'Adicionado ao carrinho',
          description: `${quantity} item(ns) incluído(s).`,
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
        description: 'Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setAddingToCart(false)
    }
  }

  // Comprar agora - adiciona ao carrinho e vai para checkout
  const buyNow = async () => {
    if (!product) return

    setAddingToCart(true)
    try {
      const response = await fetch('/api/shop/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity }),
      })

      if (response.ok) {
        const data = await response.json()
        setCartCount(data.totals?.itemCount || cartCount + quantity)
        // Redirecionar para checkout
        window.location.href = '/checkout'
      }
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error)
    } finally {
      setAddingToCart(false)
    }
  }

  // Calcular porcentagem de desconto
  const discountPercentage = product?.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0

  const productJsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.shortDescription || product.description,
        image: product.images?.[0],
        sku: product.id,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'BRL',
          price: product.price,
          availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        },
        aggregateRating: product.reviewCount
          ? {
              '@type': 'AggregateRating',
              ratingValue: product.avgRating,
              reviewCount: product.reviewCount,
            }
          : undefined,
      }
    : null

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-white to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-300 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground">Carregando produto...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-white to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-foreground mb-4">Produto não encontrado</p>
          <Link href="/shop" className="text-primary hover:underline">
            Voltar para a loja
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-white to-white pb-24">
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productJsonLd),
          }}
        />
      )}
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/shop" className="flex items-center gap-2 text-sm">
            <ChevronLeft className="w-4 h-4" />
            <span className="font-semibold text-foreground">Voltar para Loja</span>
          </Link>
          <h1 className="font-display font-bold text-lg text-foreground">Detalhes do Produto</h1>
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
        {/* Breadcrumb */}
        <nav className="text-sm mb-6 text-muted-foreground">
          <Link href="/" className="hover:text-primary">Home</Link>
          {' / '}
          <Link href="/shop" className="hover:text-primary">Loja</Link>
          {' / '}
          <Link href={`/shop?category=${product.category.id}`} className="hover:text-primary">
            {product.category.name}
          </Link>
          {' / '}
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Galeria de Imagens */}
          <div>
            <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
              {product.images.length > 0 ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-[500px] object-cover"
                />
              ) : (
                <div className="w-full h-[500px] bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">Sem imagem</span>
                </div>
              )}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage((i) => (i === 0 ? product.images.length - 1 : i - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-md"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImage((i) => (i === product.images.length - 1 ? 0 : i + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-md"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index ? 'border-primary' : 'border-gray-200'
                    }`}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-20 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Informações do Produto */}
          <div>
            {/* Nome e Categoria */}
            <div className="mb-4">
              <p className="text-sm text-primary mb-2">{product.category.name}</p>
              <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-2">
                {product.name}
              </h1>
              {product.shortDescription && (
                <p className="text-muted-foreground">{product.shortDescription}</p>
              )}
            </div>

            {/* Avaliação */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(product.avgRating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="font-semibold">{product.avgRating}</span>
              <span className="text-muted-foreground">
                ({product.reviewCount} {product.reviewCount === 1 ? 'avaliação' : 'avaliações'})
              </span>
            </div>

            {/* Preço */}
            <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
              {product.compareAtPrice && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg text-muted-foreground line-through">
                    R$ {product.compareAtPrice.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                    -{discountPercentage}%
                  </span>
                </div>
              )}
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-display font-bold text-primary">
                  R$ {product.price.toFixed(2).replace('.', ',')}
                </span>
              </div>

              {/* Estoque */}
              <div className="flex items-center gap-2 mb-4 text-sm">
                {product.inStock ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600">
                      {product.stock} {product.stock === 1 ? 'unidade' : 'unidades'} em estoque
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-red-600">Produto indisponível</span>
                  </>
                )}
              </div>

              {/* Quantidade */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center border border-pink-200 rounded-lg">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-4 py-2 hover:bg-pink-50 transition-colors"
                    disabled={!product.inStock}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 font-semibold min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="px-4 py-2 hover:bg-pink-50 transition-colors"
                    disabled={!product.inStock}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Botões */}
              <div className="space-y-3">
                <button
                  onClick={addToCart}
                  disabled={!product.inStock || addingToCart}
                  className="w-full py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {addingToCart ? (
                    <span>Adicionando...</span>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      Adicionar ao Carrinho
                    </>
                  )}
                </button>
                <button
                  onClick={buyNow}
                  disabled={!product.inStock || addingToCart}
                  className="w-full py-4 border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {addingToCart ? (
                    <span>Processando...</span>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      Comprar Agora
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Benefícios */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-md p-4 text-center">
                <Truck className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-semibold">Frete Grátis</p>
                <p className="text-xs text-muted-foreground">Acima de R$ 300</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4 text-center">
                <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-semibold">Compra Segura</p>
                <p className="text-xs text-muted-foreground">Pagamento protegido</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4 text-center">
                <RefreshCw className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-semibold">7 Dias</p>
                <p className="text-xs text-muted-foreground">Troca garantida</p>
              </div>
            </div>
          </div>
        </div>

        {/* Descrição Completa */}
        <div className="mt-12 bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-display font-bold text-2xl mb-4">Descrição</h2>
          <div className="prose max-w-none text-muted-foreground whitespace-pre-line">
            {product.description}
          </div>
        </div>

        {/* Especificações */}
        {product.specs && Object.keys(product.specs).length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-md p-6">
            <h2 className="font-display font-bold text-2xl mb-4">Especificações Técnicas</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-semibold">{key}:</span>
                  <span className="text-muted-foreground">{String(value)}</span>
                </div>
              ))}
              {product.hairType && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-semibold">Tipo de Cabelo:</span>
                  <span className="text-muted-foreground capitalize">{product.hairType.toLowerCase()}</span>
                </div>
              )}
              {product.texture && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-semibold">Textura:</span>
                  <span className="text-muted-foreground capitalize">{product.texture.toLowerCase()}</span>
                </div>
              )}
              {product.color && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-semibold">Cor:</span>
                  <span className="text-muted-foreground">{product.color}</span>
                </div>
              )}
              {product.length && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-semibold">Comprimento:</span>
                  <span className="text-muted-foreground">{product.length} cm</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="font-semibold">Peso:</span>
                <span className="text-muted-foreground">{product.weight} kg</span>
              </div>
            </div>
          </div>
        )}

        {/* Avaliações */}
        {product.reviews.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-md p-6">
            <h2 className="font-display font-bold text-2xl mb-4">Avaliações</h2>
            <div className="space-y-6">
              {product.reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    {review.verified && (
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                        Compra verificada
                      </span>
                    )}
                  </div>
                  {review.title && <h4 className="font-semibold mb-1">{review.title}</h4>}
                  <p className="text-sm text-muted-foreground mb-2">{review.author}</p>
                  <p className="text-muted-foreground">{review.comment}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Produtos Relacionados */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display font-bold text-2xl mb-6">Produtos Relacionados</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.slice(0, 4).map((related) => (
                <Link
                  key={related.id}
                  href={`/shop/products/${related.slug}`}
                  className="bg-white rounded-2xl shadow-md overflow-hidden border border-pink-100 hover:border-pink-300 hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="relative h-48 overflow-hidden">
                    {related.images[0] && (
                      <img
                        src={related.images[0]}
                        alt={related.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2">{related.name}</h3>
                    <div className="font-bold text-primary">
                      R$ {related.price.toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
