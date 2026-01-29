import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { authOptions } from '@/lib/auth-options'

// GET /api/shop/products/[id] - Buscar produto por ID ou slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Tentar buscar por slug primeiro
    let product = await db.product.findUnique({
      where: { slug: id },
      include: {
        category: true,
        reviews: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    // Se não encontrou por slug, tenta por ID
    if (!product) {
      product = await db.product.findUnique({
        where: { id },
        include: {
          category: true,
          reviews: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      })
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Calcular média de avaliações
    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        : 0

    // Produtos relacionados (mesma categoria)
    const relatedProducts = await db.product.findMany({
      where: {
        categoryId: product.categoryId,
        isActive: true,
        id: { not: product.id },
      },
      take: 8,
      include: {
        category: true,
      },
    })

    // Calcular ratings dos relacionados
    const relatedWithRatings = await Promise.all(
      relatedProducts.map(async (p) => {
        const reviews = await db.review.findMany({
          where: { productId: p.id, isActive: true },
        })
        const rating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0
        return {
          ...p,
          images: JSON.parse(p.images),
          avgRating: Number(rating.toFixed(1)),
          reviewCount: reviews.length,
        }
      })
    )

    return NextResponse.json({
      product: {
        ...product,
        images: JSON.parse(product.images),
        specs: JSON.parse(product.specs || '{}'),
        avgRating: Number(avgRating.toFixed(1)),
        reviewCount: product.reviews.length,
      },
      relatedProducts: relatedWithRatings,
    })
  } catch (error) {
    console.error('Erro ao buscar produto:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar produto' },
      { status: 500 }
    )
  }
}

// PUT /api/shop/products/[id] - Atualizar produto (admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const product = await db.product.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.shortDescription !== undefined && {
          shortDescription: body.shortDescription,
        }),
        ...(body.categoryId && { categoryId: body.categoryId }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.compareAtPrice !== undefined && {
          compareAtPrice: body.compareAtPrice,
        }),
        ...(body.weight !== undefined && { weight: body.weight }),
        ...(body.length !== undefined && { length: body.length }),
        ...(body.hairType && { hairType: body.hairType }),
        ...(body.texture && { texture: body.texture }),
        ...(body.color && { color: body.color }),
        ...(body.images && { images: JSON.stringify(body.images) }),
        ...(body.specs !== undefined && { specs: JSON.stringify(body.specs) }),
        ...(body.seoTitle !== undefined && { seoTitle: body.seoTitle }),
        ...(body.seoDescription !== undefined && {
          seoDescription: body.seoDescription,
        }),
        ...(body.seoKeywords !== undefined && { seoKeywords: body.seoKeywords }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.inStock !== undefined && { inStock: body.inStock }),
        ...(body.stock !== undefined && { stock: body.stock }),
        ...(body.featured !== undefined && { featured: body.featured }),
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Erro ao atualizar produto:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar produto' },
      { status: 500 }
    )
  }
}

// DELETE /api/shop/products/[id] - Deletar produto (admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    const orderItemCount = await db.orderItem.count({
      where: { productId: id },
    })

    if (orderItemCount > 0) {
      await db.product.update({
        where: { id },
        data: {
          isActive: false,
          inStock: false,
          stock: 0,
        },
      })

      return NextResponse.json({
        message: 'Produto possui pedidos e foi desativado.',
        softDeleted: true,
      })
    }

    await db.product.delete({ where: { id } })

    return NextResponse.json({ message: 'Produto deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar produto:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar produto' },
      { status: 500 }
    )
  }
}
