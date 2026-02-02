'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import Link from 'next/link'
import { ShoppingBag, MapPin, CreditCard, QrCode, ArrowLeft, Truck, Lock, CheckCircle } from 'lucide-react'
import { AuthProvider } from '@/components/providers/AuthProvider'

interface ShippingAddress {
  recipient: string
  phone?: string
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
  const { data: session, status } = useSession()
  const isTestMode =
    (process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || '').startsWith('TEST-')

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const [registerForm, setRegisterForm] = useState({
    name: '',
    phone: '',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    cpf: '',
    email: '',
    password: '',
  })
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState('')

  const [cart, setCart] = useState<{ items: CartItem[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [createdOrder, setCreatedOrder] = useState<{ id: string; orderNumber: string; total: number } | null>(null)

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    recipient: '',
    phone: '',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  })

  const [addresses, setAddresses] = useState<any[]>([])
  const [selectedAddress, setSelectedAddress] = useState<any>(null)
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [addressesLoading, setAddressesLoading] = useState(false)
  const [customerCpf, setCustomerCpf] = useState('')

  const [shippingOptions, setShippingOptions] = useState<any[]>([])
  const [selectedShipping, setSelectedShipping] = useState<any>(null)
  const [calculatingShipping, setCalculatingShipping] = useState(false)

  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState<any>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [showCouponForm, setShowCouponForm] = useState(false)
  const [showShippingOptions, setShowShippingOptions] = useState(false)
  const [prefillCoupon, setPrefillCoupon] = useState(false)

  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX')
  const cardFormRef = useRef<any>(null)
  const cardFormDataRef = useRef<any>(null)
  const cardFormSubmitResolverRef = useRef<((data: any) => void) | null>(null)
  const [cardFormReady, setCardFormReady] = useState(false)
  const [cardFormError, setCardFormError] = useState('')

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
    const fetchProfile = async () => {
      if (!session?.user) return
      try {
        const response = await fetch('/api/account/profile')
        if (!response.ok) return
        const data = await response.json()
        setCustomerCpf(data.user?.cpf || '')
      } catch (error) {
        console.error('Erro ao buscar perfil:', error)
      }
    }

    const fetchAddresses = async () => {
      if (!session?.user) return
      setAddressesLoading(true)
      try {
        const response = await fetch('/api/account/addresses')
        if (!response.ok) return
        const data = await response.json()
        const list = data.addresses || []
        setAddresses(list)
        if (list.length > 0) {
          const defaultAddress = list.find((addr: any) => addr.isDefault) || list[0]
          setSelectedAddress(defaultAddress)
          setShippingAddress({
            recipient: defaultAddress.recipient || '',
            phone: defaultAddress.phone || '',
            zipCode: defaultAddress.zipCode || '',
            street: defaultAddress.street || '',
            number: defaultAddress.number || '',
            complement: defaultAddress.complement || '',
            neighborhood: defaultAddress.neighborhood || '',
            city: defaultAddress.city || '',
            state: defaultAddress.state || '',
          })
          setIsEditingAddress(false)
        } else {
          setSelectedAddress(null)
          setShippingAddress({
            recipient: '',
            phone: '',
            zipCode: '',
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
          })
        }
      } catch (error) {
        console.error('Erro ao buscar enderecos:', error)
      } finally {
        setAddressesLoading(false)
      }
    }

    fetchProfile()
    fetchAddresses()
  }, [session])

  

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoginLoading(true)
    setLoginError('')

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: loginForm.email,
        password: loginForm.password,
      })

      if (result?.error) {
        setLoginError('Email ou senha incorretos')
      } else {
        router.refresh()
      }
    } catch (error) {
      setLoginError('Erro ao fazer login. Tente novamente.')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleSaveAddress = async () => {
    const newErrors: Record<string, string> = {}
    if (!shippingAddress.recipient) newErrors.recipient = 'Nome é obrigatório'
    if (!shippingAddress.phone) newErrors.phone = 'Telefone é obrigatório'
    if (!shippingAddress.zipCode) newErrors.zipCode = 'CEP é obrigatório'
    if (!shippingAddress.street) newErrors.street = 'Rua é obrigatória'
    if (!shippingAddress.number) newErrors.number = 'Número é obrigatório'
    if (!shippingAddress.neighborhood) newErrors.neighborhood = 'Bairro é obrigatório'
    if (!shippingAddress.city) newErrors.city = 'Cidade é obrigatória'
    if (!shippingAddress.state) newErrors.state = 'Estado é obrigatório'

    if (Object.keys(newErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...newErrors }))
      return
    }

    try {
      const payload = {
        recipient: shippingAddress.recipient,
        phone: shippingAddress.phone,
        zipCode: shippingAddress.zipCode,
        street: shippingAddress.street,
        number: shippingAddress.number,
        complement: shippingAddress.complement,
        neighborhood: shippingAddress.neighborhood,
        city: shippingAddress.city,
        state: shippingAddress.state,
        isDefault: true,
      }

      const response = await fetch(
        selectedAddress ? `/api/account/addresses/${selectedAddress.id}` : '/api/account/addresses',
        {
          method: selectedAddress ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        setErrors((prev) => ({ ...prev, address: data.error || 'Erro ao salvar endereço' }))
        return
      }

      const data = await response.json()
      const savedAddress = data.address
      setSelectedAddress(savedAddress)
      setAddresses((prev) => {
        if (selectedAddress) {
          return prev.map((address) => (address.id === savedAddress.id ? savedAddress : address))
        }
        return [savedAddress, ...prev]
      })
      setIsEditingAddress(false)
      if (shippingAddress.zipCode.length === 8) {
        calculateShipping(shippingAddress.zipCode)
      }
    } catch (error) {
      console.error('Erro ao salvar endereço:', error)
      setErrors((prev) => ({ ...prev, address: 'Erro ao salvar endereço' }))
    }
  }

  const handleRegisterCep = async (cepOverride?: string) => {
    const cleanCep = (cepOverride ?? registerForm.zipCode).replace(/\D/g, '')
    if (cleanCep.length !== 8) return
    try {
      const response = await fetch(`/api/cep?zip=${cleanCep}`)
      if (!response.ok) return
      const data = await response.json()
      if (data.address) {
        setRegisterForm((prev) => ({
          ...prev,
          zipCode: cleanCep,
          street: data.address.street || prev.street,
          neighborhood: data.address.neighborhood || prev.neighborhood,
          city: data.address.city || prev.city,
          state: data.address.state || prev.state,
          complement: data.address.complement || prev.complement,
        }))
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    }
  }

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault()
    setRegisterLoading(true)
    setRegisterError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerForm.name,
          email: registerForm.email,
          password: registerForm.password,
          cpf: registerForm.cpf,
          address: {
            recipient: registerForm.name,
            phone: registerForm.phone,
            zipCode: registerForm.zipCode,
            street: registerForm.street,
            number: registerForm.number,
            complement: registerForm.complement,
            neighborhood: registerForm.neighborhood,
            city: registerForm.city,
            state: registerForm.state,
          },
        }),
      })

      if (!response.ok) {
        let errorMessage = 'Erro ao criar conta'
        try {
          const data = await response.json()
          errorMessage = data.error || errorMessage
        } catch (parseError) {
          const text = await response.text()
          if (text) {
            errorMessage = text
          }
        }
        setRegisterError(errorMessage)
        return
      }

      const loginResult = await signIn('credentials', {
        redirect: false,
        email: registerForm.email,
        password: registerForm.password,
      })

      if (loginResult?.error) {
        setRegisterError('Conta criada. Faça login para continuar.')
      } else {
        try {
          const addressResponse = await fetch('/api/account/addresses')
          const addressData = addressResponse.ok ? await addressResponse.json() : null
          if (!addressData?.addresses || addressData.addresses.length === 0) {
            await fetch('/api/account/addresses', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipient: registerForm.name,
                phone: registerForm.phone,
                zipCode: registerForm.zipCode,
                street: registerForm.street,
                number: registerForm.number,
                complement: registerForm.complement,
                neighborhood: registerForm.neighborhood,
                city: registerForm.city,
                state: registerForm.state,
                isDefault: true,
              }),
            })
          }
        } catch (error) {
          console.error('Erro ao salvar endereço após cadastro:', error)
        }
        if (typeof window !== 'undefined') {
          window.location.reload()
        } else {
          router.refresh()
        }
      }
    } catch (error) {
      setRegisterError('Erro ao criar conta. Tente novamente.')
    } finally {
      setRegisterLoading(false)
    }
  }

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
      calculateShipping(shippingAddress.zipCode)
    }
  }, [cart, shippingAddress.zipCode])

  // Calcular totais
  const subtotal = cart?.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0) || 0
  const discount = coupon ? (coupon.type === 'PERCENTAGE' ? subtotal * (coupon.value / 100) : coupon.value) : 0
  const isFreeShipping = subtotal >= 300 || coupon?.type === 'FREE_SHIPPING'
  const shippingCost = selectedShipping ? (isFreeShipping ? 0 : selectedShipping.price) : 0
  const total = Math.max(0, subtotal - discount + shippingCost)
  const formattedZip = shippingAddress.zipCode
    ? shippingAddress.zipCode.replace(/^(\d{5})(\d)/, '$1-$2')
    : ''
  const shouldShowShippingOptions = showShippingOptions || !selectedShipping

  useEffect(() => {
    if (paymentMethod !== 'CREDIT_CARD') {
      setCardFormReady(false)
      return
    }

    let isMounted = true

    const initCardForm = async () => {
      setCardFormError('')
      setCardFormReady(false)
      if (typeof window === 'undefined') return
      const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
      if (!publicKey) {
        setCardFormError('Chave pública do Mercado Pago não configurada.')
        return
      }

      try {
        const mpModule = (await import('@mercadopago/sdk-js')) as { loadMercadoPago: () => Promise<void> }
        await mpModule.loadMercadoPago()
        const MercadoPagoCtor = (window as any)?.MercadoPago
        if (!MercadoPagoCtor) {
          setCardFormError('Mercado Pago SDK não disponível.')
          return
        }
        const mp = new MercadoPagoCtor(publicKey, { locale: 'pt-BR' })
        if (!isMounted) return

        if (cardFormRef.current?.unmount) {
          cardFormRef.current.unmount()
        }

        const rootForm = document.getElementById('mp-card-form')
        if (!rootForm) {
          setCardFormError('Formulário do cartão não encontrado na página.')
          return
        }

        cardFormRef.current = mp.cardForm({
          amount: total.toFixed(2),
          iframe: true,
          form: {
            id: 'mp-card-form',
            cardholderName: {
              id: 'form-checkout__cardholderName',
              placeholder: 'Nome no cartão',
            },
            cardholderEmail: {
              id: 'form-checkout__cardholderEmail',
              placeholder: 'Email',
            },
            cardNumber: {
              id: 'form-checkout__cardNumber',
              placeholder: 'Número do cartão',
            },
            expirationDate: {
              id: 'form-checkout__expirationDate',
              placeholder: 'MM/AA',
            },
            securityCode: {
              id: 'form-checkout__securityCode',
              placeholder: 'CVV',
            },
            installments: {
              id: 'form-checkout__installments',
              placeholder: 'Parcelas',
            },
            issuer: {
              id: 'form-checkout__issuer',
              placeholder: 'Banco emissor',
            },
            identificationType: {
              id: 'form-checkout__identificationType',
              placeholder: 'Tipo',
            },
            identificationNumber: {
              id: 'form-checkout__identificationNumber',
              placeholder: 'CPF',
            },
          },
          callbacks: {
            onFormMounted: (error: any) => {
              if (error) {
                console.warn('Erro ao montar cardForm:', error)
                setCardFormError('Erro ao carregar formulário do cartão.')
                return
              }
              setCardFormReady(true)
            },
            onSubmit: (event: any) => {
              event.preventDefault()
              const formData = cardFormRef.current?.getCardFormData?.()
              cardFormDataRef.current = formData
              if (cardFormSubmitResolverRef.current) {
                cardFormSubmitResolverRef.current(formData)
                cardFormSubmitResolverRef.current = null
              }
            },
            onFetching: () => {
              setCardFormReady(false)
              return () => setCardFormReady(true)
            },
          },
        })
      } catch (error) {
        if (isMounted) {
          const message =
            error instanceof Error
              ? error.message
              : 'Erro ao iniciar formulário do cartão.'
          console.error('Erro ao iniciar cardForm Mercado Pago:', error)
          setCardFormError(message)
        }
      }
    }

    initCardForm()

    return () => {
      isMounted = false
      if (cardFormRef.current?.unmount) {
        cardFormRef.current.unmount()
      }
    }
  }, [paymentMethod, total])

  // Buscar frete
  const calculateShipping = async (cep: string) => {
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
      setSelectedShipping(options[0] || null)
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
  const requestPixPayment = async (orderInfo: { id: string; orderNumber: string; total: number }) => {
    setPaymentError('')
    setPixCode('')
    setPixQrImage('')
    try {
      const paymentResponse = await fetch('/api/payments/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderInfo.id,
          amount: orderInfo.total,
          description: `Pedido ${orderInfo.orderNumber}`,
          payerEmail:
            session?.user?.email ||
            shippingAddress.recipient.toLowerCase().replace(/\\s/g, '.') + '@email.com',
        }),
      })

      const paymentData = await paymentResponse.json()
      if (!paymentResponse.ok) {
        setPaymentError(paymentData?.error || 'Erro ao gerar pagamento')
        return
      }

      if (paymentData.qrCode) {
        setPixCode(paymentData.qrCode)
      }
      if (paymentData.qrCodeBase64) {
        setPixQrImage(`data:image/png;base64,${paymentData.qrCodeBase64}`)
      }

      if (!paymentData.qrCode && !paymentData.qrCodeBase64) {
        setPaymentError('Não foi possível gerar o QR Code do Pix.')
      }
    } catch (error) {
      setPaymentError('Erro ao gerar pagamento.')
    }
  }

  const collectCardFormData = async () => {
    if (typeof window === 'undefined') return null
    const form = document.getElementById('mp-card-form') as HTMLFormElement | null
    if (!form) return null

    return new Promise<any>((resolve) => {
      cardFormSubmitResolverRef.current = resolve
      if (typeof (form as any).requestSubmit === 'function') {
        ;(form as any).requestSubmit()
      } else {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      }
      window.setTimeout(() => {
        if (cardFormSubmitResolverRef.current === resolve) {
          cardFormSubmitResolverRef.current = null
          resolve(null)
        }
      }, 2000)
    })
  }

  const requestCardPayment = async (orderInfo: { id: string; orderNumber: string; total: number }) => {
    setPaymentError('')
    const cardForm = cardFormRef.current
    if (!cardForm || typeof cardForm.getCardFormData !== 'function') {
      setPaymentError('Formulário do cartão não carregado.')
      return false
    }

    let formData = cardForm.getCardFormData()
    if (!formData?.token && cardFormDataRef.current) {
      formData = cardFormDataRef.current
    }
    if (!formData?.token) {
      formData = (await collectCardFormData()) || cardForm.getCardFormData()
    }
    const token = formData?.token
    const paymentMethodId = formData?.paymentMethodId
    const issuerId = formData?.issuerId
    const installments = formData?.installments
    const identificationType = formData?.identificationType || 'CPF'
    const identificationNumber = formData?.identificationNumber || customerCpf
    const payerEmail =
      formData?.cardholderEmail ||
      session?.user?.email ||
      shippingAddress.recipient.toLowerCase().replace(/\\s/g, '.') + '@email.com'

    if (!token || !paymentMethodId) {
      setPaymentError('Preencha os dados do cartão para continuar.')
      return false
    }

    if (!identificationNumber) {
      setPaymentError('CPF obrigatório para pagamento com cartão.')
      return false
    }

    try {
      const response = await fetch('/api/payments/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderInfo.id,
          amount: orderInfo.total,
          description: `Pedido ${orderInfo.orderNumber}`,
          payerEmail,
          token,
          paymentMethodId,
          issuerId,
          installments,
          identificationType,
          identificationNumber,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        setPaymentError(data?.error || 'Erro ao processar pagamento.')
        return false
      }

      return true
    } catch (error) {
      setPaymentError('Erro ao processar pagamento.')
      return false
    }
  }

  const createOrder = async () => {
    // Validações
    const newErrors: Record<string, string> = {}

    if (!shippingAddress.recipient) newErrors.recipient = 'Nome é obrigatório'
    if (!shippingAddress.phone) newErrors.phone = 'Telefone é obrigatório'
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

    if (paymentMethod === 'CREDIT_CARD' && !cardFormReady) {
      setPaymentError('Aguarde o carregamento do formulário do cartão.')
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
          customerPhone: shippingAddress.phone || '',
          shippingAddress: {
            ...shippingAddress,
            cost: selectedShipping.price,
            method: selectedShipping.code,
            cpf: customerCpf || undefined,
          },
          paymentMethod: paymentMethod === 'PIX' ? 'MERCADO_PAGO_PIX' : 'MERCADO_PAGO_CREDIT_CARD',
          couponCode: coupon?.code,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const orderInfo = {
          id: data.order.id,
          orderNumber: data.order.orderNumber,
          total: data.order.total,
        }
        if (paymentMethod === 'PIX') {
          setOrderCreated(true)
          setCreatedOrder(orderInfo)
          await requestPixPayment(orderInfo)
        } else {
          setOrderCreated(false)
          setCreatedOrder(orderInfo)
          const paid = await requestCardPayment(orderInfo)
          if (!paid) {
            setPaymentError('Pagamento não aprovado. Você pode tentar novamente no pedido.')
          }
          router.push(`/account/orders/${orderInfo.orderNumber}`)
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

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-white to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-300 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-white to-white pb-20">
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/shop/cart" className="flex items-center gap-2 text-sm">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-semibold text-foreground">Voltar</span>
            </Link>
            <h1 className="font-display font-bold text-xl text-foreground">Checkout</h1>
            <div className="w-8" />
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="font-display font-bold text-2xl text-foreground mb-4">
              Entrar
            </h2>
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                {loginError}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={loginForm.email}
                  onChange={(event) =>
                    setLoginForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Senha</label>
                <input
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                />
              </div>
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-4 bg-gradient-to-r from-[#F8B6D8] to-[#E91E63] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loginLoading ? 'Entrando...' : 'Entrar'}
              </button>
              <Link href="/register" className="text-sm text-primary hover:underline">
                Não tem conta? Cadastre-se
              </Link>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="font-display font-bold text-2xl text-foreground mb-4">
              Criar conta
            </h2>
            {registerError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                {registerError}
              </div>
            )}
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={registerForm.name}
                  onChange={(event) =>
                    setRegisterForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Telefone</label>
                <input
                  type="text"
                  value={registerForm.phone}
                  onChange={(event) =>
                    setRegisterForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">CEP *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={registerForm.zipCode}
                    onChange={(event) => {
                      const cep = event.target.value.replace(/\D/g, '')
                      setRegisterForm((prev) => ({ ...prev, zipCode: cep }))
                      if (cep.length === 8) handleRegisterCep(cep)
                    }}
                    className="flex-1 px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                    placeholder="00000000"
                  />
                  <button
                    type="button"
                    onClick={() => handleRegisterCep(registerForm.zipCode)}
                    className="px-4 py-3 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200"
                  >
                    OK
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Rua *</label>
                <input
                  type="text"
                  required
                  value={registerForm.street}
                  onChange={(event) =>
                    setRegisterForm((prev) => ({ ...prev, street: event.target.value }))
                  }
                  className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Número *</label>
                  <input
                    type="text"
                    required
                    value={registerForm.number}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({ ...prev, number: event.target.value }))
                    }
                    className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Complemento</label>
                  <input
                    type="text"
                    value={registerForm.complement}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({ ...prev, complement: event.target.value }))
                    }
                    className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Bairro *</label>
                <input
                  type="text"
                  required
                  value={registerForm.neighborhood}
                  onChange={(event) =>
                    setRegisterForm((prev) => ({ ...prev, neighborhood: event.target.value }))
                  }
                  className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Cidade *</label>
                  <input
                    type="text"
                    required
                    value={registerForm.city}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({ ...prev, city: event.target.value }))
                    }
                    className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Estado *</label>
                  <input
                    type="text"
                    required
                    value={registerForm.state}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({ ...prev, state: event.target.value }))
                    }
                    className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">CPF</label>
                <input
                  type="text"
                  value={registerForm.cpf}
                  onChange={(event) =>
                    setRegisterForm((prev) => ({ ...prev, cpf: event.target.value }))
                  }
                  className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Email (login)</label>
                <input
                  type="email"
                  required
                  value={registerForm.email}
                  onChange={(event) =>
                    setRegisterForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Senha</label>
                <input
                  type="password"
                  required
                  value={registerForm.password}
                  onChange={(event) =>
                    setRegisterForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                />
              </div>

              <button
                type="submit"
                disabled={registerLoading}
                className="w-full py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {registerLoading ? 'Criando conta...' : 'Criar conta e continuar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
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
            ) : paymentError ? (
              <div className="text-sm text-red-500">{paymentError}</div>
            ) : (
              <QrCode className="w-48 h-48 mx-auto text-foreground" />
            )}
          </div>

          {pixCode && (
            <>
              <p className="text-sm text-muted-foreground mb-2">
                Ou copie o código Pix:
              </p>
              <code className="block bg-gray-100 p-3 rounded-lg text-xs mb-6 break-all">
                {pixCode}
              </code>
            </>
          )}

          {paymentError && createdOrder && (
            <button
              onClick={() => requestPixPayment(createdOrder)}
              className="w-full py-3 mb-4 border border-pink-200 rounded-xl font-semibold text-primary hover:border-pink-400"
            >
              Tentar gerar Pix novamente
            </button>
          )}

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
            {/* Endereço de Entrega */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-primary" />
                Endereço de Entrega
              </h2>

              {addressesLoading && !isEditingAddress ? (
                <p className="text-sm text-muted-foreground">Carregando endereço...</p>
              ) : selectedAddress && !isEditingAddress ? (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">
                      {shippingAddress.recipient} {shippingAddress.phone ? `(${shippingAddress.phone})` : ''}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {shippingAddress.street}, {shippingAddress.number}
                      {shippingAddress.complement ? `, ${shippingAddress.complement}` : ''}, {shippingAddress.neighborhood},{' '}
                      {shippingAddress.city}, {shippingAddress.state}, {formattedZip}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingAddress(true)}
                    className="text-sm font-semibold text-primary"
                  >
                    Editar
                  </button>
                </div>
              ) : isEditingAddress ? (
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
                    <label className="block text-sm font-semibold mb-2">Telefone</label>
                    <input
                      type="text"
                      value={shippingAddress.phone || ''}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                      className={`w-full px-4 py-3 border ${errors.phone ? 'border-red-500' : 'border-pink-200'} rounded-lg focus:outline-none focus:border-pink-400`}
                      placeholder="(DDD) 00000-0000"
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">CEP *</label>
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
                          }
                        }}
                        disabled={calculatingShipping}
                        className="px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        {calculatingShipping ? '...' : 'OK'}
                      </button>
                    </div>
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
                    <input
                      type="text"
                      required
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      className={`w-full px-4 py-3 border ${errors.state ? 'border-red-500' : 'border-pink-200'} rounded-lg focus:outline-none focus:border-pink-400`}
                      placeholder="UF"
                    />
                    {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                  </div>

                  {errors.address && (
                    <p className="md:col-span-2 text-sm text-red-500">{errors.address}</p>
                  )}

                  <div className="md:col-span-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingAddress(false)}
                      className="px-4 py-2 text-sm rounded-lg border border-pink-200 text-muted-foreground"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAddress}
                      className="px-4 py-2 text-sm rounded-lg bg-primary text-white font-semibold"
                    >
                      Salvar endereço
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-1">
                  <span>Nenhum endereço cadastrado.</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingAddress(true)}
                    className="text-primary font-semibold hover:underline"
                  >
                    Adicionar endereço
                  </button>
                </div>
              )}
            </div>

            {/* Produtos pedidos */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-primary" />
                Produtos pedidos
              </h2>
              <div className="space-y-4">
                {cart?.items.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
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
                    <p className="font-bold text-primary text-sm">
                      R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Opções de Frete */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                <h2 className="font-display font-bold text-xl flex items-center gap-2">
                  <Truck className="w-6 h-6 text-primary" />
                  Opções de Frete
                </h2>
                {formattedZip && (
                  <span className="text-sm text-muted-foreground">CEP: {formattedZip}</span>
                )}
              </div>

              {selectedShipping && !shouldShowShippingOptions ? (
                <div className="flex items-center justify-between p-4 border-2 rounded-lg border-pink-200 bg-pink-50">
                  <div>
                    <p className="font-semibold">{selectedShipping.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedShipping.estimatedDelivery}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      {isFreeShipping ? 'Grátis' : `R$ ${selectedShipping.price.toFixed(2).replace('.', ',')}`}
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
                        {isFreeShipping ? 'Grátis' : `R$ ${option.price.toFixed(2).replace('.', ',')}`}
                      </p>
                    </label>
                  ))}
                </div>
              )}
              {errors.shipping && <p className="text-red-500 text-sm mt-2">{errors.shipping}</p>}
            </div>

            {/* CPF */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="font-display font-bold text-xl mb-4">CPF</h2>
              <input
                type="text"
                value={customerCpf}
                readOnly
                className="w-full px-4 py-3 border border-pink-200 rounded-lg bg-gray-50 text-muted-foreground focus:outline-none"
                placeholder="000.000.000-00"
              />
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
                <form id="mp-card-form" className="space-y-4">
                  {cardFormError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                      {cardFormError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold mb-2">Número do Cartão *</label>
                    <div
                      id="form-checkout__cardNumber"
                      className="w-full h-12 border border-pink-200 rounded-lg bg-white px-3 overflow-hidden flex items-center"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Validade *</label>
                      <div
                        id="form-checkout__expirationDate"
                        className="w-full h-12 border border-pink-200 rounded-lg bg-white px-3 overflow-hidden flex items-center"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">CVV *</label>
                      <div
                        id="form-checkout__securityCode"
                        className="w-full h-12 border border-pink-200 rounded-lg bg-white px-3 overflow-hidden flex items-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Nome no Cartão *</label>
                    <input
                      id="form-checkout__cardholderName"
                      type="text"
                      defaultValue={session?.user?.name || ''}
                      className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Email *</label>
                      <input
                        id="form-checkout__cardholderEmail"
                        type="email"
                        defaultValue={isTestMode ? 'test_user_123@testuser.com' : session?.user?.email || ''}
                        readOnly={isTestMode}
                        className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                      />
                      {isTestMode && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Em modo TEST, o Mercado Pago exige um email @testuser.com (ex.: test_user_123@testuser.com).
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">CPF *</label>
                      <input
                        id="form-checkout__identificationNumber"
                        type="text"
                        defaultValue={customerCpf}
                        readOnly={Boolean(customerCpf)}
                        placeholder="000.000.000-00"
                        className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Documento</label>
                      <select
                        id="form-checkout__identificationType"
                        defaultValue="CPF"
                        className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                      >
                        <option value="CPF">CPF</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Parcelas</label>
                      <select
                        id="form-checkout__installments"
                        className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                      >
                        <option value="">Carregando parcelas...</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Banco emissor</label>
                    <select
                      id="form-checkout__issuer"
                      className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                    >
                      <option value="">Carregando banco emissor...</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <span>Pagamento 100% seguro via Mercado Pago</span>
                  </div>
                  <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1}>
                    Enviar
                  </button>
                </form>
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
              {paymentError && !orderCreated && (
                <p className="text-red-500 text-sm mt-2 text-center">{paymentError}</p>
              )}
            </div>
          </div>

          {/* Coluna Direita - Resumo */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-6 sticky top-24">
              <h2 className="font-display font-bold text-xl mb-6">Resumo do Pedido</h2>

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
                  <span>
                    {selectedShipping
                      ? isFreeShipping
                        ? 'Grátis'
                        : `R$ ${shippingCost.toFixed(2).replace('.', ',')}`
                      : 'Calculando...'}
                  </span>
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
                <p>Frete grátis em fretes acima R$300,00</p>
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
