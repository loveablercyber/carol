import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import {
  getDonationCampaignSnapshot,
  saveDonationCampaignConfig,
  type DonationCampaignConfig,
} from '@/lib/donation-campaign-store'

async function ensureAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'admin') return null
  return session
}

export async function GET() {
  try {
    const session = await ensureAdmin()
    if (!session) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    const campaign = await getDonationCampaignSnapshot()
    return NextResponse.json({ campaign })
  } catch (error) {
    console.error('Erro ao buscar configuracao da doacao:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar configuracao da doacao' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await ensureAdmin()
    if (!session) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    const body = (await request.json().catch(() => ({}))) as Partial<DonationCampaignConfig>
    const campaign = await saveDonationCampaignConfig(body)
    return NextResponse.json({ campaign })
  } catch (error) {
    console.error('Erro ao salvar configuracao da doacao:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar configuracao da doacao' },
      { status: 500 }
    )
  }
}
