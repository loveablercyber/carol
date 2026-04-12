import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getAllHomeModules, saveHomeModules } from '@/lib/home-modules-store'

const ensureAdmin = async () => {
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

    const modules = await getAllHomeModules()
    return NextResponse.json({ modules })
  } catch (error) {
    console.error('Erro ao buscar modulos da home:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar modulos da home' },
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
    const modules = Array.isArray(body?.modules) ? body.modules : []

    if (modules.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum modulo enviado para atualizacao.' },
        { status: 400 }
      )
    }

    const updated = await saveHomeModules(modules)
    return NextResponse.json({ modules: updated })
  } catch (error) {
    console.error('Erro ao atualizar modulos da home:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar modulos da home' },
      { status: 500 }
    )
  }
}

