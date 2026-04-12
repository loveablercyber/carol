import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { db } from '@/lib/db'
import {
  getShippingSettings,
  saveShippingSettings,
  ShippingRuleScope,
} from '@/lib/shipping-config-store'

async function ensureAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'admin') {
    return null
  }
  return session
}

function normalizeScope(value: unknown): ShippingRuleScope {
  return value === 'PRODUCT' ? 'PRODUCT' : 'CATEGORY'
}

export async function GET() {
  try {
    const session = await ensureAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const [settings, categories, products] = await Promise.all([
      getShippingSettings(),
      db.category.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true },
      }),
      db.product.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          categoryId: true,
          category: {
            select: { name: true },
          },
        },
      }),
    ])

    return NextResponse.json({
      settings,
      catalogs: {
        categories,
        products,
      },
    })
  } catch (error) {
    console.error('Erro ao buscar configuracoes de frete:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar configuracoes de frete' },
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
    const rawConfig = body?.config || {}
    const rawRules = Array.isArray(body?.rules) ? body.rules : []

    const config = {
      originZipCode: String(rawConfig.originZipCode || '').replace(/\D/g, '').slice(0, 8),
      defaultCost: Number(rawConfig.defaultCost || 0),
      expressMultiplier: Number(rawConfig.expressMultiplier || 2.5),
      freeShippingMin: Number(rawConfig.freeShippingMin || 300),
      enableCorreios: Boolean(rawConfig.enableCorreios),
    }

    const rules = rawRules
      .map((rule: any) => ({
        id: typeof rule.id === 'string' ? rule.id : undefined,
        scope: normalizeScope(rule.scope),
        targetId: String(rule.targetId || ''),
        targetLabel: typeof rule.targetLabel === 'string' ? rule.targetLabel : null,
        fixedCost: Number(rule.fixedCost || 0),
        deliveryDays: Number(rule.deliveryDays || 7),
        isActive: Boolean(rule.isActive),
      }))
      .filter((rule: any) => rule.targetId)

    const settings = await saveShippingSettings({ config, rules })
    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Erro ao salvar configuracoes de frete:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar configuracoes de frete' },
      { status: 500 }
    )
  }
}

