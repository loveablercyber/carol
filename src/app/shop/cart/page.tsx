'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, Trash2, Plus, Minus, ChevronRight, CreditCard, Truck, Check, X } from 'lucide-react'

interface CartItem {
  id: string
  productId: string
  quantity: number
  product: {
    id: string
    name: string
    slug: string
    price: number
    images: string[]
    inStock: boolean
    stock: number
  }
}

interface Cart {
  id: string
  items: CartItem[]
}

interface Coupon {
  id: string
  code: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING'
  value: number
  minPurchase: number
  maxDiscount?: number | null
}

interface ShippingOption {
  code: string
  name: string
  price: number
  deliveryDays: number
  estimatedDelivery: string
}

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  // Estados para Cupom e Frete
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [couponError, setCouponError] = useState('')
  const [loadingCoupon, setLoadingCoupon] = useState(false)

  const [cep, setCep] = useState('')
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null)
  const [loadingShipping, setLoadingShipping] = useState(false)
  const [shippingError, setShippingError] = useState('')
  const [autoApplyCoupon, setAutoApplyCoupon] = useState(false)
  const [autoCalcShipping, setAutoCalcShipping] = useState(false)
  const [prefillShippingCode, setPrefillShippingCode] = useState<string | null>(null)

  const subtotal = cart?.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  ) || 0

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0

  // Cálculo do Desconto
  const discount = appliedCoupon ? calculateDiscount(subtotal, appliedCoupon) : 0

  // Regra de Frete Grátis
  const isFreeShipping = subtotal >= 300

  // Total Final
  const shippingCost = selectedShipping ? (isFreeShipping ? 0 : selectedShipping.price) : 0
  const total = Math.max(0, subtotal - discount + shippingCost)

  function calculateDiscount(subtotal: number, coupon: Coupon): number {
    if (subtotal < coupon.minPurchase) return 0

    let discountAmount = 0
    if (coupon.type === 'PERCENTAGE') {
      discountAmount = subtotal * (coupon.value / 100)
    } else if (coupon.type === 'FIXED_AMOUNT') {
      discountAmount = coupon.value
    } else if (coupon.type === 'FREE_SHIPPING') {
      // Logic for free shipping usually sets shipping to 0, handled separately or here?
      // For simplicity, if free shipping, we might just discount the shipping cost if known,
      // but here we are calculating discount on subtotal.
      // Usually Free Shipping coupon affects shipping cost, not subtotal discount.
      // We will handle FREE_SHIPPING in shipping cost calculation or let it be 0 discount on subtotal.
      return 0
    }

    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount
    }

    return discountAmount
  }

  // Buscar carrinho
  const fetchCart = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/shop/cart')
      const data = await response.json()
      setCart(data.cart)
    } catch (error) {
      console.error('Erro ao buscar carrinho:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCart()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const storedCoupon = localStorage.getItem('checkout_coupon')
      if (storedCoupon) {
        const parsed = JSON.parse(storedCoupon)
        if (parsed?.code) {
          setCouponCode(parsed.code)
          setAutoApplyCoupon(true)
        }
      }
    } catch (error) {
      console.warn('Erro ao ler cupom salvo:', error)
    }

    try {
      const storedShipping = localStorage.getItem('checkout_shipping')
      if (storedShipping) {
        const parsed = JSON.parse(storedShipping)
        if (parsed?.zipCode) {
          setCep(parsed.zipCode.replace(/^(\d{5})(\d)/, '$1-$2'))
          setPrefillShippingCode(parsed?.option?.code || null)
          setAutoCalcShipping(true)
        }
      }
    } catch (error) {
      console.warn('Erro ao ler frete salvo:', error)
    }
  }, [])

  useEffect(() => {
    if (autoApplyCoupon && couponCode && cart) {
      applyCoupon()
      setAutoApplyCoupon(false)
    }
  }, [autoApplyCoupon, couponCode, cart])

  useEffect(() => {
    const cleanCep = cep.replace(/\D/g, '')
    if (autoCalcShipping && cleanCep.length === 8) {
      calculateShipping(prefillShippingCode || undefined)
      setAutoCalcShipping(false)
    }
  }, [autoCalcShipping, cep, prefillShippingCode])

  // Atualizar quantidade
  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    setUpdating(true)
    try {
      await fetch(`/api/shop/cart`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity: newQuantity }),
      })

      await fetchCart()
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error)
    } finally {
      setUpdating(false)
    }
  }

  // Remover item
  const removeItem = async (itemId: string) => {
    setUpdating(true)
    try {
      await fetch(`/api/shop/cart`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      })

      await fetchCart()
    } catch (error) {
      console.error('Erro ao remover item:', error)
    } finally {
      setUpdating(false)
    }
  }

  // Aplicar Cupom
  const applyCoupon = async () => {
    if (!couponCode) return
    setLoadingCoupon(true)
    setCouponError('')
    setAppliedCoupon(null)

    try {
      const response = await fetch(`/api/shop/coupons/${couponCode}`)
      const data = await response.json()

      if (response.ok) {
        setAppliedCoupon(data.coupon)
        if (typeof window !== 'undefined') {
          localStorage.setItem('checkout_coupon', JSON.stringify({ code: data.coupon.code }))
        }
        // Se for frete grátis, zera o frete selecionado se houver (mas a lógica de frete correios é separada)
      } else {
        setCouponError(data.error || 'Cupom inválido')
      }
    } catch (error) {
      setCouponError('Erro ao validar cupom')
    } finally {
      setLoadingCoupon(false)
    }
  }

  // Calcular Frete
  const calculateShipping = async (preferredCode?: string) => {
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length !== 8) {
      setShippingError('CEP inválido')
      return
    }

    setLoadingShipping(true)
    setShippingError('')
    setShippingOptions([])
    setSelectedShipping(null)

    try {
      const response = await fetch('/api/shop/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: cleanCep }),
      })
      const data = await response.json()

      if (response.ok) {
        setShippingOptions(data.shippingOptions)
        if (data.shippingOptions.length > 0) {
          const preferred = preferredCode
            ? data.shippingOptions.find((option: ShippingOption) => option.code === preferredCode)
            : null
          const nextSelection = preferred || data.shippingOptions[0]
          setSelectedShipping(nextSelection)
          if (typeof window !== 'undefined' && nextSelection) {
            localStorage.setItem(
              'checkout_shipping',
              JSON.stringify({ zipCode: cleanCep, option: nextSelection })
            )
          }
        }
      } else {
        setShippingError(data.error || 'Erro ao calcular frete')
      }
    } catch (error) {
      setShippingError('Erro ao calcular frete')
    } finally {
      setLoadingShipping(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-white to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-300 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground">Carregando carrinho...</p>
        </div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-white to-white pb-24">
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/shop" className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Voltar</span>
            </Link>
            <h1 className="font-display font-bold text-xl text-foreground">Carrinho</h1>
            <div className="w-8" />
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h2 className="font-display font-bold text-2xl text-foreground mb-4">
            Seu carrinho está vazio
          </h2>
          <p className="text-muted-foreground mb-8">
            Adicione produtos ao carrinho para continuar
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Ir para Loja
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-white to-white pb-24">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/shop" className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Voltar</span>
          </Link>
          <h1 className="font-display font-bold text-xl text-foreground">Carrinho ({itemCount})</h1>
          <div className="w-8" />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de Itens */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 border-b border-gray-100 last:border-0"
                >
                  {/* Imagem */}
                  <Link
                    href={`/shop/products/${item.product.slug}`}
                    className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden"
                  >
                    {item.product.images[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        Sem imagem
                      </div>
                    )}
                  </Link>

                  {/* Informações */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/shop/products/${item.product.slug}`}
                      className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 mb-1"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.product.inStock ? 'Em estoque' : 'Indisponível'}
                    </p>
                    <p className="font-bold text-primary mb-2">
                      R$ {item.product.price.toFixed(2).replace('.', ',')}
                    </p>

                    {/* Controles de Quantidade */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-pink-200 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={updating || item.quantity <= 1}
                          className="px-3 py-1 hover:bg-pink-50 transition-colors disabled:opacity-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-4 py-1 font-semibold min-w-[50px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={updating || item.quantity >= item.product.stock}
                          className="px-3 py-1 hover:bg-pink-50 transition-colors disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={updating}
                        className="text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remover
                      </button>
                    </div>
                  </div>

                  {/* Total do Item */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-lg">
                      R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Continuar Comprando */}
            <div className="mt-6">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Continuar comprando
              </Link>
            </div>
          </div>

          {/* Resumo e Checkout */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-6 sticky top-24">
              <h2 className="font-display font-bold text-xl mb-6">Resumo do Pedido</h2>

              {/* Cupom de Desconto */}
              <div className="mb-6">
                <label className="text-sm font-semibold mb-2 block">Cupom de Desconto</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Digite o código"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={!!appliedCoupon}
                    className="flex-1 px-4 py-2 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400 disabled:bg-gray-100"
                  />
                  {appliedCoupon ? (
                    <button
                      onClick={() => {
                        setAppliedCoupon(null)
                        setCouponCode('')
                        if (typeof window !== 'undefined') {
                          localStorage.removeItem('checkout_coupon')
                        }
                      }}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-semibold hover:bg-red-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={applyCoupon}
                      disabled={loadingCoupon || !couponCode}
                      className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {loadingCoupon ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Aplicar'}
                    </button>
                  )}
                </div>
                {couponError && <p className="text-red-500 text-sm mt-1">{couponError}</p>}
                {appliedCoupon && (
                  <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Cupom aplicado com sucesso!
                  </p>
                )}
              </div>

              {/* Cálculo de Frete */}
              <div className="mb-6">
                <label className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Calcular Frete
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="CEP"
                    maxLength={9}
                    value={cep}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '')
                      if (val.length <= 8) setCep(val.replace(/^(\d{5})(\d)/, '$1-$2'))
                    }}
                    className="flex-1 px-4 py-2 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                  />
                  <button
                    onClick={calculateShipping}
                    disabled={loadingShipping || cep.replace(/\D/g, '').length !== 8}
                    className="px-4 py-2 bg-gray-100 text-foreground rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {loadingShipping ? <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" /> : 'OK'}
                  </button>
                </div>
                {shippingError && <p className="text-red-500 text-sm mt-1">{shippingError}</p>}
                
                {shippingOptions.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {shippingOptions.map((option) => (
                      <div
                        key={option.code}
                        onClick={() => {
                          setSelectedShipping(option)
                          const cleanCep = cep.replace(/\D/g, '')
                          if (cleanCep.length === 8 && typeof window !== 'undefined') {
                            localStorage.setItem(
                              'checkout_shipping',
                              JSON.stringify({ zipCode: cleanCep, option })
                            )
                          }
                        }}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedShipping?.code === option.code
                            ? 'border-primary bg-pink-50'
                            : 'border-gray-200 hover:border-pink-200'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-sm">{option.name}</p>
                          <p className="text-xs text-muted-foreground">{option.estimatedDelivery}</p>
                        </div>
                        <p className="font-bold text-sm">
                          {option.price === 0 || isFreeShipping || (appliedCoupon?.type === 'FREE_SHIPPING') ? 'Grátis' : `R$ ${option.price.toFixed(2).replace('.', ',')}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resumo de Valores */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'itens'})</span>
                  <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto</span>
                    <span>- R$ {discount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Frete</span>
                  <span>
                    {isFreeShipping || appliedCoupon?.type === 'FREE_SHIPPING' 
                      ? <span className="text-green-600">Grátis</span>
                      : selectedShipping 
                        ? `R$ ${selectedShipping.price.toFixed(2).replace('.', ',')}`
                        : 'Calculado no checkout'}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">
                      R$ {(isFreeShipping || appliedCoupon?.type === 'FREE_SHIPPING' ? Math.max(0, subtotal - discount) : total).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botão de Checkout */}
              <Link
                href="/checkout"
                className="mt-6 w-full py-4 bg-gradient-to-r from-[#F8B6D8] to-[#E91E63] text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Finalizar Compra
              </Link>

              <div className="mt-4 text-center text-sm text-muted-foreground">
                <span>Já tem conta?</span>{' '}
                <Link href="/login" className="text-primary font-semibold hover:underline">
                  Entrar
                </Link>
                <span className="mx-2">•</span>
                <Link href="/register" className="text-primary font-semibold hover:underline">
                  Criar conta
                </Link>
              </div>

              {/* Informações Adicionais */}
              <div className="mt-6 space-y-2 text-xs text-muted-foreground">
                <p>✓ Frete grátis para compras acima de R$ 300</p>
                <p>✓ Parcelamento em até 12x</p>
                <p>✓ Pagamento seguro via Mercado Pago</p>
                <p>✓ 7 dias para troca</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
