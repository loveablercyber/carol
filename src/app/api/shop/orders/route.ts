import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import bcrypt from 'bcryptjs'

// POST /api/shop/orders - Criar novo pedido (checkout)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      paymentMethod,
      couponCode,
      createAccount,
      password,
      cpf,
      birthday,
    } = body

    if (!customerName || !customerEmail || !customerPhone || !shippingAddress) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      )
    }

    // Obter carrinho
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('cart_session_id')?.value

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Carrinho não encontrado' },
        { status: 404 }
      )
    }

    const cart = await db.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Carrinho vazio' },
        { status: 400 }
      )
    }

    // Tentar encontrar usuário existente ou criar um novo se solicitado
    let user =
      (session?.user?.id &&
        (await db.user.findUnique({ where: { id: session.user.id } }))) ||
      (await db.user.findUnique({ where: { email: customerEmail } }))

    if (!user && createAccount && password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      user = await db.user.create({
        data: {
          name: customerName,
          email: customerEmail,
          password: hashedPassword,
          cpf: cpf,
          birthday: birthday ? new Date(birthday) : null,
          role: 'customer',
        },
      })
    }

    if (user && shippingAddress) {
      const addressPayload = {
        recipient: shippingAddress.recipient,
        phone: shippingAddress.phone,
        zipCode: shippingAddress.zipCode,
        street: shippingAddress.street,
        number: shippingAddress.number,
        complement: shippingAddress.complement,
        neighborhood: shippingAddress.neighborhood,
        city: shippingAddress.city,
        state: shippingAddress.state,
      }

      const hasRequiredFields = Boolean(
        addressPayload.recipient &&
          addressPayload.phone &&
          addressPayload.zipCode &&
          addressPayload.street &&
          addressPayload.number &&
          addressPayload.neighborhood &&
          addressPayload.city &&
          addressPayload.state
      )

      if (hasRequiredFields) {
        const existingAddress = await db.address.findFirst({
          where: {
            userId: user.id,
            zipCode: addressPayload.zipCode,
            street: addressPayload.street,
            number: addressPayload.number,
          },
        })

        if (!existingAddress) {
          const hasDefault = await db.address.findFirst({
            where: { userId: user.id, isDefault: true },
          })
          await db.address.create({
            data: {
              userId: user.id,
              ...addressPayload,
              isDefault: !hasDefault,
            },
          })
        }
      }
    }

    // Calcular subtotal
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    )

    // Validar cupom
    let discount = 0
    if (couponCode) {
      const coupon = await db.coupon.findFirst({
        where: {
          code: couponCode.toUpperCase(),
          isActive: true,
          validFrom: { lte: new Date() },
          validTo: { gte: new Date() },
        },
      })

      if (coupon) {
        if (subtotal >= coupon.minPurchase) {
          if (coupon.type === 'PERCENTAGE') {
            discount = subtotal * (coupon.value / 100)
          } else if (coupon.type === 'FIXED_AMOUNT') {
            discount = coupon.value
          }

          if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount
          }

          // Incrementar uso do cupom
          await db.coupon.update({
            where: { id: coupon.id },
            data: { usageCount: coupon.usageCount + 1 },
          })
        }
      }
    }

    // Calcular custo de frete (simulado, em produção vem da API de shipping)
    const shippingCost = shippingAddress.cost || 20

    // Calcular total
    const total = subtotal + shippingCost - discount

    // Gerar número do pedido
    const orderNumber = `CSO-${Date.now()}`

    // Criar pedido
    const order = await db.order.create({
      data: {
        orderNumber,
        userId: user?.id || null,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress: JSON.stringify(shippingAddress),
        paymentMethod,
        paymentStatus: 'PENDING',
        status: 'PENDING',
        subtotal,
        shippingCost,
        discount,
        couponCode,
        total,
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            productImage: JSON.parse(item.product.images)[0],
            price: item.product.price,
            quantity: item.quantity,
          })),
        },
      },
    })

    // Atualizar estoque
    for (const item of cart.items) {
      await db.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
          inStock: { set: item.product.stock - item.quantity > 0 },
        },
      })
    }

    // Limpar carrinho
    await db.cartItem.deleteMany({
      where: { cartId: cart.id },
    })

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar pedido:', error)
    return NextResponse.json(
      { error: 'Erro ao criar pedido' },
      { status: 500 }
    )
  }
}

// GET /api/shop/orders - Listar pedidos (admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const userIdParam = searchParams.get('userId')

    const where: any = {}
    const isAdmin = session.user?.role === 'admin'

    if (!isAdmin) {
      // Força filtro por usuário logado quando não for admin
      where.userId = session.user.id
    } else if (userIdParam) {
      where.userId = userIdParam
    }

    if (status) {
      where.status = status
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: true,
        },
      }),
      db.order.count({ where }),
    ])

    return NextResponse.json({
      orders: orders.map((order) => ({
        ...order,
        items: order.items.map((item) => ({
          ...item,
          productImage: item.productImage,
        })),
        shippingAddress: JSON.parse(order.shippingAddress),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar pedidos' },
      { status: 500 }
    )
  }
}

// PUT /api/shop/orders - Atualizar pedido (admin)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status, paymentStatus, trackingCode } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID do pedido é obrigatório' },
        { status: 400 }
      )
    }

    const order = await db.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
        ...(trackingCode !== undefined && { trackingCode }),
      },
    })

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar pedido' },
      { status: 500 }
    )
  }
}
