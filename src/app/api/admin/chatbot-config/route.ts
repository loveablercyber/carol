import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import {
  getAdminOperationalConfig,
  saveAdminOperationalConfig,
} from '@/lib/admin-config-store'

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
