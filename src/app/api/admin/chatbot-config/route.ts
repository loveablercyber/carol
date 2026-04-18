import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import {
  getAdminOperationalConfig,
  saveAdminOperationalConfig,
} from '@/lib/admin-config-store'

const ARRAY_SECTIONS = [
  'flowItems',
  'services',
  'beforeAfterItems',
  'videoItems',
  'faqItems',
] as const

type ArraySection = (typeof ARRAY_SECTIONS)[number]

function isArraySection(value: unknown): value is ArraySection {
  return typeof value === 'string' && ARRAY_SECTIONS.includes(value as ArraySection)
}

function reorderItems(items: any[]) {
  return items.map((item, index) => ({ ...item, order: index + 1 }))
}

async function ensureAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'admin') {
    return null
  }
  return session
}

export async function GET() {
  try {
    const session = await ensureAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const config = await getAdminOperationalConfig()
    return NextResponse.json({ config })
  } catch (error) {
    console.error('Erro ao carregar configuracao do chatbot:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar configuracao do chatbot' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await ensureAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const config = await saveAdminOperationalConfig(body?.config || body || {})
    return NextResponse.json({ config })
  } catch (error) {
    console.error('Erro ao salvar configuracao do chatbot:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar configuracao do chatbot' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await ensureAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const action = String(body?.action || '')
    const current = await getAdminOperationalConfig()

    if (action === 'update_item') {
      if (!isArraySection(body?.section)) {
        return NextResponse.json({ error: 'Seção inválida' }, { status: 400 })
      }

      const item = body?.item
      if (!item || typeof item !== 'object' || !String(item.id || '').trim()) {
        return NextResponse.json({ error: 'Item inválido' }, { status: 400 })
      }

      const section = body.section as ArraySection
      const currentItems = Array.isArray(current[section]) ? current[section] : []
      const exists = currentItems.some((entry: any) => entry.id === item.id)
      const nextItems = reorderItems(
        exists
          ? currentItems.map((entry: any) => (entry.id === item.id ? item : entry))
          : [...currentItems, item]
      )
      const config = await saveAdminOperationalConfig({ [section]: nextItems })
      return NextResponse.json({ config })
    }

    if (action === 'delete_item') {
      if (!isArraySection(body?.section)) {
        return NextResponse.json({ error: 'Seção inválida' }, { status: 400 })
      }

      const id = String(body?.id || '').trim()
      if (!id) {
        return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
      }

      const section = body.section as ArraySection
      const nextItems = reorderItems(
        (Array.isArray(current[section]) ? current[section] : []).filter(
          (entry: any) => entry.id !== id
        )
      )
      const config = await saveAdminOperationalConfig({ [section]: nextItems })
      return NextResponse.json({ config })
    }

    if (action === 'reorder_section') {
      if (!isArraySection(body?.section)) {
        return NextResponse.json({ error: 'Seção inválida' }, { status: 400 })
      }

      const section = body.section as ArraySection
      const items = Array.isArray(body?.items) ? body.items : []
      if (items.length === 0) {
        return NextResponse.json({ error: 'Lista vazia para reordenação' }, { status: 400 })
      }

      const config = await saveAdminOperationalConfig({ [section]: reorderItems(items) })
      return NextResponse.json({ config })
    }

    if (action === 'update_agenda') {
      const schedulingSettings = body?.schedulingSettings
      if (!schedulingSettings || typeof schedulingSettings !== 'object') {
        return NextResponse.json({ error: 'Configuração de agenda inválida' }, { status: 400 })
      }

      const config = await saveAdminOperationalConfig({ schedulingSettings })
      return NextResponse.json({ config })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (error) {
    console.error('Erro ao atualizar configuracao granular do chatbot:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar configuracao do chatbot' },
      { status: 500 }
    )
  }
}
