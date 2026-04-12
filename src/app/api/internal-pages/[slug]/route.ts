import { NextResponse } from 'next/server'
import { getInternalPage } from '@/lib/internal-pages-store'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const page = await getInternalPage(slug)
    if (!page) {
      return NextResponse.json({ error: 'Pagina interna nao encontrada.' }, { status: 404 })
    }

    return NextResponse.json({ page })
  } catch (error) {
    console.error('Erro ao buscar pagina interna:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar pagina interna.' },
      { status: 500 }
    )
  }
}

