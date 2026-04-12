import { db } from '@/lib/db'

export type SavedCardRecord = {
  id: string
  userId: string
  label: string
  holderName: string
  brand: string
  last4: string
  expiryMonth: number
  expiryYear: number
  documentNumber: string | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

type SavedCardRow = {
  id: string
  user_id: string
  label: string
  holder_name: string
  brand: string
  last4: string
  expiry_month: number
  expiry_year: number
  document_number: string | null
  is_default: boolean
  created_at: Date | string
  updated_at: Date | string
}

type CreateSavedCardInput = {
  userId: string
  label: string
  holderName: string
  brand: string
  last4: string
  expiryMonth: number
  expiryYear: number
  documentNumber?: string | null
  isDefault?: boolean
}

type UpdateSavedCardInput = Partial<
  Omit<CreateSavedCardInput, 'userId'> & {
    isDefault: boolean
  }
>

let bootstrapPromise: Promise<void> | null = null

function asIso(value: Date | string) {
  if (value instanceof Date) return value.toISOString()
  return new Date(value).toISOString()
}

function maskDigits(value: string) {
  return value.replace(/\D/g, '')
}

function mapRow(row: SavedCardRow): SavedCardRecord {
  return {
    id: row.id,
    userId: row.user_id,
    label: row.label,
    holderName: row.holder_name,
    brand: row.brand,
    last4: row.last4,
    expiryMonth: Number(row.expiry_month || 1),
    expiryYear: Number(row.expiry_year || 2030),
    documentNumber: row.document_number,
    isDefault: Boolean(row.is_default),
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at),
  }
}

async function ensureSavedCardsStore() {
  if (bootstrapPromise) return bootstrapPromise

  bootstrapPromise = (async () => {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CustomerSavedCard" (
        "id" TEXT PRIMARY KEY,
        "user_id" TEXT NOT NULL,
        "label" TEXT NOT NULL,
        "holder_name" TEXT NOT NULL,
        "brand" TEXT NOT NULL,
        "last4" TEXT NOT NULL,
        "expiry_month" INTEGER NOT NULL,
        "expiry_year" INTEGER NOT NULL,
        "document_number" TEXT NULL,
        "is_default" BOOLEAN NOT NULL DEFAULT FALSE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "idx_saved_card_user" ON "CustomerSavedCard" ("user_id")`
    )
  })()

  return bootstrapPromise
}

export async function listSavedCards(userId: string) {
  await ensureSavedCardsStore()
  const rows = await db.$queryRawUnsafe<SavedCardRow[]>(
    `
      SELECT
        "id",
        "user_id",
        "label",
        "holder_name",
        "brand",
        "last4",
        "expiry_month",
        "expiry_year",
        "document_number",
        "is_default",
        "created_at",
        "updated_at"
      FROM "CustomerSavedCard"
      WHERE "user_id" = $1
      ORDER BY "is_default" DESC, "created_at" DESC
    `,
    userId
  )

  return rows.map(mapRow)
}

export async function createSavedCard(input: CreateSavedCardInput) {
  await ensureSavedCardsStore()

  const id = `card_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const normalizedLast4 = maskDigits(input.last4).slice(-4)
  const normalizedDoc = input.documentNumber ? maskDigits(input.documentNumber) : null

  if (input.isDefault) {
    await db.$executeRawUnsafe(
      `
        UPDATE "CustomerSavedCard"
        SET "is_default" = FALSE
        WHERE "user_id" = $1
      `,
      input.userId
    )
  }

  await db.$executeRawUnsafe(
    `
      INSERT INTO "CustomerSavedCard" (
        "id",
        "user_id",
        "label",
        "holder_name",
        "brand",
        "last4",
        "expiry_month",
        "expiry_year",
        "document_number",
        "is_default"
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    `,
    id,
    input.userId,
    input.label || 'Cartao',
    input.holderName,
    input.brand,
    normalizedLast4,
    Number(input.expiryMonth || 1),
    Number(input.expiryYear || 2030),
    normalizedDoc,
    Boolean(input.isDefault)
  )

  const cards = await listSavedCards(input.userId)
  return cards.find((card) => card.id === id) || null
}

export async function updateSavedCard(userId: string, cardId: string, input: UpdateSavedCardInput) {
  await ensureSavedCardsStore()

  if (input.isDefault) {
    await db.$executeRawUnsafe(
      `
        UPDATE "CustomerSavedCard"
        SET "is_default" = FALSE
        WHERE "user_id" = $1
      `,
      userId
    )
  }

  await db.$executeRawUnsafe(
    `
      UPDATE "CustomerSavedCard"
      SET
        "label" = COALESCE($3, "label"),
        "holder_name" = COALESCE($4, "holder_name"),
        "brand" = COALESCE($5, "brand"),
        "last4" = COALESCE($6, "last4"),
        "expiry_month" = COALESCE($7, "expiry_month"),
        "expiry_year" = COALESCE($8, "expiry_year"),
        "document_number" = COALESCE($9, "document_number"),
        "is_default" = COALESCE($10, "is_default"),
        "updated_at" = NOW()
      WHERE "user_id" = $1
        AND "id" = $2
    `,
    userId,
    cardId,
    input.label || null,
    input.holderName || null,
    input.brand || null,
    input.last4 ? maskDigits(input.last4).slice(-4) : null,
    input.expiryMonth !== undefined ? Number(input.expiryMonth) : null,
    input.expiryYear !== undefined ? Number(input.expiryYear) : null,
    input.documentNumber !== undefined ? (input.documentNumber ? maskDigits(input.documentNumber) : null) : null,
    input.isDefault !== undefined ? Boolean(input.isDefault) : null
  )

  const cards = await listSavedCards(userId)
  return cards.find((card) => card.id === cardId) || null
}

export async function deleteSavedCard(userId: string, cardId: string) {
  await ensureSavedCardsStore()

  const currentCards = await listSavedCards(userId)
  const removed = currentCards.find((card) => card.id === cardId)
  if (!removed) return false

  await db.$executeRawUnsafe(
    `
      DELETE FROM "CustomerSavedCard"
      WHERE "user_id" = $1
        AND "id" = $2
    `,
    userId,
    cardId
  )

  if (removed.isDefault) {
    const nextCards = await listSavedCards(userId)
    if (nextCards[0]) {
      await db.$executeRawUnsafe(
        `
          UPDATE "CustomerSavedCard"
          SET "is_default" = TRUE, "updated_at" = NOW()
          WHERE "id" = $1
        `,
        nextCards[0].id
      )
    }
  }

  return true
}
