import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

// Helper para obter ou criar carrinho
async function getCart() {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get('cart_session_id')?.value

  if (!sessionId) {
    sessionId = crypto.randomUUID()
    cookieStore.set('cart_session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 dias
    })
  }

  let cart = await db.cart.findUnique({
    where: { sessionId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  if (!cart) {
    cart = await db.cart.create({
      data: {
        sessionId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })
  }

  if (!cart) {
    throw new Error("Falha ao criar/recuperar carrinho")
  }

  return cart
}

// GET /api/shop/cart - Buscar carrinho atual
export async function GET() {
  try {
    const cart = await getCart()

    const cartWithDetails = {
      ...cart,
      items: cart.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: item.product.price,
          images: JSON.parse(item.product.images),
          inStock: item.product.inStock,
          stock: item.product.stock,
        },
      })),
    }

    // Calcular totais
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    )

    return NextResponse.json({
      cart: cartWithDetails,
      totals: {
        subtotal: Number(subtotal.toFixed(2)),
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar carrinho:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar carrinho' },
      { status: 500 }
    )
  }
}

// POST /api/shop/cart - Adicionar item ao carrinho
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, quantity = 1 } = body

    if (!productId) {
      return NextResponse.json(
        { error: 'ProductId é obrigatório' },
        { status: 400 }
      )
    }

    const cart = await getCart()
    const product = await db.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    if (!product.inStock || product.stock < quantity) {
      return NextResponse.json(
        { error: 'Produto indisponível ou sem estoque' },
        { status: 400 }
      )
    }

    // Verificar se item já existe no carrinho
    const existingItem = await db.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    })

    let cartItem
    if (existingItem) {
      cartItem = await db.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      })
    } else {
      cartItem = await db.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      })
    }

    // Buscar carrinho atualizado
    const updatedCart = await db.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    const subtotal = updatedCart!.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    )

    return NextResponse.json({
      item: cartItem,
      totals: {
        subtotal: Number(subtotal.toFixed(2)),
        itemCount: updatedCart!.items.reduce((sum, item) => sum + item.quantity, 0),
      },
    })
  } catch (error) {
    console.error('Erro ao adicionar item ao carrinho:', error)
    return NextResponse.json(
      { error: 'Erro ao adicionar item ao carrinho' },
      { status: 500 }
    )
  }
}

// PUT /api/shop/cart - Atualizar quantidade
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemId, quantity } = body

    if (!itemId || typeof quantity !== 'number' || quantity < 1) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      )
    }

    const cart = await getCart()

    const cartItem = await db.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { product: true }
    })

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Item não encontrado' },
        { status: 404 }
      )
    }

    if (quantity > cartItem.product.stock) {
      return NextResponse.json(
        { error: 'Estoque insuficiente' },
        { status: 400 }
      )
    }

    await db.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    })

    const updatedCart = await db.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true } } },
    })

    const subtotal = updatedCart!.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    )

    return NextResponse.json({
      totals: {
        subtotal: Number(subtotal.toFixed(2)),
        itemCount: updatedCart!.items.reduce((sum, item) => sum + item.quantity, 0),
      },
    })
  } catch (error) {
    console.error('Erro ao atualizar quantidade:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar quantidade' },
      { status: 500 }
    )
  }
}

// DELETE /api/shop/cart - Remover item do carrinho
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemId } = body

    if (!itemId) {
      return NextResponse.json(
        { error: 'ItemId é obrigatório' },
        { status: 400 }
      )
    }

    const cart = await getCart()

    // Verificar se o item pertence ao carrinho do usuário
    const cartItem = await db.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    })

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Item não encontrado no carrinho' },
        { status: 404 }
      )
    }

    await db.cartItem.delete({
      where: { id: itemId },
    })

    // Buscar carrinho atualizado
    const updatedCart = await db.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    const subtotal = updatedCart!.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    )

    return NextResponse.json({
      totals: {
        subtotal: Number(subtotal.toFixed(2)),
        itemCount: updatedCart!.items.reduce((sum, item) => sum + item.quantity, 0),
      },
    })
  } catch (error) {
    console.error('Erro ao remover item do carrinho:', error)
    return NextResponse.json(
      { error: 'Erro ao remover item do carrinho' },
      { status: 500 }
    )
  }
}
