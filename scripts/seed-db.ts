import { db } from '../src/lib/db'

async function seed() {
  console.log('🌱 Iniciando seed do banco de dados...')

  try {
    // Limpar dados existentes
    console.log('🧹 Limpando dados existentes...')
    await db.cartItem.deleteMany()
    await db.cart.deleteMany()
    await db.orderItem.deleteMany()
    await db.order.deleteMany()
    await db.review.deleteMany()
    await db.product.deleteMany()
    await db.category.deleteMany()

    // Criar categorias
    console.log('📂 Criando categorias...')
    const categories = await Promise.all([
      db.category.create({
        data: {
          name: 'Mega Hair',
          slug: 'mega-hair',
          description: 'Extensões de cabelo natural em fita, microcápsula e mais',
          image: '/images/services/megahair-destaque.png',
          order: 1,
        },
      }),
      db.category.create({
        data: {
          name: 'Perucas',
          slug: 'perucas',
          description: 'Perucas sintéticas e humanas de alta qualidade',
          image: '/images/services/extensions-destaque.png',
          order: 2,
        },
      }),
      db.category.create({
        data: {
          name: 'Lace Front',
          slug: 'lace-front',
          description: 'Perucas lace front com base transparente',
          image: '/images/services/extensions-destaque.png',
          order: 3,
        },
      }),
      db.category.create({
        data: {
          name: 'Apliques',
          slug: 'apliques',
          description: 'Apliques e tranças para cabelo natural',
          image: '/images/services/extensions-destaque.png',
          order: 4,
        },
      }),
      db.category.create({
        data: {
          name: 'Acessórios',
          slug: 'acessorios',
          description: 'Acessórios para manutenção e aplicação',
          image: '/images/services/extensions-destaque.png',
          order: 5,
        },
      }),
    ])

    console.log(`✅ ${categories.length} categorias criadas`)

    // Criar produtos
    console.log('📦 Criando produtos...')

    const megaHairProducts = [
      {
        name: 'Mega Hair Fita 50cm - Loiro',
        slug: 'mega-hair-fita-50cm-loiro',
        description: 'Mega hair em fita de alta qualidade. Método invisível, aplicação rápida e confortável. Cabelo 100% humano, pode ser tingido e modelado. Cada pacote contém 50 fios de 50cm de comprimento.\n\nBenefícios:\n• Aplicação invisível\n• Cabelo 100% humano\n• Duração de 3 a 6 meses\n• Pode ser tingido e alisado\n• Alta durabilidade',
        shortDescription: 'Mega hair em fita 50cm, cabelo 100% humano',
        price: 450.00,
        compareAtPrice: 550.00,
        categoryId: categories[0].id,
        weight: 0.3,
        length: 50,
        hairType: 'HUMANO',
        texture: 'LISO',
        color: 'Loiro Ouro',
        images: JSON.stringify([
          '/images/services/megahair-fita.png',
        ]),
        specs: JSON.stringify({
          'Comprimento': '50cm',
          'Quantidade': '50 fios',
          'Material': '100% Humano',
          'Duração': '3 a 6 meses',
          'Aplicação': 'Fita adesiva',
        }),
        stock: 15,
        featured: true,
      },
      {
        name: 'Mega Hair Microcápsula 40cm - Castanho',
        slug: 'mega-hair-microcapsula-40cm-castanho',
        description: 'Mega hair em microcápsula com queratina. Aplicação discreta e durável, sem dano aos fios naturais. Cabelo humano de alta qualidade.\n\nBenefícios:\n• Aplicação discreta\n• Baixo dano ao cabelo natural\n• Alta durabilidade\n• Cabelo 100% humano',
        shortDescription: 'Mega hair microcápsula 40cm, aplicação com queratina',
        price: 380.00,
        categoryId: categories[0].id,
        weight: 0.25,
        length: 40,
        hairType: 'HUMANO',
        texture: 'LISO',
        color: 'Castanho Médio',
        images: JSON.stringify([
          '/images/services/megahair-microcapsula.png',
        ]),
        specs: JSON.stringify({
          'Comprimento': '40cm',
          'Método': 'Microcápsula com queratina',
          'Material': '100% Humano',
          'Duração': '3 a 4 meses',
        }),
        stock: 20,
        featured: false,
      },
      {
        name: 'Mega Hair Fita 60cm - Preto',
        slug: 'mega-hair-fita-60cm-preto',
        description: 'Mega hair em fita com 60cm de comprimento. Cabelo humano preto natural, ideal para quem deseja volume e comprimento extras.\n\nBenefícios:\n• Maior comprimento\n• Volume natural\n• Cabelo 100% humano\n• Aplicação invisível',
        shortDescription: 'Mega hair fita 60cm preto, alto volume',
        price: 580.00,
        categoryId: categories[0].id,
        weight: 0.35,
        length: 60,
        hairType: 'HUMANO',
        texture: 'LISO',
        color: 'Preto Natural',
        images: JSON.stringify([
          '/images/services/megahair-fita.png',
        ]),
        specs: JSON.stringify({
          'Comprimento': '60cm',
          'Quantidade': '40 fios',
          'Material': '100% Humano',
          'Duração': '3 a 6 meses',
        }),
        stock: 10,
        featured: true,
      },
    ]

    const perucasProducts = [
      {
        name: 'Perca Humana 100% - Loiro',
        slug: 'perca-humana-100-loiro',
        description: 'Perca de cabelo humano 100% natural, pode ser tingida, alisada e modelada. Base francesa confortável, permite uso de fita adesiva. Ideal para uso diário e ocasional.\n\nCaracterísticas:\n• Cabelo 100% humano\n• Pode ser tingida e modelada\n• Base francesa confortável\n• Densidade natural\n• Fácil manutenção',
        shortDescription: 'Perca humana 100%, loiro ouro',
        price: 899.90,
        compareAtPrice: 1200.00,
        categoryId: categories[1].id,
        weight: 0.5,
        hairType: 'HUMANO',
        texture: 'LISO',
        color: 'Loiro Ouro',
        images: JSON.stringify([
          '/images/services/extensions-destaque.png',
        ]),
        specs: JSON.stringify({
          'Material': '100% Humano',
          'Base': 'Francesa',
          'Comprimento': '30cm',
          'Densidade': 'Média-Alta',
        }),
        stock: 8,
        featured: true,
      },
      {
        name: 'Perca Sintética Premium - Castanho',
        slug: 'perca-sintetica-premium-castanho',
        description: 'Perca de fibra sintética de alta tecnologia, estilo natural e baixo custo. Pronta para uso, fácil manutenção. Disponível em várias cores.\n\nCaracterísticas:\n• Fibra sintética premium\n• Estilo natural\n• Fácil manutenção\n• Pronta para uso\n• Ótimo custo-benefício',
        shortDescription: 'Perca sintética premium, castanho chocolate',
        price: 299.90,
        categoryId: categories[1].id,
        weight: 0.3,
        hairType: 'SINTÉTICO',
        texture: 'CACHEADO',
        color: 'Castanho Chocolate',
        images: JSON.stringify([
          '/images/services/extensions-destaque.png',
        ]),
        specs: JSON.stringify({
          'Material': 'Fibra sintética premium',
          'Base': 'Elastizada',
          'Comprimento': '25cm',
          'Estilo': 'Cacheado natural',
        }),
        stock: 25,
        featured: false,
      },
    ]

    const acessoriosProducts = [
      {
        name: 'Touca de Silicone para Banho',
        slug: 'touca-silicone-banho',
        description: 'Touca impermeável de silicone para proteger perucas durante o banho. Ajustável e confortável.\n\nBenefícios:\n• 100% impermeável\n• Silicone macio\n• Ajustável\n• Proteção completa',
        shortDescription: 'Touca de silicone para proteção de perucas no banho',
        price: 45.00,
        categoryId: categories[4].id,
        weight: 0.1,
        hairType: null,
        images: JSON.stringify([]),
        specs: JSON.stringify({
          'Material': 'Silicone',
          'Tamanho': 'Único ajustável',
          'Uso': 'Proteção de perucas no banho',
        }),
        stock: 50,
        featured: false,
      },
      {
        name: 'Suporte para Perucas Acrílico',
        slug: 'suporte-perucas-acrilico',
        description: 'Suporte em acrílico para armazenamento e modelagem de perucas. Mantém a forma e facilita a manutenção.\n\nBenefícios:\n• Acrílico resistente\n• Mantém forma da peruca\n• Fácil de limpar\n• Estável',
        shortDescription: 'Suporte de acrílico para armazenamento de perucas',
        price: 75.00,
        categoryId: categories[4].id,
        weight: 0.5,
        hairType: null,
        images: JSON.stringify([]),
        specs: JSON.stringify({
          'Material': 'Acrílico',
          'Altura': '30cm',
          'Base': '15cm de diâmetro',
        }),
        stock: 30,
        featured: false,
      },
      {
        name: 'Kit Escova e Pente de Madeira',
        slug: 'kit-escova-panco-madeira',
        description: 'Kit completo com escova e pente de madeira natural. Ideal para pentear perucas sem causar estática ou dano.\n\nContém:\n• 1 Escova de madeira\n• 1 Pente de madeira\n• Saquinho de transporte',
        shortDescription: 'Kit escova e pente de madeira para perucas',
        price: 55.00,
        categoryId: categories[4].id,
        weight: 0.2,
        hairType: null,
        images: JSON.stringify([]),
        specs: JSON.stringify({
          'Material': 'Madeira natural',
          'Contém': 'Escova + Pente',
          'Uso': 'Penteados de perucas',
        }),
        stock: 40,
        featured: false,
      },
    ]

    const allProducts = [...megaHairProducts, ...perucasProducts, ...acessoriosProducts]

    const products = await Promise.all(
      allProducts.map(product =>
        db.product.create({
          data: product,
        })
      )
    )

    console.log(`✅ ${products.length} produtos criados`)

    // Criar algumas avaliações
    console.log('⭐ Criando avaliações...')
    const reviews = await Promise.all([
      db.review.create({
        data: {
          productId: products[0].id,
          author: 'Maria Silva',
          rating: 5,
          title: 'Excelente qualidade!',
          comment: 'Mega hair incrível, aplicação super fácil e o resultado ficou natural. Recomendo muito!',
          verified: true,
        },
      }),
      db.review.create({
        data: {
          productId: products[0].id,
          author: 'Ana Costa',
          rating: 5,
          comment: 'Cabelo humano de verdade, pude tingir e ficou lindo. Superou minhas expectativas.',
          verified: true,
        },
      }),
      db.review.create({
        data: {
          productId: products[3].id,
          author: 'Julia Santos',
          rating: 4,
          title: 'Boa peruca',
          comment: 'Peruca de ótima qualidade, cabelo humano, porém precisa de cuidados especiais.',
          verified: true,
        },
      }),
    ])

    console.log(`✅ ${reviews.length} avaliações criadas`)

    // Criar cupom de teste
    console.log('🎟️  Criando cupom de desconto...')
    await db.coupon.create({
      data: {
        code: 'BEMVINDO10',
        type: 'PERCENTAGE',
        value: 10,
        minPurchase: 100,
        maxDiscount: 50,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        isActive: true,
      },
    })

    console.log('✅ Cupom BEMVINDO10 criado (10% de desconto)')

    console.log('🎉 Seed concluído com sucesso!')
    console.log('')
    console.log('📊 Resumo:')
    console.log(`   • ${categories.length} categorias`)
    console.log(`   • ${products.length} produtos`)
    console.log(`   • ${reviews.length} avaliações`)
    console.log(`   • 1 cupom de desconto`)
    console.log('')
    console.log('💡 Dica: Use o cupom BEMVINDO10 para 10% de desconto em compras acima de R$ 100')

  } catch (error) {
    console.error('❌ Erro ao fazer seed:', error)
    throw error
  } finally {
    await db.$disconnect()
  }
}

seed()
