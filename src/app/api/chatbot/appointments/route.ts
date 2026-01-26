import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      customer,
      service,
      scheduledDate,
      durationMinutes,
      totalPrice,
      grams,
      length,
      paymentMethod
    } = body

    if (!customer || !service || !scheduledDate || !totalPrice) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const appointment = {
      id: `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customer: {
        id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      },
      service,
      scheduledDate: new Date(scheduledDate).toISOString(),
      durationMinutes,
      grams,
      length,
      totalPrice,
      paymentMethod,
      paymentStatus: 'pending',
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      appointment,
      message: 'Agendamento realizado com sucesso!'
    })
  } catch (error) {
    console.error('Appointment creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar agendamento' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  if (!date) {
    return NextResponse.json(
      { success: false, error: 'Date parameter required' },
      { status: 400 }
    )
  }

  const selectedDate = new Date(date)
  const now = new Date()
  const isToday = selectedDate.toDateString() === now.toDateString()

  const availableSlots: any[] = []
  const startHour = 9
  const endHour = 19

  for (let hour = startHour; hour < endHour; hour++) {
    for (const minute of ['00']) {
      const slotTime = new Date(selectedDate)
      slotTime.setHours(hour, parseInt(minute), 0, 0)

      if (isToday && slotTime <= now) {
        continue
      }

      const dayOfWeek = slotTime.getDay()
      if (dayOfWeek === 0) {
        continue
      }

      const isTaken = Math.random() > 0.9 // Reduced random interference

      availableSlots.push({
        time: slotTime.toISOString(),
        displayTime: `${hour.toString().padStart(2, '0')}:${minute}`,
        available: !isTaken
      })
    }
  }

  // Handle local simulation for testing/demo purposes if no real DB
  // In a real app, we would query the database here
  
  return NextResponse.json({
    success: true,
    date: date,
    availableSlots
  })
}
