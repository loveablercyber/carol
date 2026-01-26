import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/shop/coupons/[code] - Validar cupom
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params

    const coupon = await db.coupon.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true,
      },
    })

    if (!coupon) {
      return NextResponse.json(
        { error: 'Cupom inválido' },
        { status: 404 }
      )
    }

    const now = new Date()
    if (now < coupon.validFrom || now > coupon.validTo) {
      return NextResponse.json(
        { error: 'Cupom expirado ou ainda não válido' },
        { status: 400 }
      )
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json(
        { error: 'Cupom esgotado' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minPurchase: coupon.minPurchase,
        maxDiscount: coupon.maxDiscount,
        applicableTo: coupon.applicableTo,
      },
    })
  } catch (error) {
    console.error('Erro ao validar cupom:', error)
    return NextResponse.json(
      { error: 'Erro ao validar cupom' },
      { status: 500 }
    )
  }
}
