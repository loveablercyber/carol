import { NextResponse } from 'next/server'
import { getVisibleHomeModules } from '@/lib/home-modules-store'

export async function GET() {
  try {
    const modules = await getVisibleHomeModules()
    return NextResponse.json({ modules })
  } catch (error) {
    console.error('Erro ao carregar modulos da home:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar modulos da home' },
      { status: 500 }
    )
  }
}

