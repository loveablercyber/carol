'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ShoppingBag, MapPin, CreditCard, QrCode, ArrowLeft, Truck, Lock, CheckCircle } from 'lucide-react'
import { AuthProvider } from '@/components/providers/AuthProvider'

interface ShippingAddress {
  recipient: string
  zipCode: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
}

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
  }
}

export default function CheckoutPage() {
  return (
    <AuthProvider>
      <CheckoutContent />
    </AuthProvider>
  )
}

function CheckoutContent() {
  const router = useRouter()
  const { data: session } = useSession()

  const [cart, setCart] = useState<{ items: CartItem[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    recipient: '',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  })

  const [shippingOptions, setShippingOptions] = useState<any[]>([])
  const [selectedShipping, setSelectedShipping] = useState<any>(null)
  const [calculatingShipping, setCalculatingShipping] = useState(false)

  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState<any>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [showCouponForm, setShowCouponForm] = useState(false)
  const [showShippingOptions, setShowShippingOptions] = useState(false)
  const [showCepField, setShowCepField] = useState(false)
  const [prefillCoupon, setPrefillCoupon] = useState(false)
  const [prefillShippingCode, setPrefillShippingCode] = useState<string | null>(null)

  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardHolderName, setCardHolderName] = useState('')
  const [cardInstallments, setCardInstallments] = useState(1)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [orderCreated, setOrderCreated] = useState(false)
  const [pixCode, setPixCode] = useState('')
  const [pixQrImage, setPixQrImage] = useState('')

  // Buscar carrinho
  useEffect(() => {
    const fetchCart = async () => {
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

    fetchCart()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const storedCoupon = localStorage.getItem('checkout_coupon')
      if (storedCoupon) {
        const parsed = JSON.parse(storedCoupon)
        if (parsed?.code) {
          setCouponCode(parsed.code.toUpperCase())
          setPrefillCoupon(true)
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
          setShippingAddress((prev) => ({ ...prev, zipCode: parsed.zipCode }))
          setPrefillShippingCode(parsed?.option?.code || null)
        }
      }
    } catch (error) {
      console.warn('Erro ao ler frete salvo:', error)
    }
  }, [])

  // Se não houver itens no carrinho, redirecionar
  useEffect(() => {
    if (!loading && (!cart || cart.items.length === 0)) {
      router.push('/shop')
    }
  }, [cart, loading, router])

  useEffect(() => {
    if (prefillCoupon && couponCode && cart && !coupon) {
      validateCoupon(couponCode)
      setPrefillCoupon(false)
    }
  }, [prefillCoupon, couponCode, cart, coupon])

  useEffect(() => {
    if (!cart) return
    if (shippingAddress.zipCode.length === 8) {
      calculateShipping(shippingAddress.zipCode, prefillShippingCode || undefined)
    }
  }, [cart, shippingAddress.zipCode, prefillShippingCode])

  // Calcular totais
  const subtotal = cart?.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0) || 0
  const discount = coupon ? (coupon.type === 'PERCENTAGE' ? subtotal * (coupon.value / 100) : coupon.value) : 0
  const shippingCost = selectedShipping?.price || 0
  const total = subtotal - discount + shippingCost
  const formattedZip = shippingAddress.zipCode
    ? shippingAddress.zipCode.replace(/^(\d{5})(\d)/, '$1-$2')
    : ''
  const shouldShowShippingOptions = showShippingOptions || !selectedShipping

  // Buscar frete
  const calculateShipping = async (cep: string, preferredCode?: string) => {
    if (cep.length !== 8) return

    setCalculatingShipping(true)
    setErrors({})

    try {
      const totalWeight = cart!.items.reduce((sum, item) => {
        // Calcular peso aproximado
        return sum + (item.quantity * 0.5)
      }, 0)

      const response = await fetch('/api/shop/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zipCode: cep,
          weight: totalWeight,
          dimensions: { width: 15, height: 10, length: 20 },
        }),
      })

      const data = await response.json()
      const options = data.shippingOptions || []
      setShippingOptions(options)
      let nextSelection = options[0] || null
      if (preferredCode) {
        const match = options.find((option: any) => option.code === preferredCode)
        if (match) nextSelection = match
      }
      setSelectedShipping(nextSelection)
      if (nextSelection && typeof window !== 'undefined') {
        localStorage.setItem('checkout_shipping', JSON.stringify({ zipCode: cep, option: nextSelection }))
      }
    } catch (error) {
      console.error('Erro ao calcular frete:', error)
      setErrors({ shipping: 'Erro ao calcular frete. Tente novamente.' })
    } finally {
      setCalculatingShipping(false)
    }
  }

  // Validar cupom
  const validateCoupon = async (codeOverride?: string) => {
    const code = (codeOverride || couponCode).trim().toUpperCase()
    if (!code) return

    setValidatingCoupon(true)
    setErrors({})

    try {
      const response = await fetch(`/api/shop/coupons/${code}`)
      const data = await response.json()

      if (data.coupon) {
        if (subtotal < data.coupon.minPurchase) {
          setErrors({
            coupon: `Compra mínima de R$ ${data.coupon.minPurchase.toFixed(2).replace('.', ',')}`,
          })
        } else {
          setCoupon(data.coupon)
          setCouponCode(code)
          setShowCouponForm(false)
          if (typeof window !== 'undefined') {
            localStorage.setItem('checkout_coupon', JSON.stringify({ code }))
          }
        }
      } else {
        setErrors({ coupon: 'Cupom inválido' })
      }
    } catch (error) {
      setErrors({ coupon: 'Erro ao validar cupom' })
    } finally {
      setValidatingCoupon(false)
    }
  }

  // Criar pedido
  const createOrder = async () => {
    // Validações
    const newErrors: Record<string, string> = {}

    if (!shippingAddress.recipient) newErrors.recipient = 'Nome é obrigatório'
    if (!shippingAddress.zipCode) newErrors.zipCode = 'CEP é obrigatório'
    if (!shippingAddress.street) newErrors.street = 'Rua é obrigatória'
    if (!shippingAddress.number) newErrors.number = 'Número é obrigatório'
    if (!shippingAddress.neighborhood) newErrors.neighborhood = 'Bairro é obrigatório'
    if (!shippingAddress.city) newErrors.city = 'Cidade é obrigatória'
    if (!shippingAddress.state) newErrors.state = 'Estado é obrigatório'
    if (!selectedShipping) newErrors.shipping = 'Selecione uma opção de frete'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setProcessing(true)
    setErrors({})

    try {
      const response = await fetch('/api/shop/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: shippingAddress.recipient,
          customerEmail: session?.user?.email || shippingAddress.recipient.toLowerCase().replace(/\s/g, '.') + '@email.com',
          customerPhone: '(11) 99999-9999',
          shippingAddress: {
            ...shippingAddress,
            cost: selectedShipping.price,
            method: selectedShipping.code,
          },
          paymentMethod: paymentMethod === 'PIX' ? 'MERCADO_PAGO_PIX' : 'MERCADO_PAGO_CREDIT_CARD',
          couponCode: coupon?.code,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setOrderCreated(true)
        if (paymentMethod === 'PIX') {
          try {
            const paymentResponse = await fetch('/api/payments/mercadopago', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: data.order.id,
                amount: data.order.total,
                description: `Pedido ${data.order.orderNumber}`,
                payerEmail:
                  session?.user?.email ||
                  shippingAddress.recipient.toLowerCase().replace(/\\s/g, '.') + '@email.com',
              }),
            })

            if (paymentResponse.ok) {
              const paymentData = await paymentResponse.json()
              if (paymentData.qrCode) {
                setPixCode(paymentData.qrCode)
              }
              if (paymentData.qrCodeBase64) {
                setPixQrImage(`data:image/png;base64,${paymentData.qrCodeBase64}`)
              }
            } else {
              setPixCode(
                `00020126360014BR.GOV.BCB.PIX0114+${data.order.orderNumber}52040000530398654049`
              )
            }
          } catch (error) {
            setPixCode(
              `00020126360014BR.GOV.BCB.PIX0114+${data.order.orderNumber}52040000530398654049`
            )
          }
        } else {
          // Para cartão de crédito, simular aprovação
          setTimeout(() => {
            router.push(`/account/orders/${data.order.orderNumber}`)
          }, 2000)
        }
      } else {
        setErrors({ submit: data.error || 'Erro ao criar pedido' })
      }
    } catch (error) {
      setErrors({ submit: 'Erro ao processar pedido. Tente novamente.' })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-white to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-300 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (orderCreated && paymentMethod === 'PIX') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-white to-white flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="font-display font-bold text-2xl text-foreground mb-2">
            Pedido Criado com Sucesso!
          </h1>
          <p className="text-muted-foreground mb-6">
            Escaneie o QR Code abaixo para pagar via Pix
          </p>

          <div className="bg-gray-100 p-4 rounded-xl mb-6">
            {pixQrImage ? (
              <img src={pixQrImage} alt="QR Code Pix" className="w-48 h-48 mx-auto" />
            ) : (
              <QrCode className="w-48 h-48 mx-auto text-foreground" />
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-2">
            Ou copie o código Pix:
          </p>
          <code className="block bg-gray-100 p-3 rounded-lg text-xs mb-6 break-all">
            {pixCode}
          </code>

          <button
            onClick={() => router.push('/account')}
            className="w-full py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Ir para Meus Pedidos
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-white to-white pb-20">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/shop" className="flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold text-foreground">Voltar</span>
          </Link>
          <h1 className="font-display font-bold text-xl text-foreground">Checkout</h1>
          <Link href="/shop/cart" className="relative">
            <ShoppingBag className="w-6 h-6 text-foreground" />
            {cart && cart.items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cart.items.length}
              </span>
            )}
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda - Formulários */}
          <div className="lg:col-span-2 space-y-6">
            {/* Identificação */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-primary" />
                Identificação
              </h2>
              {session?.user ? (
                <div className="text-sm text-muted-foreground">
                  <p>
                    Você está logada como <span className="font-semibold text-foreground">{session.user.email}</span>
                  </p>
                  <div className="mt-3">
                    <Link href="/account" className="text-primary font-semibold hover:underline">
                      Acessar minha conta
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Você pode finalizar como convidada ou entrar para acompanhar pedidos.</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/login"
                      className="px-4 py-3 rounded-xl border border-pink-200 text-foreground font-semibold text-center hover:border-pink-300"
                    >
                      Entrar
                    </Link>
                    <Link
                      href="/register"
                      className="px-4 py-3 rounded-xl bg-primary text-white font-semibold text-center hover:bg-primary/90"
                    >
                      Criar conta
                    </Link>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Compra como convidada é possível e rápida. Seus dados serão usados apenas para o pedido.
                  </p>
                </div>
              )}
            </div>

            {/* Endereço de Entrega */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-primary" />
                Endereço de Entrega
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.recipient}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, recipient: e.target.value })}
                    className={`w-full px-4 py-3 border ${errors.recipient ? 'border-red-500' : 'border-pink-200'} rounded-lg focus:outline-none focus:border-pink-400`}
                    placeholder="Seu nome completo"
                  />
                  {errors.recipient && <p className="text-red-500 text-xs mt-1">{errors.recipient}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">CEP *</label>
                  {shippingAddress.zipCode.length === 8 && !showCepField ? (
                    <div className="flex items-center justify-between px-4 py-3 border border-pink-200 rounded-lg bg-pink-50">
                      <span className="text-sm font-semibold">{formattedZip}</span>
                      <button
                        type="button"
                        onClick={() => setShowCepField(true)}
                        className="text-xs font-semibold text-primary"
                      >
                        Alterar
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        maxLength={8}
                        value={shippingAddress.zipCode}
                        onChange={(e) => {
                          const cep = e.target.value.replace(/\D/g, '')
                          setShippingAddress({ ...shippingAddress, zipCode: cep })
                          if (cep.length === 8) {
                            calculateShipping(cep)
                            setShowShippingOptions(true)
                            setShowCepField(false)
                          }
                        }}
                        className={`flex-1 px-4 py-3 border ${errors.zipCode ? 'border-red-500' : 'border-pink-200'} rounded-lg focus:outline-none focus:border-pink-400`}
                        placeholder="00000000"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (shippingAddress.zipCode.length === 8) {
                            calculateShipping(shippingAddress.zipCode)
                            setShowShippingOptions(true)
                            setShowCepField(false)
                          }
                        }}
                        disabled={calculatingShipping}
                        className="px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        {calculatingShipping ? '...' : 'OK'}
                      </button>
                    </div>
                  )}
                  {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Rua *</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                    className={`w-full px-4 py-3 border ${errors.street ? 'border-red-500' : 'border-pink-200'} rounded-lg focus:outline-none focus:border-pink-400`}
                    placeholder="Nome da rua"
                  />
                  {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Número *</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.number}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, number: e.target.value })}
                    className={`w-full px-4 py-3 border ${errors.number ? 'border-red-500' : 'border-pink-200'} rounded-lg focus:outline-none focus:border-pink-400`}
                    placeholder="123"
                  />
                  {errors.number && <p className="text-red-500 text-xs mt-1">{errors.number}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Complemento</label>
                  <input
                    type="text"
                    value={shippingAddress.complement || ''}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, complement: e.target.value })}
                    className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                    placeholder="Apto, Bloco..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Bairro *</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.neighborhood}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, neighborhood: e.target.value })}
                    className={`w-full px-4 py-3 border ${errors.neighborhood ? 'border-red-500' : 'border-pink-200'} rounded-lg focus:outline-none focus:border-pink-400`}
                    placeholder="Bairro"
                  />
                  {errors.neighborhood && <p className="text-red-500 text-xs mt-1">{errors.neighborhood}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Cidade *</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    className={`w-full px-4 py-3 border ${errors.city ? 'border-red-500' : 'border-pink-200'} rounded-lg focus:outline-none focus:border-pink-400`}
                    placeholder="Cidade"
                  />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Estado *</label>
                  <select
                    required
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                    className={`w-full px-4 py-3 border ${errors.state ? 'border-red-500' : 'border-pink-200'} rounded-lg focus:outline-none focus:border-pink-400`}
                  >
                    <option value="">Selecione</option>
                    <option value="SP">São Paulo</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="PR">Paraná</option>
                    <option value="BA">Bahia</option>
                    <option value="PE">Pernambuco</option>
                    <option value="CE">Ceará</option>
                    <option value="DF">Distrito Federal</option>
                  </select>
                  {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                </div>
              </div>
            </div>

            {/* Opções de Frete */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
                <Truck className="w-6 h-6 text-primary" />
                Opções de Frete
              </h2>

              {selectedShipping && !shouldShowShippingOptions ? (
                <div className="flex items-center justify-between p-4 border-2 rounded-lg border-pink-200 bg-pink-50">
                  <div>
                    <p className="font-semibold">{selectedShipping.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedShipping.estimatedDelivery}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      R$ {selectedShipping.price.toFixed(2).replace('.', ',')}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowShippingOptions(true)}
                      className="text-xs font-semibold text-primary mt-1"
                    >
                      Alterar frete
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {shippingOptions.length === 0 && !calculatingShipping && (
                    <p className="text-sm text-muted-foreground">
                      Informe um CEP para ver as opções de frete.
                    </p>
                  )}
                  {shippingOptions.map((option, index) => (
                    <label
                      key={index}
                      className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedShipping?.code === option.code
                          ? 'border-primary bg-primary/5'
                          : 'border-pink-100 hover:border-pink-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          checked={selectedShipping?.code === option.code}
                          onChange={() => {
                            setSelectedShipping(option)
                            setShowShippingOptions(false)
                            if (typeof window !== 'undefined') {
                              localStorage.setItem(
                                'checkout_shipping',
                                JSON.stringify({ zipCode: shippingAddress.zipCode, option })
                              )
                            }
                          }}
                          className="text-primary"
                        />
                        <div>
                          <p className="font-semibold">{option.name}</p>
                          <p className="text-sm text-muted-foreground">{option.estimatedDelivery}</p>
                        </div>
                      </div>
                      <p className="font-bold text-lg">
                        R$ {option.price.toFixed(2).replace('.', ',')}
                      </p>
                    </label>
                  ))}
                </div>
              )}
              {errors.shipping && <p className="text-red-500 text-sm mt-2">{errors.shipping}</p>}
            </div>

            {/* Pagamento */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-primary" />
                Pagamento
              </h2>

              {/* Método de Pagamento */}
              <div className="flex gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('PIX')}
                  className={`flex-1 py-4 border-2 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    paymentMethod === 'PIX'
                      ? 'border-primary bg-primary text-white'
                      : 'border-pink-200 hover:border-pink-300'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  Pix
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CREDIT_CARD')}
                  className={`flex-1 py-4 border-2 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    paymentMethod === 'CREDIT_CARD'
                      ? 'border-primary bg-primary text-white'
                      : 'border-pink-200 hover:border-pink-300'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  Cartão
                </button>
              </div>

              {paymentMethod === 'CREDIT_CARD' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Número do Cartão *</label>
                    <input
                      type="text"
                      required
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())}
                      placeholder="0000 0000 0000 0000"
                      className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Validade *</label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').replace(/(.{2})/, '$1/')
                          setCardExpiry(value)
                        }}
                        placeholder="MM/AA"
                        className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">CVV *</label>
                      <input
                        type="text"
                        required
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        placeholder="000"
                        className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Nome no Cartão *</label>
                    <input
                      type="text"
                      required
                      value={cardHolderName}
                      onChange={(e) => setCardHolderName(e.target.value.toUpperCase())}
                      placeholder="NOME COMO ESTÁ NO CARTÃO"
                      className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Parcelas</label>
                    <select
                      value={cardInstallments}
                      onChange={(e) => setCardInstallments(parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                    >
                      {[1, 2, 3, 6, 12].map((inst) => (
                        <option key={inst} value={inst}>
                          {inst}x {inst === 1 ? 'sem juros' : 'com juros'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <span>Pagamento 100% seguro via Mercado Pago</span>
                  </div>
                </div>
              )}

              {paymentMethod === 'PIX' && (
                <div className="text-center py-6">
                  <QrCode className="w-16 h-16 mx-auto text-primary mb-4" />
                  <p className="text-muted-foreground">
                    Após confirmar o pedido, você receberá um QR Code para pagamento via Pix
                  </p>
                </div>
              )}

              <button
                onClick={createOrder}
                disabled={processing || !selectedShipping}
                className="w-full py-4 bg-gradient-to-r from-[#F8B6D8] to-[#E91E63] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? 'Processando...' : 'Confirmar Pedido'}
              </button>
              {errors.submit && <p className="text-red-500 text-sm mt-2 text-center">{errors.submit}</p>}
            </div>
          </div>

          {/* Coluna Direita - Resumo */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-6 sticky top-24">
              <h2 className="font-display font-bold text-xl mb-6">Resumo do Pedido</h2>

              {/* Itens */}
              <div className="mb-6 max-h-64 overflow-y-auto">
                {cart?.items.map((item) => (
                  <div key={item.id} className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product.images[0] && (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm line-clamp-2">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-primary">
                      R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                ))}
              </div>

              {/* Cupom */}
              <div className="mb-6">
                <label className="text-sm font-semibold mb-2">Cupom de Desconto</label>
                {coupon ? (
                  <div className="flex items-center justify-between p-3 border border-pink-200 rounded-lg bg-pink-50">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Cupom aplicado: {coupon.code}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Desconto de {coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : `R$ ${coupon.value}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCoupon(null)
                        setCouponCode('')
                        setShowCouponForm(false)
                        if (typeof window !== 'undefined') {
                          localStorage.removeItem('checkout_coupon')
                        }
                      }}
                      className="text-xs font-semibold text-red-600"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Nenhum cupom aplicado.</p>
                )}

                <button
                  type="button"
                  onClick={() => setShowCouponForm((prev) => !prev)}
                  className="text-xs font-semibold text-primary mt-2"
                >
                  {coupon ? 'Trocar cupom' : 'Adicionar cupom'}
                </button>

                {showCouponForm && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && validateCoupon()}
                      className="flex-1 px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400 uppercase"
                      placeholder="Digite o código"
                    />
                    <button
                      onClick={() => validateCoupon()}
                      disabled={validatingCoupon}
                      className="px-6 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 font-semibold"
                    >
                      {validatingCoupon ? '...' : 'Aplicar'}
                    </button>
                  </div>
                )}

                {errors.coupon && <p className="text-red-500 text-xs mt-1">{errors.coupon}</p>}
              </div>

              {/* Totais */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto</span>
                    <span>- R$ {discount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frete</span>
                  <span>{selectedShipping ? `R$ ${shippingCost.toFixed(2).replace('.', ',')}` : 'Calculando...'}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-primary">R$ {total.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              </div>

              {/* Informações */}
              <div className="mt-6 space-y-2 text-xs text-muted-foreground">
                <p>✓ Frete grátis para compras acima de R$ 300</p>
                <p>✓ Parcelamento em até 12x no cartão</p>
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
