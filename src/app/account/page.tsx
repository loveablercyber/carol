'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Bell,
  User,
  ShoppingBag,
  LogOut,
  MapPin,
  CreditCard,
  Clock,
  Package,
  LayoutDashboard,
  Search,
} from 'lucide-react'
import { AuthProvider } from '@/components/providers/AuthProvider'
import AdminProducts from '@/components/admin/AdminProducts'
import AdminCategories from '@/components/admin/AdminCategories'
import AdminOrders from '@/components/admin/AdminOrders'
import AdminCustomers from '@/components/admin/AdminCustomers'
import AdminHomeModules from '@/components/admin/AdminHomeModules'
import AdminInternalPages from '@/components/admin/AdminInternalPages'
import AdminChatbotConfig from '@/components/admin/AdminChatbotConfig'
import AdminAppointments from '@/components/admin/AdminAppointments'
import AdminShipping from '@/components/admin/AdminShipping'
import AdminReviews from '@/components/admin/AdminReviews'
import AdminBackup from '@/components/admin/AdminBackup'
import { MercadoPagoTransparentCard } from '@/components/payment/MercadoPagoTransparentCard'

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

interface AppointmentHistory {
  id: string
  serviceName: string
  scheduledAt: string
  totalPrice: number
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  paymentMethod?: string | null
  paymentStatus?: string | null
  depositAmount?: number
  depositApproved?: boolean
  status: 'pending' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  clientConfirmedAt?: string | null
  confirmationDeadlineAt?: string | null
  canConfirmFromClient?: boolean
  canCancelFromClient?: boolean
  confirmationWindowHours?: number
  questionnaireData?: {
    name?: string
    phone?: string
    email?: string
    age?: string
    allergies?: string
    megaHairHistory?: string
    hairType?: string
	    hairColor?: string
	    hairState?: string
	    methods?: string
	    primaryFlow?: string
	    primaryCategory?: string
	    maintenanceType?: string
	    maintenanceBasePrice?: string
	    hairSituation?: string
	    additionalServices?: string
	    maintenanceKit?: string
	    cleanHairObservation?: string
	  } | null
  beforeImageUrl?: string | null
  afterImageUrl?: string | null
  maintenanceHistory?: Array<{
    id: string
    date: string
    notes: string
    createdAt: string
  }>
  notes?: string | null
  googleCalendarUrl?: string | null
}

interface SavedCard {
  id: string
  label: string
  holderName: string
  brand: string
  last4: string
  expiryMonth: number
  expiryYear: number
  documentNumber?: string | null
  isDefault: boolean
}

const DEFAULT_COMPANY_WHATSAPP_URL =
  'https://wa.me/5514998373935'

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
  const [activeTab, setActiveTab] = useState<
    'orders' | 'profile' | 'addresses' | 'appointments' | 'cards' | 'admin'
  >('orders')
  const [adminSection, setAdminSection] = useState<
    | 'dashboard'
    | 'products'
    | 'categories'
    | 'orders'
    | 'customers'
    | 'homeModules'
    | 'internalPages'
    | 'chatbotConfig'
    | 'appointments'
    | 'shipping'
    | 'reviews'
    | 'backup'
  >('dashboard')
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
  const [appointments, setAppointments] = useState<AppointmentHistory[]>([])
  const [appointmentsLoading, setAppointmentsLoading] = useState(false)
  const [expandedAppointmentDetails, setExpandedAppointmentDetails] = useState<
    Record<string, boolean>
  >({})
  const [appointmentActionId, setAppointmentActionId] = useState<string | null>(null)
  const [appointmentActionError, setAppointmentActionError] = useState('')
  const [appointmentActionSuccess, setAppointmentActionSuccess] = useState('')
  const [appointmentPaymentId, setAppointmentPaymentId] = useState<string | null>(null)
  const [appointmentPaymentError, setAppointmentPaymentError] = useState('')
  const [cards, setCards] = useState<SavedCard[]>([])
  const [cardsLoading, setCardsLoading] = useState(false)
  const [cardForm, setCardForm] = useState({
    id: '',
    label: '',
    holderName: '',
    brand: '',
    last4: '',
    expiryMonth: '',
    expiryYear: '',
    documentNumber: '',
    isDefault: false,
  })

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab')
    if (tab === 'appointments') {
      setActiveTab('appointments')
    }
  }, [])

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

  useEffect(() => {
    if (!session?.user || activeTab !== 'appointments') return

    const fetchAppointments = async () => {
      setAppointmentsLoading(true)
      setAppointmentActionError('')
      try {
        const response = await fetch('/api/account/appointments')
        const data = await response.json()
        if (!response.ok) {
          setAppointmentActionError(data.error || 'Erro ao buscar historico de agendamentos')
          return
        }
        setAppointments(data.appointments || [])
      } catch (error) {
        console.error('Erro ao buscar historico de agendamentos:', error)
        setAppointmentActionError('Erro ao buscar historico de agendamentos')
      } finally {
        setAppointmentsLoading(false)
      }
    }

    void fetchAppointments()
  }, [activeTab, session])

  useEffect(() => {
    if (!session?.user || activeTab !== 'cards') return

    const fetchCards = async () => {
      setCardsLoading(true)
      try {
        const response = await fetch('/api/account/cards')
        const data = await response.json()
        if (!response.ok) return
        setCards(data.cards || [])
      } catch (error) {
        console.error('Erro ao buscar cartoes salvos:', error)
      } finally {
        setCardsLoading(false)
      }
    }

    fetchCards()
  }, [activeTab, session])

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const loadAppointments = async () => {
    setAppointmentsLoading(true)
    setAppointmentActionError('')
    try {
      const response = await fetch('/api/account/appointments')
      const data = await response.json()
      if (!response.ok) {
        setAppointmentActionError(data.error || 'Erro ao buscar historico de agendamentos')
        return
      }
      setAppointments(data.appointments || [])
    } catch (error) {
      console.error('Erro ao buscar historico de agendamentos:', error)
      setAppointmentActionError('Erro ao buscar historico de agendamentos')
    } finally {
      setAppointmentsLoading(false)
    }
  }

  const getCompanyWhatsappSupportUrl = async () => {
    try {
      const response = await fetch('/api/home/modules', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        return DEFAULT_COMPANY_WHATSAPP_URL
      }

      const modules = Array.isArray(data?.modules) ? data.modules : []
      const supportModule = modules.find(
        (item: any) => String(item?.key || '') === 'support'
      )
      const href = String(supportModule?.href || '').trim()

      if (
        href &&
        (href.includes('wa.me/') || href.includes('whatsapp.com'))
      ) {
        return href
      }
    } catch (error) {
      console.warn('Nao foi possivel obter o link de suporte do WhatsApp:', error)
    }

    return DEFAULT_COMPANY_WHATSAPP_URL
  }

  const buildWhatsAppUrlWithText = (baseUrl: string, text: string) => {
    try {
      const url = new URL(baseUrl || DEFAULT_COMPANY_WHATSAPP_URL)
      const host = url.hostname.toLowerCase()
      if (!host.includes('wa.me') && !host.includes('whatsapp.com')) {
        throw new Error('URL de suporte invalida para WhatsApp')
      }
      url.searchParams.set('text', text)
      return url.toString()
    } catch {
      return `${DEFAULT_COMPANY_WHATSAPP_URL}?text=${encodeURIComponent(text)}`
    }
  }

  const handleAppointmentAction = async (
    appointmentId: string,
    action: 'confirm' | 'cancel'
  ) => {
    setAppointmentActionId(appointmentId)
    setAppointmentActionError('')
    setAppointmentActionSuccess('')

    try {
      const response = await fetch(`/api/account/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setAppointmentActionError(
          data.error || 'Nao foi possivel atualizar o agendamento.'
        )
      } else {
        setAppointmentActionSuccess(
          data.message ||
            (action === 'confirm'
              ? 'Agendamento confirmado com sucesso.'
              : 'Agendamento cancelado com sucesso.')
        )

        if (action === 'confirm') {
          const appointmentFromResponse = data?.appointment || {}
          const appointmentFromState = appointments.find(
            (item) => item.id === appointmentId
          )
          const serviceName = String(
            appointmentFromResponse?.serviceName ||
              appointmentFromState?.serviceName ||
              'Servico'
          )
          const scheduledAt = String(
            appointmentFromResponse?.scheduledAt ||
              appointmentFromState?.scheduledAt ||
              ''
          )
          const dateText = scheduledAt
            ? new Date(scheduledAt).toLocaleString('pt-BR')
            : 'Nao informado'
          const customerName = String(
            session?.user?.name || appointmentFromResponse?.customerName || 'Cliente'
          )
          const customerEmail = String(
            session?.user?.email || appointmentFromResponse?.customerEmail || ''
          )

          const message = [
            'Ola! Agendamento confirmado pela cliente no painel.',
            `Cliente: ${customerName}`,
            customerEmail ? `Email: ${customerEmail}` : '',
            `Servico: ${serviceName}`,
            `Data/Hora: ${dateText}`,
          ]
            .filter(Boolean)
            .join('\n')

          const supportBaseUrl = await getCompanyWhatsappSupportUrl()
          const redirectUrl = buildWhatsAppUrlWithText(supportBaseUrl, message)
          window.location.href = redirectUrl
          return
        }
      }

      await loadAppointments()
    } catch (error) {
      console.error('Erro ao atualizar agendamento da cliente:', error)
      setAppointmentActionError('Erro ao atualizar agendamento. Tente novamente.')
    } finally {
      setAppointmentActionId(null)
    }
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

  const resetCardForm = () => {
    setCardForm({
      id: '',
      label: '',
      holderName: '',
      brand: '',
      last4: '',
      expiryMonth: '',
      expiryYear: '',
      documentNumber: '',
      isDefault: false,
    })
  }

  const handleCardSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      const payload = {
        label: cardForm.label,
        holderName: cardForm.holderName,
        brand: cardForm.brand,
        last4: cardForm.last4,
        expiryMonth: Number(cardForm.expiryMonth),
        expiryYear: Number(cardForm.expiryYear),
        documentNumber: cardForm.documentNumber || null,
        isDefault: cardForm.isDefault,
      }

      const isEdit = Boolean(cardForm.id)
      const response = await fetch(
        isEdit ? `/api/account/cards/${cardForm.id}` : '/api/account/cards',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      const data = await response.json()
      if (!response.ok) {
        alert(data.error || 'Erro ao salvar cartao')
        return
      }

      if (isEdit) {
        setCards((prev) =>
          prev.map((card) =>
            card.id === data.card.id ? data.card : data.card.isDefault ? { ...card, isDefault: false } : card
          )
        )
      } else {
        setCards((prev) => {
          const normalized = data.card.isDefault
            ? prev.map((card) => ({ ...card, isDefault: false }))
            : prev
          return [data.card, ...normalized]
        })
      }

      resetCardForm()
    } catch (error) {
      alert('Erro ao salvar cartao')
    }
  }

  const handleCardEdit = (card: SavedCard) => {
    setCardForm({
      id: card.id,
      label: card.label,
      holderName: card.holderName,
      brand: card.brand,
      last4: card.last4,
      expiryMonth: String(card.expiryMonth),
      expiryYear: String(card.expiryYear),
      documentNumber: card.documentNumber || '',
      isDefault: card.isDefault,
    })
  }

  const handleCardDelete = async (cardId: string) => {
    if (!confirm('Remover este cartao salvo?')) return
    try {
      const response = await fetch(`/api/account/cards/${cardId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Erro ao remover cartao')
        return
      }
      setCards((prev) => prev.filter((card) => card.id !== cardId))
      if (cardForm.id === cardId) {
        resetCardForm()
      }
    } catch (error) {
      alert('Erro ao remover cartao')
    }
  }

  const handleSetDefaultCard = async (card: SavedCard) => {
    try {
      const response = await fetch(`/api/account/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })
      const data = await response.json()
      if (!response.ok) {
        alert(data.error || 'Erro ao definir cartao padrao')
        return
      }
      setCards((prev) =>
        prev.map((item) => ({
          ...item,
          isDefault: item.id === data.card.id,
        }))
      )
    } catch (error) {
      alert('Erro ao definir cartao padrao')
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

  const getAppointmentStatusText = (status: AppointmentHistory['status']) => {
    const statusMap = {
      pending: 'Pendente',
      scheduled: 'Agendado',
      confirmed: 'Confirmado',
      completed: 'Concluido',
      cancelled: 'Cancelado',
    }
    return statusMap[status] || status
  }

  const getAppointmentStatusColor = (status: AppointmentHistory['status']) => {
    if (status === 'completed') return 'bg-green-100 text-green-700'
    if (status === 'cancelled') return 'bg-red-100 text-red-700'
    if (status === 'confirmed') return 'bg-emerald-100 text-emerald-700'
    if (status === 'pending') return 'bg-amber-100 text-amber-700'
    return 'bg-blue-100 text-blue-700'
  }

  const isAppointmentDepositApproved = (appointment: AppointmentHistory) =>
    Boolean(appointment.depositApproved) ||
    String(appointment.paymentStatus || '').toUpperCase() === 'APPROVED'

  const canPayAppointmentDeposit = (appointment: AppointmentHistory) =>
    ['pending', 'scheduled'].includes(appointment.status) &&
    !isAppointmentDepositApproved(appointment)

  const getAppointmentConfirmationText = (appointment: AppointmentHistory) => {
    if (!['pending', 'scheduled', 'confirmed'].includes(appointment.status)) return null
    if (appointment.clientConfirmedAt) {
      return `Presenca confirmada em ${new Date(
        appointment.clientConfirmedAt
      ).toLocaleString('pt-BR')}`
    }
    if (!isAppointmentDepositApproved(appointment)) {
      return 'Realize o pagamento do adiantamento de R$ 50,00 para liberar a confirmacao do agendamento.'
    }
    if (appointment.confirmationDeadlineAt) {
      return `Confirme ate ${new Date(appointment.confirmationDeadlineAt).toLocaleString(
        'pt-BR'
      )} para manter o horario reservado.`
    }
    return null
  }

  const getAppointmentConfirmationColor = (appointment: AppointmentHistory) => {
    if (appointment.clientConfirmedAt) return 'text-green-700'
    if (!isAppointmentDepositApproved(appointment)) return 'text-amber-700'
    if (!['pending', 'scheduled'].includes(appointment.status)) return 'text-muted-foreground'
    return 'text-amber-700'
  }

  const toggleAppointmentDetails = (appointmentId: string) => {
    setExpandedAppointmentDetails((prev) => ({
      ...prev,
      [appointmentId]: !prev[appointmentId],
    }))
  }

  const sidebarButtonClass = (isActive: boolean) =>
    `w-full py-3 px-4 rounded-xl font-semibold flex items-center gap-3 transition-all ${
      isActive
        ? 'bg-gradient-to-r from-[#3856da] to-[#5173ef] text-white shadow-[0_12px_24px_-16px_rgba(49,70,170,0.8)]'
        : 'text-slate-700 hover:bg-[#eaf0ff] hover:text-[#2f46c1]'
    }`

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#e8f0ff_0,_#d8e3ff_45%,_#e6defd_100%)] px-2 py-3 md:px-5 md:py-5">
      <div className="mx-auto max-w-[1500px] rounded-[28px] border border-white/70 bg-gradient-to-br from-[#d8e5ff] via-[#dbe7ff] to-[#e7dfff] p-3 shadow-[0_32px_70px_-36px_rgba(32,36,64,0.75)] md:p-4">
        <header className="mb-4 rounded-2xl border border-white/60 bg-white/55 px-4 py-4 backdrop-blur-sm md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:text-[#2f46c1]"
              >
                Voltar ao Site
              </Link>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Area do Cliente
                </p>
                <h1 className="font-display text-xl font-bold text-slate-900">Minha Conta</h1>
              </div>
            </div>
            <div className="flex w-full items-center gap-3 md:w-auto">
              <div className="flex w-full items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm md:w-80">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar pedido, agendamento..."
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm"
                title="Notificacoes"
              >
                <Bell className="h-4 w-4" />
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:text-[#2f46c1]"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-2xl border border-white/70 bg-white/80 p-5 backdrop-blur-sm">
            <div className="mb-6 rounded-xl bg-gradient-to-r from-[#3247d3] via-[#4d65e7] to-[#2995da] px-4 py-4 text-white shadow-[0_18px_35px_-24px_rgba(36,56,155,0.9)]">
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/25">
                <User className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold">{session.user?.name || 'Cliente'}</p>
              <p className="truncate text-xs opacity-90">{session.user?.email}</p>
            </div>

            <nav className="space-y-2">
              {session.user?.role === 'admin' && (
                <button
                  onClick={() => {
                    setActiveTab('admin')
                    setAdminSection('dashboard')
                  }}
                  className={sidebarButtonClass(activeTab === 'admin')}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Painel Admin
                </button>
              )}
              <button
                onClick={() => setActiveTab('orders')}
                className={sidebarButtonClass(activeTab === 'orders')}
              >
                <ShoppingBag className="h-5 w-5" />
                Meus Pedidos
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={sidebarButtonClass(activeTab === 'profile')}
              >
                <User className="h-5 w-5" />
                Perfil
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className={sidebarButtonClass(activeTab === 'appointments')}
              >
                <Clock className="h-5 w-5" />
                Agendamentos
              </button>
              <button
                onClick={() => setActiveTab('cards')}
                className={sidebarButtonClass(activeTab === 'cards')}
              >
                <CreditCard className="h-5 w-5" />
                Cartoes salvos
              </button>
              <button
                onClick={() => setActiveTab('addresses')}
                className={sidebarButtonClass(activeTab === 'addresses')}
              >
                <MapPin className="h-5 w-5" />
                Enderecos
              </button>
            </nav>
          </aside>

          <div className="rounded-2xl border border-white/70 bg-white/70 p-4 backdrop-blur-sm md:p-5">
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

            {activeTab === 'appointments' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-md p-6">
                  <h2 className="font-display font-bold text-2xl text-foreground mb-4">
                    Historico de Agendamentos
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Confirme sua presenca dentro do prazo para manter o horario reservado.
                  </p>
                </div>

                {appointmentActionError ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                    {appointmentActionError}
                  </div>
                ) : null}
                {appointmentActionSuccess ? (
                  <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
                    {appointmentActionSuccess}
                  </div>
                ) : null}

                {appointmentsLoading ? (
                  <div className="bg-white rounded-2xl shadow-md p-6 text-muted-foreground">
                    Carregando agendamentos...
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-md p-6 text-muted-foreground">
                    Nenhum agendamento encontrado.
                  </div>
                ) : (
                  appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="bg-white rounded-2xl shadow-md p-6 space-y-3"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">
                            {appointment.serviceName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(appointment.scheduledAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <span
                          className={`inline-flex w-fit px-3 py-1 rounded-full text-xs font-semibold ${getAppointmentStatusColor(appointment.status)}`}
                        >
                          {getAppointmentStatusText(appointment.status)}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Valor: R$ {appointment.totalPrice.toFixed(2).replace('.', ',')}
                        {appointment.paymentMethod ? ` • Pagamento: ${appointment.paymentMethod}` : ''}
                      </div>
                      <div
                        className={`rounded-xl border px-4 py-3 text-sm ${
                          isAppointmentDepositApproved(appointment)
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : 'border-amber-200 bg-amber-50 text-amber-800'
                        }`}
                      >
                        {isAppointmentDepositApproved(appointment)
                          ? 'Adiantamento de R$ 50,00 aprovado. Agora voce pode confirmar o agendamento.'
                          : 'Para confirmar o agendamento, realize o pagamento do adiantamento de R$ 50,00 pelo Mercado Pago.'}
                      </div>
                      {getAppointmentConfirmationText(appointment) ? (
                        <p
                          className={`text-sm font-medium ${getAppointmentConfirmationColor(appointment)}`}
                        >
                          {getAppointmentConfirmationText(appointment)}
                        </p>
                      ) : null}
                      {appointment.notes ? (
                        <p className="text-sm text-muted-foreground">
                          Observacao: {appointment.notes}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => toggleAppointmentDetails(appointment.id)}
                          className="px-4 py-2 rounded-lg border border-pink-200 text-primary text-sm font-semibold hover:bg-pink-50"
                        >
                          {expandedAppointmentDetails[appointment.id]
                            ? 'Ocultar detalhes'
                            : 'Ver detalhes'}
                        </button>
                        {canPayAppointmentDeposit(appointment) ? (
                          <button
                            type="button"
                            onClick={() => {
                              setAppointmentPaymentError('')
                              setAppointmentPaymentId((current) =>
                                current === appointment.id ? null : appointment.id
                              )
                            }}
                            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90"
                          >
                            {appointmentPaymentId === appointment.id
                              ? 'Ocultar pagamento'
                              : 'Realizar pagamento do adiantamento'}
                          </button>
                        ) : null}
                      </div>
                      {appointmentPaymentId === appointment.id ? (
                        <div className="rounded-xl border border-pink-100 bg-white p-4 space-y-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              Adiantamento do serviço
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Valor a pagar agora: R$ 50,00. O restante fica para o atendimento.
                            </p>
                          </div>
                          {appointmentPaymentError ? (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                              {appointmentPaymentError}
                            </div>
                          ) : null}
                          <MercadoPagoTransparentCard
                            order={{
                              id: appointment.id,
                              orderNumber: appointment.id,
                              total: 50,
                            }}
                            paymentEndpoint="/api/payments/mercadopago/appointment-deposit"
                            extraPayload={{ appointmentId: appointment.id }}
                            payerEmail={
                              appointment.questionnaireData?.email ||
                              appointment.customerEmail ||
                              session?.user?.email ||
                              ''
                            }
                            payerProfile={{
                              name:
                                appointment.questionnaireData?.name ||
                                appointment.customerName ||
                                session?.user?.name ||
                                '',
                              email:
                                appointment.questionnaireData?.email ||
                                appointment.customerEmail ||
                                session?.user?.email ||
                                '',
                              cpf: profileCpf || undefined,
                              phone:
                                appointment.questionnaireData?.phone ||
                                appointment.customerPhone ||
                                undefined,
                            }}
                            onSuccess={async () => {
                              setAppointmentPaymentError('')
                              setAppointmentActionSuccess(
                                'Adiantamento aprovado. Agora confirme seu agendamento.'
                              )
                              setAppointmentPaymentId(null)
                              await loadAppointments()
                            }}
                            onPending={async () => {
                              setAppointmentPaymentError('')
                              setAppointmentActionSuccess(
                                'Pagamento gerado no Mercado Pago. Assim que for aprovado, o botao de confirmacao sera liberado.'
                              )
                              await loadAppointments()
                            }}
                            onError={setAppointmentPaymentError}
                          />
                        </div>
                      ) : null}
                      {expandedAppointmentDetails[appointment.id] ? (
                        <div className="rounded-xl border border-pink-100 bg-pink-50/40 p-4 space-y-4">
                          <div>
                            <p className="text-sm font-semibold text-foreground mb-2">
                              Dados do atendimento (chatbot)
                            </p>
                            {appointment.questionnaireData ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <p>
                                  <span className="font-semibold">Nome:</span>{' '}
                                  {appointment.questionnaireData.name || 'Nao informado'}
                                </p>
                                <p>
                                  <span className="font-semibold">Telefone:</span>{' '}
                                  {appointment.questionnaireData.phone ||
                                    appointment.customerPhone ||
                                    'Nao informado'}
                                </p>
                                <p>
                                  <span className="font-semibold">E-mail:</span>{' '}
                                  {appointment.questionnaireData.email || 'Nao informado'}
                                </p>
                                <p>
                                  <span className="font-semibold">Idade:</span>{' '}
                                  {appointment.questionnaireData.age || 'Nao informado'}
                                </p>
                                <p>
                                  <span className="font-semibold">Alergias:</span>{' '}
                                  {appointment.questionnaireData.allergies ||
                                    'Nao informado'}
                                </p>
                                <p>
                                  <span className="font-semibold">Historico mega hair:</span>{' '}
                                  {appointment.questionnaireData.megaHairHistory ||
                                    'Nao informado'}
                                </p>
                                <p>
                                  <span className="font-semibold">Tipo de cabelo:</span>{' '}
                                  {appointment.questionnaireData.hairType ||
                                    'Nao informado'}
                                </p>
                                <p>
                                  <span className="font-semibold">Cor do cabelo:</span>{' '}
                                  {appointment.questionnaireData.hairColor ||
                                    'Nao informado'}
                                </p>
                                <p>
                                  <span className="font-semibold">Estado do cabelo:</span>{' '}
                                  {appointment.questionnaireData.hairState ||
                                    'Nao informado'}
                                </p>
	                                <p>
	                                  <span className="font-semibold">Metodos usados:</span>{' '}
	                                  {appointment.questionnaireData.methods ||
	                                    'Nao informado'}
	                                </p>
	                                <p>
	                                  <span className="font-semibold">Categoria principal:</span>{' '}
	                                  {appointment.questionnaireData.primaryCategory ||
	                                    'Nao informado'}
	                                </p>
	                                <p>
	                                  <span className="font-semibold">Tipo de manutencao:</span>{' '}
	                                  {appointment.questionnaireData.maintenanceType ||
	                                    'Nao informado'}
	                                </p>
	                                <p>
	                                  <span className="font-semibold">Valor base manutencao:</span>{' '}
	                                  {appointment.questionnaireData.maintenanceBasePrice ||
	                                    'Nao informado'}
	                                </p>
	                                <p>
	                                  <span className="font-semibold">Situacao do cabelo:</span>{' '}
	                                  {appointment.questionnaireData.hairSituation ||
	                                    'Nao informado'}
	                                </p>
	                                <p>
	                                  <span className="font-semibold">Servicos adicionais:</span>{' '}
	                                  {appointment.questionnaireData.additionalServices ||
	                                    'Nenhum'}
	                                </p>
	                                <p>
	                                  <span className="font-semibold">Kit de manutencao:</span>{' '}
	                                  {appointment.questionnaireData.maintenanceKit ||
	                                    'Nao incluido'}
	                                </p>
	                                <p>
	                                  <span className="font-semibold">Observacao:</span>{' '}
	                                  {appointment.questionnaireData.cleanHairObservation ||
	                                    'Nao informado'}
	                                </p>
	                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                Sem respostas detalhadas registradas.
                              </p>
                            )}
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-foreground mb-2">
                              Antes e Depois
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                  Antes
                                </p>
                                {appointment.beforeImageUrl ? (
                                  <img
                                    src={appointment.beforeImageUrl}
                                    alt="Antes do procedimento"
                                    className="w-full h-48 object-cover rounded-lg border border-pink-100"
                                  />
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    Imagem ainda nao adicionada.
                                  </p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                  Depois
                                </p>
                                {appointment.afterImageUrl ? (
                                  <img
                                    src={appointment.afterImageUrl}
                                    alt="Depois do procedimento"
                                    className="w-full h-48 object-cover rounded-lg border border-pink-100"
                                  />
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    Imagem ainda nao adicionada.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-foreground mb-2">
                              Manutencoes registradas
                            </p>
                            {appointment.maintenanceHistory &&
                            appointment.maintenanceHistory.length > 0 ? (
                              <div className="space-y-2">
                                {appointment.maintenanceHistory.map((maintenance) => (
                                  <div
                                    key={maintenance.id}
                                    className="rounded-lg border border-pink-100 bg-white p-3"
                                  >
                                    <p className="text-sm font-semibold text-foreground">
                                      {new Date(maintenance.date).toLocaleDateString('pt-BR')}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {maintenance.notes || 'Sem observacoes'}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                Nenhuma manutencao registrada ate o momento.
                              </p>
                            )}
                          </div>
                        </div>
                      ) : null}
                      {['pending', 'scheduled'].includes(appointment.status) && (
                        <div className="flex flex-wrap gap-2">
                          {appointment.canConfirmFromClient ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleAppointmentAction(appointment.id, 'confirm')
                              }
                              disabled={appointmentActionId === appointment.id}
                              className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
                            >
                              {appointmentActionId === appointment.id
                                ? 'Processando...'
                                : 'Confirmar presenca'}
                            </button>
                          ) : !appointment.clientConfirmedAt ? (
                            <span className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700">
                              {isAppointmentDepositApproved(appointment)
                                ? 'Prazo de confirmacao expirado. O horario pode ser liberado.'
                                : 'Pague o adiantamento para liberar o botao de confirmacao.'}
                            </span>
                          ) : null}

                          {appointment.canCancelFromClient ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  confirm(
                                    'Deseja cancelar este agendamento e liberar o horario para outra cliente?'
                                  )
                                ) {
                                  void handleAppointmentAction(appointment.id, 'cancel')
                                }
                              }}
                              disabled={appointmentActionId === appointment.id}
                              className="px-4 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 disabled:opacity-60"
                            >
                              {appointmentActionId === appointment.id
                                ? 'Processando...'
                                : 'Cancelar agendamento'}
                            </button>
                          ) : null}
                        </div>
                      )}
                      {appointment.googleCalendarUrl ? (
                        <a
                          href={appointment.googleCalendarUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex text-sm font-semibold text-primary hover:underline"
                        >
                          Adicionar ao Google Agenda
                        </a>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'cards' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-md p-6">
                  <h2 className="font-display font-bold text-2xl text-foreground mb-4">
                    Cartoes Salvos
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Salve cartoes para agilizar a finalizacao da compra.
                  </p>
                </div>

                <div className="bg-white rounded-2xl shadow-md p-6">
                  <h3 className="font-display font-bold text-xl text-foreground mb-4">
                    {cardForm.id ? 'Editar cartao' : 'Adicionar cartao'}
                  </h3>
                  <form onSubmit={handleCardSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Apelido</label>
                        <input
                          value={cardForm.label}
                          onChange={(event) =>
                            setCardForm((prev) => ({ ...prev, label: event.target.value }))
                          }
                          required
                          className="w-full px-4 py-3 border border-pink-200 rounded-lg"
                          placeholder="Cartao principal"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Bandeira</label>
                        <input
                          value={cardForm.brand}
                          onChange={(event) =>
                            setCardForm((prev) => ({ ...prev, brand: event.target.value }))
                          }
                          required
                          className="w-full px-4 py-3 border border-pink-200 rounded-lg"
                          placeholder="Visa, Master..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Titular</label>
                        <input
                          value={cardForm.holderName}
                          onChange={(event) =>
                            setCardForm((prev) => ({
                              ...prev,
                              holderName: event.target.value,
                            }))
                          }
                          required
                          className="w-full px-4 py-3 border border-pink-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Ultimos 4 digitos</label>
                        <input
                          value={cardForm.last4}
                          onChange={(event) =>
                            setCardForm((prev) => ({
                              ...prev,
                              last4: event.target.value.replace(/\D/g, '').slice(0, 4),
                            }))
                          }
                          required
                          className="w-full px-4 py-3 border border-pink-200 rounded-lg"
                          placeholder="1234"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Mes validade</label>
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={cardForm.expiryMonth}
                          onChange={(event) =>
                            setCardForm((prev) => ({
                              ...prev,
                              expiryMonth: event.target.value,
                            }))
                          }
                          required
                          className="w-full px-4 py-3 border border-pink-200 rounded-lg"
                          placeholder="11"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Ano validade</label>
                        <input
                          type="number"
                          min={new Date().getFullYear()}
                          value={cardForm.expiryYear}
                          onChange={(event) =>
                            setCardForm((prev) => ({
                              ...prev,
                              expiryYear: event.target.value,
                            }))
                          }
                          required
                          className="w-full px-4 py-3 border border-pink-200 rounded-lg"
                          placeholder="2030"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">CPF do titular</label>
                      <input
                        value={cardForm.documentNumber}
                        onChange={(event) =>
                          setCardForm((prev) => ({
                            ...prev,
                            documentNumber: event.target.value.replace(/\D/g, '').slice(0, 11),
                          }))
                        }
                        className="w-full px-4 py-3 border border-pink-200 rounded-lg"
                        placeholder="Somente numeros"
                      />
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={cardForm.isDefault}
                        onChange={(event) =>
                          setCardForm((prev) => ({ ...prev, isDefault: event.target.checked }))
                        }
                        className="accent-primary"
                      />
                      Definir como cartao padrao
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        className="px-6 py-3 bg-primary text-white rounded-xl font-semibold"
                      >
                        {cardForm.id ? 'Salvar cartao' : 'Adicionar cartao'}
                      </button>
                      {cardForm.id && (
                        <button
                          type="button"
                          onClick={resetCardForm}
                          className="px-6 py-3 border border-pink-200 rounded-xl font-semibold text-muted-foreground"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div className="bg-white rounded-2xl shadow-md p-6">
                  <h3 className="font-display font-bold text-xl text-foreground mb-4">
                    Meus cartoes
                  </h3>
                  {cardsLoading ? (
                    <p className="text-muted-foreground">Carregando cartoes...</p>
                  ) : cards.length === 0 ? (
                    <p className="text-muted-foreground">Nenhum cartao salvo.</p>
                  ) : (
                    <div className="space-y-3">
                      {cards.map((card) => (
                        <div
                          key={card.id}
                          className="border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                        >
                          <div>
                            <p className="font-semibold text-foreground">
                              {card.label} {card.isDefault ? '(Padrao)' : ''}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {card.brand} • **** {card.last4} • {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}
                            </p>
                            <p className="text-xs text-muted-foreground">{card.holderName}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {!card.isDefault && (
                              <button
                                type="button"
                                onClick={() => handleSetDefaultCard(card)}
                                className="px-4 py-2 text-sm rounded-lg border border-pink-200 text-primary"
                              >
                                Definir padrao
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleCardEdit(card)}
                              className="px-4 py-2 text-sm rounded-lg border border-pink-200 text-primary"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCardDelete(card.id)}
                              className="px-4 py-2 text-sm rounded-lg border border-red-200 text-red-600"
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
            )}

            {activeTab === 'admin' && session.user?.role === 'admin' && (
              <div className="space-y-6">
                {adminSection === 'dashboard' ? (
                  <div className="space-y-5 rounded-2xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_40px_-28px_rgba(31,41,55,0.6)] md:p-6">
                    <div className="grid gap-4 md:grid-cols-3">
                      {[
                        {
                          label: 'Gestao de loja',
                          value: '10',
                          detail: 'modulos administrativos',
                          color: 'from-[#4668ff] to-[#22a9e6]',
                        },
                        {
                          label: 'Operacao',
                          value: '24h',
                          detail: 'acompanhamento de pedidos',
                          color: 'from-[#fb5c8f] to-[#f8895d]',
                        },
                        {
                          label: 'Atendimento',
                          value: 'Ativo',
                          detail: 'agendamentos e clientes',
                          color: 'from-[#22b8cf] to-[#3f67f5]',
                        },
                      ].map((metric) => (
                        <div
                          key={metric.label}
                          className="rounded-xl border border-[#d8e3ff] bg-gradient-to-b from-white to-[#f8faff] p-4"
                        >
                          <div className="mb-2 flex items-center gap-3">
                            <div
                              className={`h-10 w-10 rounded-full bg-gradient-to-br ${metric.color}`}
                            />
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                {metric.label}
                              </p>
                              <p className="font-display text-2xl font-bold text-slate-800">
                                {metric.value}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600">{metric.detail}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <h2 className="font-display text-2xl font-bold text-slate-900">
                        Painel Administrativo
                      </h2>
                      <p className="text-sm text-slate-500">
                        Visual moderno com acesso rapido as areas de gestao.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {[
                        {
                          key: 'products',
                          title: 'Produtos',
                          description: 'Gerencie catálogo, estoque e destaque.',
                        },
                        {
                          key: 'categories',
                          title: 'Categorias',
                          description: 'Organize categorias e ordem de exibição.',
                        },
                        {
                          key: 'orders',
                          title: 'Pedidos',
                          description: 'Atualize status, pagamentos e rastreio.',
                        },
                        {
                          key: 'customers',
                          title: 'Clientes',
                          description: 'Gerencie contas, cadastros e acesso.',
                        },
                        {
                          key: 'homeModules',
                          title: 'Pagina Inicial',
                          description: 'Ative modulos e personalize a ordem da home.',
                        },
                        {
                          key: 'internalPages',
                          title: 'Paginas Internas',
                          description: 'Edite promocoes, servicos e paginas de conteudo.',
                        },
                        {
                          key: 'chatbotConfig',
                          title: 'Chatbot e Agenda',
                          description: 'Configure fluxos, servicos, FAQ, midias e horarios.',
                        },
                        {
                          key: 'appointments',
                          title: 'Agendamentos',
                          description: 'Gerencie horarios, confirmacoes e cancelamentos.',
                        },
                        {
                          key: 'shipping',
                          title: 'Frete',
                          description: 'Defina regras por CEP, categoria e produto.',
                        },
                        {
                          key: 'reviews',
                          title: 'Comentarios',
                          description: 'Modere avaliacoes e comentarios da loja.',
                        },
                        {
                          key: 'backup',
                          title: 'Backup',
                          description: 'Exporte backup manual do banco de dados.',
                        },
                      ].map((card) => (
                        <button
                          key={card.key}
                          onClick={() => setAdminSection(card.key as typeof adminSection)}
                          className="group text-left rounded-xl border border-[#d8e3ff] bg-gradient-to-b from-white to-[#f8faff] p-5 shadow-[0_14px_35px_-25px_rgba(31,41,55,0.55)] transition hover:-translate-y-0.5 hover:border-[#9cb3ff]"
                        >
                          <h3 className="mb-2 font-display text-lg font-bold text-slate-800">
                            {card.title}
                          </h3>
                          <p className="text-sm text-slate-600">{card.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display font-bold text-2xl text-slate-900">
                        Painel Administrativo
                      </h2>
                      <button
                        onClick={() => setAdminSection('dashboard')}
                        className="rounded-full border border-[#ccd9ff] bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-[#9cb3ff]"
                      >
                        Voltar ao painel
                      </button>
                    </div>
                    {adminSection === 'products' && <AdminProducts />}
                    {adminSection === 'categories' && <AdminCategories />}
                    {adminSection === 'orders' && <AdminOrders />}
                    {adminSection === 'customers' && <AdminCustomers />}
                    {adminSection === 'homeModules' && <AdminHomeModules />}
                    {adminSection === 'internalPages' && <AdminInternalPages />}
                    {adminSection === 'chatbotConfig' && <AdminChatbotConfig />}
                    {adminSection === 'appointments' && <AdminAppointments />}
                    {adminSection === 'shipping' && <AdminShipping />}
                    {adminSection === 'reviews' && <AdminReviews />}
                    {adminSection === 'backup' && <AdminBackup />}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
