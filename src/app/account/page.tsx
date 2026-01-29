'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, ShoppingBag, LogOut, MapPin, CreditCard, Clock, Package, CheckCircle, XCircle } from 'lucide-react'
import { AuthProvider } from '@/components/providers/AuthProvider'

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  total: number
  shippingAddress: any
  trackingCode?: string
  estimatedDelivery?: string
  items: Array<{
    productName: string
    productImage: string
    quantity: number
    price: number
  }>
  createdAt: string
}

interface Address {
  id: string
  recipient: string
  phone?: string | null
  zipCode: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  isDefault: boolean
}

export default function AccountPage() {
  return (
    <AuthProvider>
      <AccountContent />
    </AuthProvider>
  )
}

function AccountContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'addresses'>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [addressesLoading, setAddressesLoading] = useState(false)
  const [addressError, setAddressError] = useState('')
  const [profileName, setProfileName] = useState('')
  const [profileCpf, setProfileCpf] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [addressForm, setAddressForm] = useState({
    recipient: '',
    phone: '',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    isDefault: false,
  })

  // Buscar pedidos do usuário
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!session?.user) {
          setLoading(false)
          return
        }

        const response = await fetch('/api/shop/orders?userId=' + session.user.id)
        if (response.status === 401 || response.status === 403) {
          setOrders([])
          setLoading(false)
          return
        }
        const data = await response.json()
        setOrders(data.orders || [])
      } catch (error) {
        console.error('Erro ao buscar pedidos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [session])

  useEffect(() => {
    if (session?.user) {
      setProfileName(session.user.name || '')
    }
  }, [session])

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user) return
      try {
        const response = await fetch('/api/account/profile')
        if (!response.ok) return
        const data = await response.json()
        setProfileCpf(data.user?.cpf || '')
      } catch (error) {
        console.error('Erro ao buscar perfil:', error)
      }
    }

    fetchProfile()
  }, [session])

  useEffect(() => {
    if (!session?.user || activeTab !== 'addresses') return

    const fetchAddresses = async () => {
      setAddressesLoading(true)
      setAddressError('')
      try {
        const response = await fetch('/api/account/addresses')
        if (!response.ok) {
          const data = await response.json()
          setAddressError(data.error || 'Erro ao buscar enderecos')
          return
        }
        const data = await response.json()
        setAddresses(data.addresses || [])
      } catch (error) {
        console.error('Erro ao buscar enderecos:', error)
        setAddressError('Erro ao buscar enderecos')
      } finally {
        setAddressesLoading(false)
      }
    }

    fetchAddresses()
  }, [activeTab, session])

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const handleProfileSave = async () => {
    setProfileSaving(true)
    setProfileMessage('')
    try {
      const response = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName, cpf: profileCpf }),
      })

      if (!response.ok) {
        const data = await response.json()
        setProfileMessage(data.error || 'Erro ao salvar perfil')
      } else {
        setProfileMessage('Perfil atualizado com sucesso.')
        router.refresh()
      }
    } catch (error) {
      setProfileMessage('Erro ao salvar perfil')
    } finally {
      setProfileSaving(false)
    }
  }

  const handleAddressSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setAddressError('')
    try {
      const response = await fetch('/api/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm),
      })

      if (!response.ok) {
        const data = await response.json()
        setAddressError(data.error || 'Erro ao salvar endereco')
        return
      }

      const data = await response.json()
      setAddresses((prev) => [
        data.address,
        ...prev.map((address) => ({
          ...address,
          isDefault: data.address.isDefault ? false : address.isDefault,
        })),
      ])
      setAddressForm({
        recipient: '',
        phone: '',
        zipCode: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        isDefault: false,
      })
    } catch (error) {
      setAddressError('Erro ao salvar endereco')
    }
  }

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      const response = await fetch(`/api/account/addresses/${addressId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })

      if (!response.ok) {
        const data = await response.json()
        setAddressError(data.error || 'Erro ao atualizar endereco')
        return
      }

      const data = await response.json()
      setAddresses((prev) =>
        prev.map((address) => ({
          ...address,
          isDefault: address.id === data.address.id,
        }))
      )
    } catch (error) {
      setAddressError('Erro ao atualizar endereco')
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const response = await fetch(`/api/account/addresses/${addressId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        setAddressError(data.error || 'Erro ao remover endereco')
        return
      }

      setAddresses((prev) => prev.filter((address) => address.id !== addressId))
    } catch (error) {
      setAddressError('Erro ao remover endereco')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'PROCESSING':
      case 'PAID':
        return 'bg-blue-100 text-blue-800'
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800'
      case 'DELIVERED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
      case 'REFUNDED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: 'Pendente',
      PROCESSING: 'Processando',
      PAID: 'Pago',
      SHIPPED: 'Enviado',
      DELIVERED: 'Entregue',
      CANCELLED: 'Cancelado',
      REFUNDED: 'Reembolsado',
    }
    return statusMap[status] || status
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-white to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="font-display font-bold text-2xl text-foreground mb-2">
            Faça Login para Acessar
          </h1>
          <p className="text-muted-foreground mb-6">
            Você precisa estar logado para ver sua conta
          </p>
          <Link
            href="/login"
            className="block w-full py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Fazer Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-white to-white pb-20">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Voltar ao Site</span>
          </Link>
          <h1 className="font-display font-bold text-xl text-foreground">Minha Conta</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-6 sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-[#F8B6D8] to-[#E91E63] rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold">{session.user?.name || 'Cliente'}</p>
                  <p className="text-sm text-muted-foreground">{session.user?.email}</p>
                </div>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full py-3 px-4 rounded-lg font-medium flex items-center gap-3 transition-all ${
                    activeTab === 'orders'
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <ShoppingBag className="w-5 h-5" />
                  Meus Pedidos
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full py-3 px-4 rounded-lg font-medium flex items-center gap-3 transition-all ${
                    activeTab === 'profile'
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <User className="w-5 h-5" />
                  Perfil
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full py-3 px-4 rounded-lg font-medium flex items-center gap-3 transition-all ${
                    activeTab === 'addresses'
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <MapPin className="w-5 h-5" />
                  Enderecos
                </button>
              </nav>
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div className="lg:col-span-3">
            {activeTab === 'orders' && (
              <>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 border-4 border-pink-300 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-foreground">Carregando pedidos...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                    <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <h2 className="font-display font-bold text-xl text-foreground mb-2">
                      Você ainda não tem pedidos
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Comece a comprar e veja seus pedidos aqui
                    </p>
                    <Link
                      href="/shop"
                      className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Ir para Loja
                      <ShoppingBag className="w-5 h-5" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h2 className="font-display font-bold text-2xl text-foreground mb-6">
                      Meus Pedidos ({orders.length})
                    </h2>
                    {orders.map((order) => (
                      <div key={order.id} className="bg-white rounded-2xl shadow-md p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="font-semibold text-lg">
                              Pedido #{order.orderNumber}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </div>

                        {/* Itens */}
                        <div className="mb-4">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
                              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                {item.productImage && (
                                  <img
                                    src={item.productImage}
                                    alt={item.productName}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold line-clamp-2">{item.productName}</p>
                                <p className="text-sm text-muted-foreground">Qtd: {item.quantity}</p>
                              </div>
                              <p className="font-bold text-primary">
                                R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Totais */}
                        <div className="border-t border-gray-200 pt-4">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              {order.trackingCode && (
                                <p className="text-sm text-muted-foreground mb-1">
                                  <MapPin className="w-4 h-4 inline mr-1" />
                                  Código de rastreamento: <span className="font-semibold text-foreground">{order.trackingCode}</span>
                                </p>
                              )}
                              <p className="text-sm">
                                Total: <span className="font-bold text-lg text-primary">
                                  R$ {order.total.toFixed(2).replace('.', ',')}
                                </span>
                              </p>
                            </div>
                            <Link
                              href={`/account/orders/${order.orderNumber}`}
                              className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                            >
                              Ver Detalhes
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="font-display font-bold text-2xl text-foreground mb-6">
                  Meu Perfil
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Nome</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(event) => setProfileName(event.target.value)}
                      className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Email</label>
                    <input
                      type="email"
                      value={session.user?.email || ''}
                      disabled
                      className="w-full px-4 py-3 border border-pink-200 rounded-lg bg-gray-50 text-gray-500"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Não é possível alterar o email
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">CPF</label>
                    <input
                      type="text"
                      value={profileCpf}
                      onChange={(event) => setProfileCpf(event.target.value)}
                      className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                    />
                  </div>

                  {profileMessage && (
                    <p className="text-sm text-muted-foreground">{profileMessage}</p>
                  )}
                  <button
                    onClick={handleProfileSave}
                    disabled={profileSaving}
                    className="w-full py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {profileSaving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-md p-6">
                  <h2 className="font-display font-bold text-2xl text-foreground mb-4">
                    Enderecos salvos
                  </h2>

                  {addressesLoading ? (
                    <p className="text-muted-foreground">Carregando enderecos...</p>
                  ) : addresses.length === 0 ? (
                    <p className="text-muted-foreground">
                      Nenhum endereco cadastrado ainda.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-foreground">
                                {address.recipient}
                              </p>
                              {address.phone && (
                                <p className="text-sm text-muted-foreground">
                                  {address.phone}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                {address.street}, {address.number}
                                {address.complement ? ` - ${address.complement}` : ''}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {address.neighborhood} - {address.city}/{address.state}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                CEP: {address.zipCode}
                              </p>
                            </div>
                            {address.isDefault && (
                              <span className="text-xs font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full">
                                Padrao
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {!address.isDefault && (
                              <button
                                onClick={() => handleSetDefaultAddress(address.id)}
                                className="px-4 py-2 text-sm rounded-lg border border-pink-200 hover:border-pink-400 text-primary"
                              >
                                Definir como padrao
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteAddress(address.id)}
                              className="px-4 py-2 text-sm rounded-lg border border-red-200 text-red-600 hover:border-red-400"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {addressError && (
                    <p className="text-sm text-red-500 mt-4">{addressError}</p>
                  )}
                </div>

                <div className="bg-white rounded-2xl shadow-md p-6">
                  <h3 className="font-display font-bold text-xl text-foreground mb-4">
                    Adicionar novo endereco
                  </h3>

                  <form onSubmit={handleAddressSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Nome do destinatario</label>
                      <input
                        value={addressForm.recipient}
                        onChange={(event) =>
                          setAddressForm((prev) => ({ ...prev, recipient: event.target.value }))
                        }
                        required
                        className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Telefone</label>
                      <input
                        value={addressForm.phone}
                        onChange={(event) =>
                          setAddressForm((prev) => ({ ...prev, phone: event.target.value }))
                        }
                        className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">CEP</label>
                        <input
                          value={addressForm.zipCode}
                          onChange={(event) =>
                            setAddressForm((prev) => ({ ...prev, zipCode: event.target.value }))
                          }
                          required
                          className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Numero</label>
                        <input
                          value={addressForm.number}
                          onChange={(event) =>
                            setAddressForm((prev) => ({ ...prev, number: event.target.value }))
                          }
                          required
                          className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Rua</label>
                      <input
                        value={addressForm.street}
                        onChange={(event) =>
                          setAddressForm((prev) => ({ ...prev, street: event.target.value }))
                        }
                        required
                        className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Complemento</label>
                      <input
                        value={addressForm.complement}
                        onChange={(event) =>
                          setAddressForm((prev) => ({ ...prev, complement: event.target.value }))
                        }
                        className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Bairro</label>
                      <input
                        value={addressForm.neighborhood}
                        onChange={(event) =>
                          setAddressForm((prev) => ({ ...prev, neighborhood: event.target.value }))
                        }
                        required
                        className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Cidade</label>
                        <input
                          value={addressForm.city}
                          onChange={(event) =>
                            setAddressForm((prev) => ({ ...prev, city: event.target.value }))
                          }
                          required
                          className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Estado</label>
                        <input
                          value={addressForm.state}
                          onChange={(event) =>
                            setAddressForm((prev) => ({ ...prev, state: event.target.value }))
                          }
                          required
                          className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={addressForm.isDefault}
                        onChange={(event) =>
                          setAddressForm((prev) => ({ ...prev, isDefault: event.target.checked }))
                        }
                        className="accent-primary"
                      />
                      Definir como endereco padrao
                    </label>
                    <button
                      type="submit"
                      className="w-full py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Salvar endereco
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
