import { NextRequest, NextResponse } from 'next/server'

const SERVICES_DATA = {
  categories: [
    {
      id: 'extensoes',
      name: 'Extensões / Mega Hair',
      nameEmoji: '💖',
      description: 'Comprimento e volume com técnicas invisíveis',
      image: '/images/extensions-destaque.png',
      order: 1
    },
    {
      id: 'tratamentos',
      name: 'Tratamentos e Alinhamento',
      nameEmoji: '✨',
      description: 'Tratamentos que restauram a saúde do seu cabelo',
      image: '/images/services/tratamentos-destaque.png',
      order: 2
    },
    {
      id: 'alisamento',
      name: 'Alisamento',
      nameEmoji: '💇‍♀️',
      description: 'Alinhamento suave e natural para seu cabelo',
      image: '/images/services/alisamento-destaque.png',
      order: 3
    },
    {
      id: 'cronograma',
      name: 'Cronograma Capilar + Blindagem',
      nameEmoji: '🌸',
      description: 'Tratamento completo com acompanhamento profissional',
      image: '/images/services/cronograma-capilar.png',
      order: 4
    }
  ],

  tratamentos: [
    {
      id: 'blindagem-capilar',
      name: 'Blindagem Capilar',
      description: 'Tratamento de hidratação + nutrição + selagem das cutículas. Cria uma película protetora com queratina, aminoácidos e óleos. Reduz frizz e dá brilho. Não alisa.',
      images: ['/images/services/blindagem-capilar.png'],
      durationMinutes: 120,
      priceInfo: {
        tiers: [
          { name: 'Curto para médio', price: 160 },
          { name: 'Médio para longo', price: 190 },
          { name: 'Longos (a partir de)', price: 260 }
        ]
      },
      order: 1
    },
    {
      id: 'acidificacao-capilar',
      name: 'Acidificação Capilar',
      description: 'Fecha as cutículas após químicas ou excesso de calor. Preserva hidratação, reduz porosidade e prolonga outros tratamentos.',
      images: ['/images/services/acidificacao-capilar.png'],
      durationMinutes: 90,
      priceInfo: {
        tiers: [
          { name: 'Curto para médio', price: 150 },
          { name: 'Médio para longo', price: 180 },
          { name: 'Longos (a partir de)', price: 250 }
        ]
      },
      order: 2
    },
    {
      id: 'botox-capilar',
      name: 'Botox Capilar (Organic)',
      description: 'Reconstrução e nutrição profunda com vitaminas e aminoácidos. Repõe massa capilar e brilho. Não alisa.',
      images: ['/images/services/botox-capilar.png'],
      durationMinutes: 120,
      priceInfo: {
        tiers: [
          { name: 'Curto para médio', price: 150 },
          { name: 'Médio para longo', price: 180 },
          { name: 'Longos (a partir de)', price: 250 }
        ]
      },
      order: 3
    },
    {
      id: 'selante-capilar',
      name: 'Selante Capilar (Blond)',
      description: 'Procedimento químico que promove alisamento temporário ou prolongado.',
      images: ['/images/services/blindagem-capilar.png'],
      durationMinutes: 150,
      priceInfo: {
        tiers: [
          { name: 'Curto para médio', price: 190 },
          { name: 'Médio para longo', price: 230 },
          { name: 'Longos (a partir de)', price: 270 }
        ]
      },
      order: 5
    }
  ],

  alisamento: [
    {
      id: 'progressiva-organica',
      name: 'Progressiva Orgânica',
      description: 'Alisamento natural com produtos orgânicos. Reduz volume e alinha os fios.',
      images: ['/images/services/progressiva.png'],
      durationMinutes: 240,
      priceInfo: {
        tiers: [
          { name: 'Curto para médio', price: 265 },
          { name: 'Médio para longo', price: 310 },
          { name: 'Longos', price: 400 }
        ]
      },
      order: 1
    },
    {
      id: 'progressiva-formal',
      name: 'Progressiva Formal',
      description: 'Alisamento forte para cabelos mais rebeldes. Resultado liso duradouro.',
      images: ['/images/services/progressiva.png'],
      durationMinutes: 300,
      priceInfo: {
        tiers: [
          { name: 'Curto para médio', price: 365 },
          { name: 'Médio para longo', price: 410 },
          { name: 'Longos', price: 500 }
        ]
      },
      order: 2
    }
  ],

  extensoes: [
    {
      id: 'invisible-weft',
      name: 'Invisible Weft Extensions (Ponto Invisível)',
      description: 'Técnica moderna de aplicação em costura invisível. Natural e confortável.',
      images: ['/images/services/megahair-invisible.png'],
      durationMinutes: 180,
      priceInfo: {
        table: [
          { 
            grams: '100g', 
            lengths: [{ size: '60/65/70cm', price: 360 }, { size: '75/80cm', price: 430 }] 
          },
          { 
            grams: '150g', 
            lengths: [{ size: '60/65/70cm', price: 405 }, { size: '75/80cm', price: 510 }] 
          },
          { 
            grams: '200g', 
            lengths: [{ size: '60/65/70cm', price: 500 }, { size: '75/80cm', price: 640 }] 
          },
          { 
            grams: '250g', 
            lengths: [{ size: '60/65/70cm', price: 600 }, { size: '75/80cm', price: 775 }] 
          },
          { 
            grams: '300g', 
            lengths: [{ size: '60/65/70cm', price: 660 }, { size: '75/80cm', price: 870 }] 
          },
          { 
            grams: '350g', 
            lengths: [{ size: '60/65/70cm', price: 770 }, { size: '75/80cm', price: 1015 }] 
          }
        ]
      },
      requiresGrams: true,
      order: 1
    },
    {
      id: 'micro-capsula',
      name: 'Micro Cápsula de Queratina',
      description: 'Pequenas cápsulas aplicadas fio a fio com queratina. Maior naturalidade.',
      images: ['/images/services/megahair-microcapsula.png'],
      durationMinutes: 240,
      priceInfo: {
        table: [
          { grams: '100g', lengths: [{ size: '60/65/70cm', price: 590 }, { size: '75/80cm', price: 660 }] },
          { grams: '150g', lengths: [{ size: '60/65/70cm', price: 780 }, { size: '75/80cm', price: 885 }] },
          { grams: '200g', lengths: [{ size: '60/65/70cm', price: 1040 }, { size: '75/80cm', price: 1180 }] },
          { grams: '250g', lengths: [{ size: '60/65/70cm', price: 1300 }, { size: '75/80cm', price: 1475 }] },
          { grams: '300g', lengths: [{ size: '60/65/70cm', price: 1560 }, { size: '75/80cm', price: 1770 }] },
          { grams: '350g', lengths: [{ size: '60/65/70cm', price: 1820 }, { size: '75/80cm', price: 2065 }] }
        ]
      },
      requiresGrams: true,
      order: 2
    },
    {
      id: 'invisible-hair',
      name: 'Invisible Hair Extensions (Fita Adesiva)',
      description: 'Fitas adesivas ultrafinas e invisíveis. Aplicação rápida e discreta.',
      images: ['/images/services/megahair-fita.png'],
      durationMinutes: 120,
      priceInfo: {
        table: [
          { 
            grams: '100g', 
            lengths: [{ size: '60/65/70cm', price: 440 }, { size: '75/80cm', price: 510 }] 
          },
          { 
            grams: '150g', 
            lengths: [{ size: '60/65/70cm', price: 525 }, { size: '75/80cm', price: 630 }] 
          },
          { 
            grams: '200g', 
            lengths: [{ size: '60/65/70cm', price: 660 }, { size: '75/80cm', price: 800 }] 
          },
          { 
            grams: '250g', 
            lengths: [{ size: '60/65/70cm', price: 800 }, { size: '75/80cm', price: 975 }] 
          },
          { 
            grams: '300g', 
            lengths: [{ size: '60/65/70cm', price: 930 }, { size: '75/80cm', price: 1140 }] 
          },
          { 
            grams: '350g', 
            lengths: [{ size: '60/65/70cm', price: 1085 }, { size: '75/80cm', price: 1330 }] 
          }
        ]
      },
      requiresGrams: true,
      order: 3
    }
  ],

  cronograma: [
    {
      id: 'cronograma-completo',
      name: 'Pacote Cronograma Capilar + Blindagem',
      description: 'Tratamento completo de 4 semanas com acompanhamento profissional. Inclui hidratação (segunda), nutrição (quarta), reconstrução (sexta) e blindagem capilar no final.',
      images: ['/images/services/cronograma-capilar.png'],
      durationMinutes: 120,
      priceInfo: {
        fixedPrice: 390
      },
      order: 1
    }
  ]
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const serviceId = searchParams.get('serviceId')

  if (serviceId) {
    // Find service in all categories
    for (const catId of Object.keys(SERVICES_DATA)) {
      if (catId === 'categories') continue
      const service = SERVICES_DATA[catId as keyof typeof SERVICES_DATA]?.find(
        (s: any) => s.id === serviceId
      )
      if (service) {
        return NextResponse.json({ success: true, service })
      }
    }
    return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 })
  }

  if (category) {
    const services = SERVICES_DATA[category as keyof typeof SERVICES_DATA] || []
    return NextResponse.json({ success: true, services, category })
  }

  return NextResponse.json({ success: true, categories: SERVICES_DATA.categories })
}
