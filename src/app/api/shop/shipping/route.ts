import { NextRequest, NextResponse } from 'next/server'
import {
  findShippingRule,
  getShippingSettings,
} from '@/lib/shipping-config-store'

const DEFAULT_DIMENSIONS = { width: 15, height: 10, length: 20 }
const SIMULATED_ORIGIN = '01001001'
const DEFAULT_PAC = '03298'
const DEFAULT_SEDEX = '03220'

const normalizePrice = (value: any) => {
  if (typeof value === 'number') return value
  const raw = String(value || '').trim()
  if (!raw) return 0
  if (raw.includes(',') && raw.includes('.')) {
    return parseFloat(raw.replace(/\./g, '').replace(',', '.'))
  }
  if (raw.includes(',')) return parseFloat(raw.replace(',', '.'))
  return parseFloat(raw)
}

const extractArray = (data: any) => {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== 'object') return []
  const keys = Object.keys(data)
  for (const key of keys) {
    if (Array.isArray((data as any)[key])) {
      return (data as any)[key]
    }
  }
  return []
}

const simulateShipping = (
  cep: string,
  weight: number,
  dimensions: any,
  baseCost: number,
  expressMultiplier: number
) => {
  const firstTwoDigits = parseInt(cep.substring(0, 2))

  let basePrice = baseCost
  let pacDays = 0
  let sedexDays = 0

  if (firstTwoDigits >= 1 && firstTwoDigits <= 19) {
    basePrice = baseCost * 0.9
    pacDays = 5
    sedexDays = 1
  } else if (firstTwoDigits >= 20 && firstTwoDigits <= 28) {
    basePrice = baseCost
    pacDays = 6
    sedexDays = 2
  } else if (firstTwoDigits >= 30 && firstTwoDigits <= 39) {
    basePrice = baseCost * 1.1
    pacDays = 7
    sedexDays = 2
  } else if (firstTwoDigits >= 40 && firstTwoDigits <= 49) {
    basePrice = baseCost * 1.4
    pacDays = 9
    sedexDays = 3
  } else if (firstTwoDigits >= 50 && firstTwoDigits <= 59) {
    basePrice = baseCost * 1.5
    pacDays = 10
    sedexDays = 3
  } else if (firstTwoDigits >= 60 && firstTwoDigits <= 69) {
    basePrice = baseCost * 1.7
    pacDays = 11
    sedexDays = 4
  } else if (firstTwoDigits >= 70 && firstTwoDigits <= 79) {
    basePrice = baseCost * 1.2
    pacDays = 7
    sedexDays = 2
  } else if (firstTwoDigits >= 80 && firstTwoDigits <= 89) {
    basePrice = baseCost * 0.95
    pacDays = 6
    sedexDays = 2
  } else if (firstTwoDigits >= 90 && firstTwoDigits <= 99) {
    basePrice = baseCost * 1.3
    pacDays = 8
    sedexDays = 3
  } else {
    basePrice = baseCost * 1.8
    pacDays = 12
    sedexDays = 4
  }

  const weightMultiplier = Math.ceil(weight)
  basePrice = basePrice * (1 + (weightMultiplier - 1) * 0.5)

  const volume = (dimensions.width * dimensions.height * dimensions.length) / 6000
  if (volume > 1) {
    basePrice = basePrice * volume
  }

  const pacPrice = Math.max(baseCost * 0.8, basePrice)
  const sedexPrice = Math.max(baseCost, basePrice * Math.max(1.2, expressMultiplier))

  return [
    {
      code: 'PAC',
      name: 'PAC - Encomenda Econômica',
      price: Number(pacPrice.toFixed(2)),
      deliveryDays: pacDays,
      estimatedDelivery: `${pacDays} dias úteis`,
    },
    {
      code: 'SEDEX',
      name: 'SEDEX - Entrega Expressa',
      price: Number(sedexPrice.toFixed(2)),
      deliveryDays: sedexDays,
      estimatedDelivery: `${sedexDays} dias úteis`,
    },
  ]
}

// Cálculo de frete - Correios (real quando token configurado)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      zipCode,
      weight = 0.5,
      dimensions = DEFAULT_DIMENSIONS,
      productIds = [],
      categoryIds = [],
    } = body

    if (!zipCode) {
      return NextResponse.json({ error: 'CEP é obrigatório' }, { status: 400 })
    }

    const cep = zipCode.replace(/\D/g, '')
    if (cep.length !== 8) {
      return NextResponse.json({ error: 'CEP inválido' }, { status: 400 })
    }

    const settings = await getShippingSettings()
    const shippingRule = await findShippingRule({
      productIds: Array.isArray(productIds) ? productIds : [],
      categoryIds: Array.isArray(categoryIds) ? categoryIds : [],
    })

    const config = settings.config
    const baseCostFromRule = shippingRule?.fixedCost
    const deliveryDaysFromRule = shippingRule?.deliveryDays
    const resolvedDefaultCost = Number(baseCostFromRule || config.defaultCost || 20)
    const resolvedExpressMultiplier = Number(config.expressMultiplier || 2.5)
    const freeShippingMin = Number(config.freeShippingMin || 300)
    const enableCorreios = Boolean(config.enableCorreios)

    const token = enableCorreios ? process.env.CORREIOS_TOKEN : null
    const originZip = (
      process.env.CORREIOS_ORIGIN_ZIP ||
      config.originZipCode ||
      SIMULATED_ORIGIN
    ).replace(/\D/g, '')
    const pacCode = process.env.CORREIOS_SERVICE_PAC || DEFAULT_PAC
    const sedexCode = process.env.CORREIOS_SERVICE_SEDEX || DEFAULT_SEDEX
    const precoBase = process.env.CORREIOS_PRECO_BASE || 'https://api.correios.com.br/preco/v1'
    const prazoBase = process.env.CORREIOS_PRAZO_BASE || 'https://api.correios.com.br/prazo/v1'
    const contrato = process.env.CORREIOS_CONTRACT
    const dr = process.env.CORREIOS_DR

    if (shippingRule) {
      const pacDays = Math.max(1, Number(deliveryDaysFromRule || 7))
      const sedexDays = Math.max(1, pacDays - 2)
      const shippingOptions = [
        {
          code: 'PAC',
          name: `Frete padrao${shippingRule.scope === 'PRODUCT' ? ' (produto)' : ' (categoria)'}`,
          price: Number(resolvedDefaultCost.toFixed(2)),
          deliveryDays: pacDays,
          estimatedDelivery: `${pacDays} dias uteis`,
        },
        {
          code: 'SEDEX',
          name: 'Frete expresso',
          price: Number((resolvedDefaultCost * resolvedExpressMultiplier).toFixed(2)),
          deliveryDays: sedexDays,
          estimatedDelivery: `${sedexDays} dias uteis`,
        },
      ]

      return NextResponse.json({
        shippingOptions,
        zipCode: cep,
        freeShippingMin,
        ruleApplied: shippingRule,
      })
    }

    if (!token) {
      const shippingOptions = simulateShipping(
        cep,
        weight,
        dimensions,
        resolvedDefaultCost,
        resolvedExpressMultiplier
      )
      return NextResponse.json({
        shippingOptions,
        zipCode: cep,
        freeShippingMin,
      })
    }

    const grams = Math.max(1, Math.round(weight * 1000))
    const payloadBase = {
      cepOrigem: originZip,
      cepDestino: cep,
      psObjeto: String(grams),
      tpObjeto: '2',
      comprimento: String(dimensions.length),
      largura: String(dimensions.width),
      altura: String(dimensions.height),
      ...(contrato ? { nuContrato: contrato } : {}),
      ...(dr ? { nuDR: dr } : {}),
    }

    const pricePayload = {
      idLote: '001',
      parametrosProduto: [
        { coProduto: pacCode, nuRequisicao: '0001', ...payloadBase },
        { coProduto: sedexCode, nuRequisicao: '0002', ...payloadBase },
      ],
    }

    const prazoPayload = {
      idLote: '001',
      parametrosPrazo: [
        { coProduto: pacCode, nuRequisicao: '0001', ...payloadBase },
        { coProduto: sedexCode, nuRequisicao: '0002', ...payloadBase },
      ],
    }

    const [priceResponse, prazoResponse] = await Promise.all([
      fetch(`${precoBase}/nacional`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(pricePayload),
      }),
      fetch(`${prazoBase}/nacional`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(prazoPayload),
      }),
    ])

    if (!priceResponse.ok || !prazoResponse.ok) {
      const shippingOptions = simulateShipping(
        cep,
        weight,
        dimensions,
        resolvedDefaultCost,
        resolvedExpressMultiplier
      )
      return NextResponse.json({
        shippingOptions,
        zipCode: cep,
        freeShippingMin,
      })
    }

    const priceData = await priceResponse.json()
    const prazoData = await prazoResponse.json()

    const priceItems = extractArray(priceData)
    const prazoItems = extractArray(prazoData)

    const priceMap = new Map<string, number>()
    priceItems.forEach((item: any) => {
      const code =
        item.coProduto ||
        item.coServico ||
        item.codigoServico ||
        item.codigoProduto
      if (!code || item.txErro) return
      const value = item.pcFinal || item.pcBase || item.pcProduto || item.pcFaixa
      if (value !== undefined) {
        priceMap.set(String(code), normalizePrice(value))
      }
    })

    const prazoMap = new Map<string, number>()
    prazoItems.forEach((item: any) => {
      const code =
        item.coProduto ||
        item.coServico ||
        item.codigoServico ||
        item.codigoProduto
      if (!code || item.txErro) return
      const prazo = item.prazoEntrega || item.prazo || item.prazoFinal
      if (prazo !== undefined) {
        prazoMap.set(String(code), Number(prazo))
      }
    })

    const pacPrice = priceMap.get(pacCode)
    const sedexPrice = priceMap.get(sedexCode)
    const pacDays = prazoMap.get(pacCode)
    const sedexDays = prazoMap.get(sedexCode)

    const shippingOptions = [
      pacPrice && pacDays
        ? {
            code: 'PAC',
            name: 'PAC - Encomenda Econômica',
            price: Number(pacPrice.toFixed(2)),
            deliveryDays: pacDays,
            estimatedDelivery: `${pacDays} dias úteis`,
          }
        : null,
      sedexPrice && sedexDays
        ? {
            code: 'SEDEX',
            name: 'SEDEX - Entrega Expressa',
            price: Number(sedexPrice.toFixed(2)),
            deliveryDays: sedexDays,
            estimatedDelivery: `${sedexDays} dias úteis`,
          }
        : null,
    ].filter(Boolean)

    if (shippingOptions.length === 0) {
      return NextResponse.json({
        shippingOptions: simulateShipping(
          cep,
          weight,
          dimensions,
          resolvedDefaultCost,
          resolvedExpressMultiplier
        ),
        zipCode: cep,
        freeShippingMin,
      })
    }

    return NextResponse.json({ shippingOptions, zipCode: cep, freeShippingMin })
  } catch (error) {
    console.error('Erro ao calcular frete:', error)
    return NextResponse.json(
      { error: 'Erro ao calcular frete' },
      { status: 500 }
    )
  }
}
