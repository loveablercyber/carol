import { NextResponse } from 'next/server'
import { getPublicChatbotConfig } from '@/lib/admin-config-store'

export async function GET() {
  try {
    const config = await getPublicChatbotConfig()
    return NextResponse.json({ config })
  } catch (error) {
    console.error('Erro ao carregar configuracao publica do chatbot:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar configuracao do chatbot' },
      { status: 500 }
    )
  }
}
