import { db } from '@/lib/db'

export type ShippingRuleScope = 'CATEGORY' | 'PRODUCT'

export type ShippingSettings = {
  config: {
    id: string
    originZipCode: string
    defaultCost: number
    expressMultiplier: number
    freeShippingMin: number
    enableCorreios: boolean
  }
  rules: Array<{
    id: string
    scope: ShippingRuleScope
    targetId: string
    targetLabel: string | null
    fixedCost: number
    deliveryDays: number
    isActive: boolean
  }>
}

type ShippingConfigRow = {
  id: string
  origin_zip_code: string
  default_cost: number | string
  express_multiplier: number | string
  free_shipping_min: number | string
  enable_correios: boolean
}

type ShippingRuleRow = {
  id: string
  scope: string
  target_id: string
  target_label: string | null
  fixed_cost: number | string
  delivery_days: number
  is_active: boolean
}

type SaveShippingSettingsInput = {
  config: {
    originZipCode: string
    defaultCost: number
    expressMultiplier: number
    freeShippingMin: number
    enableCorreios: boolean
  }
  rules: Array<{
    id?: string
    scope: ShippingRuleScope
    targetId: string
    targetLabel?: string | null
    fixedCost: number
    deliveryDays: number
    isActive: boolean
  }>
}

let bootstrapPromise: Promise<void> | null = null

async function ensureShippingStore() {
  if (bootstrapPromise) return bootstrapPromise

  bootstrapPromise = (async () => {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ShippingConfig" (
        "id" TEXT PRIMARY KEY,
        "origin_zip_code" TEXT NOT NULL DEFAULT '01001001',
        "default_cost" NUMERIC(10,2) NOT NULL DEFAULT 20,
        "express_multiplier" NUMERIC(10,2) NOT NULL DEFAULT 2.5,
        "free_shipping_min" NUMERIC(10,2) NOT NULL DEFAULT 300,
        "enable_correios" BOOLEAN NOT NULL DEFAULT TRUE,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ShippingRule" (
        "id" TEXT PRIMARY KEY,
        "scope" TEXT NOT NULL,
        "target_id" TEXT NOT NULL,
        "target_label" TEXT NULL,
        "fixed_cost" NUMERIC(10,2) NOT NULL,
        "delivery_days" INTEGER NOT NULL DEFAULT 7,
        "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "idx_shipping_rule_scope_target" ON "ShippingRule" ("scope", "target_id")`
    )

    await db.$executeRawUnsafe(
      `
        INSERT INTO "ShippingConfig" (
          "id",
          "origin_zip_code",
          "default_cost",
          "express_multiplier",
          "free_shipping_min",
          "enable_correios"
        )
        VALUES ('default', '01001001', 20, 2.5, 300, TRUE)
        ON CONFLICT ("id") DO NOTHING
      `
    )
  })()

  return bootstrapPromise
}

function mapConfig(row: ShippingConfigRow) {
  return {
    id: row.id,
    originZipCode: row.origin_zip_code,
    defaultCost: Number(row.default_cost || 0),
    expressMultiplier: Number(row.express_multiplier || 2.5),
    freeShippingMin: Number(row.free_shipping_min || 300),
    enableCorreios: Boolean(row.enable_correios),
  }
}

function mapRule(row: ShippingRuleRow) {
  return {
    id: row.id,
    scope: row.scope === 'PRODUCT' ? 'PRODUCT' : 'CATEGORY',
    targetId: row.target_id,
    targetLabel: row.target_label,
    fixedCost: Number(row.fixed_cost || 0),
    deliveryDays: Number(row.delivery_days || 7),
    isActive: Boolean(row.is_active),
  }
}

export async function getShippingSettings(): Promise<ShippingSettings> {
  await ensureShippingStore()

  const configRows = await db.$queryRawUnsafe<ShippingConfigRow[]>(
    `
      SELECT
        "id",
        "origin_zip_code",
        "default_cost",
        "express_multiplier",
        "free_shipping_min",
        "enable_correios"
      FROM "ShippingConfig"
      WHERE "id" = 'default'
      LIMIT 1
    `
  )

  const ruleRows = await db.$queryRawUnsafe<ShippingRuleRow[]>(
    `
      SELECT
        "id",
        "scope",
        "target_id",
        "target_label",
        "fixed_cost",
        "delivery_days",
        "is_active"
      FROM "ShippingRule"
      ORDER BY "scope" ASC, "target_label" ASC, "target_id" ASC
    `
  )

  const config = configRows[0]
    ? mapConfig(configRows[0])
    : {
        id: 'default',
        originZipCode: '01001001',
        defaultCost: 20,
        expressMultiplier: 2.5,
        freeShippingMin: 300,
        enableCorreios: true,
      }

  return {
    config,
    rules: ruleRows.map(mapRule),
  }
}

export async function saveShippingSettings(input: SaveShippingSettingsInput) {
  await ensureShippingStore()

  const originZip = String(input.config.originZipCode || '')
    .replace(/\D/g, '')
    .slice(0, 8)

  await db.$executeRawUnsafe(
    `
      UPDATE "ShippingConfig"
      SET
        "origin_zip_code" = $2,
        "default_cost" = $3,
        "express_multiplier" = $4,
        "free_shipping_min" = $5,
        "enable_correios" = $6,
        "updated_at" = NOW()
      WHERE "id" = $1
    `,
    'default',
    originZip || '01001001',
    Number(input.config.defaultCost || 0),
    Number(input.config.expressMultiplier || 2.5),
    Number(input.config.freeShippingMin || 300),
    Boolean(input.config.enableCorreios)
  )

  await db.$executeRawUnsafe(`DELETE FROM "ShippingRule"`)

  for (const rule of input.rules || []) {
    if (!rule.targetId) continue
    const id = rule.id || `ship_rule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    await db.$executeRawUnsafe(
      `
        INSERT INTO "ShippingRule" (
          "id",
          "scope",
          "target_id",
          "target_label",
          "fixed_cost",
          "delivery_days",
          "is_active"
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `,
      id,
      rule.scope === 'PRODUCT' ? 'PRODUCT' : 'CATEGORY',
      rule.targetId,
      rule.targetLabel || null,
      Number(rule.fixedCost || 0),
      Number(rule.deliveryDays || 7),
      Boolean(rule.isActive)
    )
  }

  return getShippingSettings()
}

export async function findShippingRule(input: {
  productIds?: string[]
  categoryIds?: string[]
}) {
  await ensureShippingStore()
  const productIds = Array.isArray(input.productIds) ? input.productIds.filter(Boolean) : []
  const categoryIds = Array.isArray(input.categoryIds) ? input.categoryIds.filter(Boolean) : []

  if (productIds.length > 0) {
    const productRule = await db.$queryRawUnsafe<ShippingRuleRow[]>(
      `
        SELECT
          "id",
          "scope",
          "target_id",
          "target_label",
          "fixed_cost",
          "delivery_days",
          "is_active"
        FROM "ShippingRule"
        WHERE "scope" = 'PRODUCT'
          AND "is_active" = TRUE
          AND "target_id" = ANY($1::text[])
        ORDER BY "target_label" ASC
        LIMIT 1
      `,
      productIds
    )
    if (productRule[0]) return mapRule(productRule[0])
  }

  if (categoryIds.length > 0) {
    const categoryRule = await db.$queryRawUnsafe<ShippingRuleRow[]>(
      `
        SELECT
          "id",
          "scope",
          "target_id",
          "target_label",
          "fixed_cost",
          "delivery_days",
          "is_active"
        FROM "ShippingRule"
        WHERE "scope" = 'CATEGORY'
          AND "is_active" = TRUE
          AND "target_id" = ANY($1::text[])
        ORDER BY "target_label" ASC
        LIMIT 1
      `,
      categoryIds
    )
    if (categoryRule[0]) return mapRule(categoryRule[0])
  }

  return null
}
