import { NextRequest, NextResponse } from 'next/server'
import { getPublicChatbotConfig } from '@/lib/admin-config-store'

function alignmentPriceTable(shortPrice: number, mediumPrice: number, longPrice: number) {
  return [
    {
      grams: 'Tamanho do cabelo',
      lengths: [
        { size: 'Curto para médio', price: shortPrice },
        { size: 'Médio para longo', price: mediumPrice },
        { size: 'Longos (à partir de)', price: longPrice },
      ],
    },
  ]
}

const SERVICES_DATA = {
  categories: [
    {
      id: 'extensoes',
      name: 'Extensões / Fibra Russa',
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
      id: 'alinhamento',
      name: 'Alinhamento',
      nameEmoji: '✨',
      description: 'Selante, BTX, blindagem, botox e acidificação',
      image: '/images/services/alisamento-destaque.png',
      order: 4
    },
    {
      id: 'cronograma',
      name: 'Cronograma Capilar + Blindagem',
      nameEmoji: '🌸',
      description: 'Tratamento completo com acompanhamento profissional',
      image: '/images/services/cronograma-capilar.png',
      order: 5
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

  alinhamento: [
    {
      id: 'align_selante_blond',
      name: 'Selante Blond',
      description: 'Selante Blond com escolha de valor pelo tamanho do cabelo.',
      images: ['/images/services/alisamento-destaque.png'],
      durationMinutes: 150,
      priceInfo: {
        table: alignmentPriceTable(190, 230, 270)
      },
      order: 1
    },
    {
      id: 'align_btx',
      name: 'BTX',
      description: 'BTX com escolha de valor pelo tamanho do cabelo.',
      images: ['/images/services/botox-capilar.png'],
      durationMinutes: 120,
      priceInfo: {
        table: alignmentPriceTable(160, 200, 240)
      },
      order: 2
    },
    {
      id: 'align_blindagem_fios',
      name: 'Blindagem dos Fios',
      description: 'Blindagem dos Fios com escolha de valor pelo tamanho do cabelo.',
      images: ['/images/services/blindagem-capilar.png'],
      durationMinutes: 120,
      priceInfo: {
        table: alignmentPriceTable(160, 190, 260)
      },
      order: 3
    },
    {
      id: 'align_botox_organic',
      name: 'Botox Organic',
      description: 'Botox Organic com escolha de valor pelo tamanho do cabelo.',
      images: ['/images/services/botox-capilar.png'],
      durationMinutes: 120,
      priceInfo: {
        table: alignmentPriceTable(150, 180, 250)
      },
      order: 4
    },
    {
      id: 'align_acidificacao',
      name: 'Acidificação',
      description: 'Acidificação com escolha de valor pelo tamanho do cabelo.',
      images: ['/images/services/acidificacao-capilar.png'],
      durationMinutes: 90,
      priceInfo: {
        table: alignmentPriceTable(150, 180, 250)
      },
      order: 5
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

function slugify(value: string) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function mapConfigService(service: any) {
  const imagesById: Record<string, string[]> = {
    'invisible-weft': ['/images/services/megahair-invisible.png'],
    'micro-capsula': ['/images/services/megahair-microcapsula.png'],
    'invisible-hair': ['/images/services/megahair-fita.png'],
  }

  const priceTable = Array.isArray(service.priceTable)
    ? service.priceTable
        .filter((row: any) => row?.active !== false)
        .sort((a: any, b: any) => Number(a.order || 999) - Number(b.order || 999))
        .map((row: any) => ({
          grams: String(row.grams || ''),
          lengths: Array.isArray(row.lengths)
            ? row.lengths
                .filter((length: any) => length?.active !== false)
                .sort((a: any, b: any) => Number(a.order || 999) - Number(b.order || 999))
                .map((length: any) => ({
                  size: String(length.size || ''),
                  price: Number(length.price || 0),
                }))
            : [],
        }))
        .filter((row: any) => row.grams && row.lengths.length > 0)
    : []

  return {
    id: service.id,
    name: service.name,
    description:
      service.longDescription ||
      service.shortDescription ||
      service.observations ||
      '',
    images: service.images || imagesById[service.id] || [],
    durationMinutes: Number(service.durationMinutes || 60),
    priceInfo:
      priceTable.length > 0
        ? { table: priceTable }
        : {
            fixedPrice: Number(service.price || 0),
          },
    order: Number(service.order || 999),
    adminConfigured: true,
    observations: service.observations || '',
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const serviceId = searchParams.get('serviceId')
  const publicConfig = await getPublicChatbotConfig().catch(() => null)
  const configuredServices = publicConfig?.services || []

  if (serviceId) {
    const configured = configuredServices.find((service: any) => service.id === serviceId)
    if (configured) {
      return NextResponse.json({
        success: true,
        service: mapConfigService(configured),
      })
    }

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
    const configuredForCategory = configuredServices
      .filter((service: any) => {
        const categorySlug = slugify(service.category || '')
        if (categorySlug === category) return true
        if (
          category === 'extensoes' &&
          /extens|fibra|mega|aplic/i.test(String(service.category || ''))
        ) {
          return true
        }
        if (
          category === 'tratamentos' &&
          /tratamento|botox|hidrat|blindagem/i.test(String(service.category || ''))
        ) {
          return true
        }
        if (
          category === 'alinhamento' &&
          /alinhamento|selante|btx|blindagem|botox|acidifica/i.test(
            String(`${service.category || ''} ${service.subcategory || ''}`)
          )
        ) {
          return true
        }
        return false
      })
      .map(mapConfigService)
    const merged = [...configuredForCategory, ...services]
      .filter(
        (service, index, arr) =>
          arr.findIndex((item) => item.id === service.id) === index
      )
      .sort((a: any, b: any) => Number(a.order || 999) - Number(b.order || 999))
    return NextResponse.json({ success: true, services: merged, category })
  }

  return NextResponse.json({ success: true, categories: SERVICES_DATA.categories })
}
