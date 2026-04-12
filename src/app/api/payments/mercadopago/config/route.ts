import { NextRequest, NextResponse } from 'next/server'
import { resolveMercadoPagoConfig } from '@/lib/mercadopago-config'

export async function GET(request: NextRequest) {
  try {
    const config = resolveMercadoPagoConfig({ requestOrigin: request.nextUrl.origin })

    return NextResponse.json({
      environment: config.env,
      publicKey: config.publicKey,
      testBuyerEmail:
        config.env === 'test'
          ? (process.env.MERCADOPAGO_TEST_BUYER_EMAIL || '').trim().toLowerCase()
          : undefined,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Mercado Pago nao configurado.' },
      { status: 500 }
    )
  }
}
