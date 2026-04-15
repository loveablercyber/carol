import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  getDailyVisitCount,
  normalizeVisitorId,
  registerDailyVisit,
} from '@/lib/visits-store'

const VISITOR_COOKIE = 'carolsol_visitor_id'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400

function setVisitorCookie(response: NextResponse, visitorId: string) {
  response.cookies.set(VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

export async function GET() {
  try {
    const uniqueVisitsToday = await getDailyVisitCount()
    return NextResponse.json({ uniqueVisitsToday })
  } catch (error) {
    console.error('Erro ao buscar contador de visitas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar contador de visitas' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const cookieStore = await cookies()
    const visitorId = normalizeVisitorId(cookieStore.get(VISITOR_COOKIE)?.value)
    const uniqueVisitsToday = await registerDailyVisit(visitorId)
    const response = NextResponse.json({ uniqueVisitsToday })
    setVisitorCookie(response, visitorId)
    return response
  } catch (error) {
    console.error('Erro ao registrar visita unica:', error)
    return NextResponse.json(
      { error: 'Erro ao registrar visita' },
      { status: 500 }
    )
  }
}
