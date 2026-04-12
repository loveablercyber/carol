import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getAllInternalPages, saveInternalPages } from '@/lib/internal-pages-store'

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

    const pages = await getAllInternalPages()
    return NextResponse.json({ pages })
  } catch (error) {
    console.error('Erro ao buscar paginas internas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar paginas internas' },
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
    const pages = Array.isArray(body?.pages) ? body.pages : []
    if (pages.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma pagina enviada para atualizacao.' },
        { status: 400 }
      )
    }

    const updated = await saveInternalPages(pages)
    return NextResponse.json({ pages: updated })
  } catch (error) {
    console.error('Erro ao atualizar paginas internas:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar paginas internas' },
      { status: 500 }
    )
  }
}

