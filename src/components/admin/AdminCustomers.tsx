"use client"

import { useEffect, useState } from 'react'
import { toast } from '@/hooks/use-toast'

interface Customer {
  id: string
  name?: string | null
  email: string
  role: string
  cpf?: string | null
  birthday?: string | null
  createdAt: string
  ordersCount: number
  addressesCount: number
}

const initialForm = {
  name: '',
  email: '',
  password: '',
  role: 'customer',
  cpf: '',
  birthday: '',
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(initialForm)
  const [search, setSearch] = useState('')

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const response = await fetch(`/api/admin/customers?${params.toString()}`)
      const data = await response.json()
      setCustomers(data.customers || [])
    } catch (error) {
      toast({
        title: 'Erro ao carregar clientes',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setForm(initialForm)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)

    try {
      const payload: Record<string, any> = {
        name: form.name || null,
        email: form.email,
        role: form.role,
        cpf: form.cpf || null,
        birthday: form.birthday || null,
      }

      if (form.password) {
        payload.password = form.password
      }

      const response = await fetch(
        editingId ? `/api/admin/customers/${editingId}` : '/api/admin/customers',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar cliente')
      }

      toast({
        title: editingId ? 'Cliente atualizado' : 'Cliente criado',
      })
      resetForm()
      fetchCustomers()
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar cliente',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id)
    setForm({
      name: customer.name || '',
      email: customer.email,
      password: '',
      role: customer.role || 'customer',
      cpf: customer.cpf || '',
      birthday: customer.birthday
        ? new Date(customer.birthday).toISOString().split('T')[0]
        : '',
    })
  }

  const handleDelete = async (customerId: string) => {
    if (!confirm('Deseja remover esta conta?')) return
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao remover cliente')
      }

      toast({ title: 'Cliente removido' })
      setCustomers((prev) => prev.filter((customer) => customer.id !== customerId))
    } catch (error: any) {
      toast({
        title: 'Erro ao remover cliente',
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="font-display font-bold text-xl text-foreground">
            {editingId ? 'Editar cliente' : 'Novo cliente'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm rounded-lg border border-pink-200 text-muted-foreground"
            >
              Cancelar edição
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Nome</label>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Email *</label>
            <input
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              required
              type="email"
              className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Senha {editingId ? '(opcional)' : '*'}</label>
            <input
              value={form.password}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, password: event.target.value }))
              }
              required={!editingId}
              type="password"
              className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Perfil</label>
            <select
              value={form.role}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, role: event.target.value }))
              }
              className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
            >
              <option value="customer">Cliente</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">CPF</label>
            <input
              value={form.cpf}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, cpf: event.target.value }))
              }
              className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Data de nascimento</label>
            <input
              type="date"
              value={form.birthday}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, birthday: event.target.value }))
              }
              className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-primary text-white rounded-xl font-semibold disabled:opacity-60"
        >
          {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar cliente'}
        </button>
      </form>

      <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-xl text-foreground">
              Clientes cadastrados
            </h2>
            <p className="text-sm text-muted-foreground">
              Total: {customers.length} clientes
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, email ou CPF"
              className="px-4 py-2 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
            />
            <button
              onClick={fetchCustomers}
              className="px-4 py-2 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200"
            >
              Buscar
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Carregando clientes...</p>
        ) : customers.length === 0 ? (
          <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
        ) : (
          <div className="space-y-3">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {customer.name || 'Cliente sem nome'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {customer.email} • {customer.role === 'admin' ? 'Administrador' : 'Cliente'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pedidos: {customer.ordersCount} • Endereços: {customer.addressesCount}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleEdit(customer)}
                    className="px-4 py-2 text-sm rounded-lg border border-pink-200 text-primary hover:border-pink-400"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(customer.id)}
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
