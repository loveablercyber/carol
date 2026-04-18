import { NextRequest, NextResponse } from 'next/server'
import { getDonationCampaignSnapshot } from '@/lib/donation-campaign-store'

export async function GET(_request: NextRequest) {
  try {
    const snapshot = await getDonationCampaignSnapshot()
    const campaign = {
      ...snapshot,
      hairOptions: snapshot.hairOptions.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        color: item.color,
        length: item.length,
        observations: item.observations,
        imageUrl: item.imageUrl,
        status: item.status,
        order: item.order,
        active: item.active,
      })),
    }
    return NextResponse.json({ campaign })
  } catch (error) {
    console.error('Erro ao buscar campanha de doacao:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar campanha de doacao' },
      { status: 500 }
    )
  }
}
