import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { authOptions } from '@/lib/auth-options'

// GET /api/shop/products - Listar produtos com filtros
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeAll = searchParams.get('all') === 'true'
    const category = searchParams.get('category')
    const hairType = searchParams.get('hairType')
    const texture = searchParams.get('texture')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const sortBy = searchParams.get('sortBy') || 'createdAt'

    // Construir filtros
    const where: any = {}

    if (includeAll) {
      const session = await getServerSession(authOptions)
      if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
      }
    } else {
      where.isActive = true
    }

    if (category) {
      where.categoryId = category
    }

    if (hairType) {
      where.hairType = hairType
    }

    if (texture) {
      where.texture = texture
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (featured === 'true') {
      where.featured = true
    }

    // Contar total
    const total = await db.product.count({ where })

    // Ordenação
    const orderBy: any = {}
    if (sortBy === 'price-asc') {
      orderBy.price = 'asc'
    } else if (sortBy === 'price-desc') {
      orderBy.price = 'desc'
    } else if (sortBy === 'name') {
      orderBy.name = 'asc'
    } else {
      orderBy.createdAt = 'desc'
    }

    // Buscar produtos
    const products = await db.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: true,
      },
    })

    // Calcular média de avaliações
    const productsWithRatings = await Promise.all(
      products.map(async (product) => {
        const reviews = await db.review.findMany({
          where: { productId: product.id, isActive: true },
        })

        const avgRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0

        return {
          ...product,
          images: JSON.parse(product.images),
          specs: JSON.parse(product.specs || '{}'),
          avgRating: Number(avgRating.toFixed(1)),
          reviewCount: reviews.length,
        }
      })
    )

    return NextResponse.json({
      products: productsWithRatings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    )
  }
}

// POST /api/shop/products - Criar novo produto (admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()

    // Validar dados básicos
    if (!body.name || !body.slug || !body.price || !body.categoryId) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      )
    }

    // Verificar se slug já existe
    const existing = await db.product.findUnique({
      where: { slug: body.slug },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Slug já existe' },
        { status: 409 }
      )
    }

    const product = await db.product.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        shortDescription: body.shortDescription,
        categoryId: body.categoryId,
        price: body.price,
        compareAtPrice: body.compareAtPrice,
        weight: body.weight || 0.5,
        length: body.length,
        hairType: body.hairType,
        texture: body.texture,
        color: body.color,
        images: JSON.stringify(body.images || []),
        specs: JSON.stringify(body.specs || {}),
        seoTitle: body.seoTitle,
        seoDescription: body.seoDescription,
        seoKeywords: body.seoKeywords,
        isActive: body.isActive ?? true,
        inStock: body.inStock ?? true,
        stock: body.stock || 10,
        featured: body.featured || false,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar produto:', error)
    return NextResponse.json(
      { error: 'Erro ao criar produto' },
      { status: 500 }
    )
  }
}
