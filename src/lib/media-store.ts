import { db } from '@/lib/db'

export type MediaAsset = {
  id: string
  fileName: string
  mimeType: string
  sizeBytes: number
  url: string
  createdAt: string
}

type MediaAssetRow = {
  id: string
  file_name: string
  mime_type: string
  size_bytes: number
  data_base64: string
  created_at: Date | string
}

let bootstrapPromise: Promise<void> | null = null

async function ensureMediaStore() {
  if (bootstrapPromise) return bootstrapPromise

  bootstrapPromise = (async () => {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "MediaAsset" (
        "id" TEXT PRIMARY KEY,
        "file_name" TEXT NOT NULL,
        "mime_type" TEXT NOT NULL,
        "size_bytes" INTEGER NOT NULL,
        "data_base64" TEXT NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
  })()

  return bootstrapPromise
}

function asIsoDate(value: Date | string) {
  if (value instanceof Date) return value.toISOString()
  return new Date(value).toISOString()
}

function publicUrl(id: string) {
  return `/api/media/${id}`
}

function mapAsset(row: MediaAssetRow): MediaAsset {
  return {
    id: row.id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes || 0),
    url: publicUrl(row.id),
    createdAt: asIsoDate(row.created_at),
  }
}

export async function createMediaAsset(input: {
  fileName: string
  mimeType: string
  sizeBytes: number
  dataBase64: string
}) {
  await ensureMediaStore()

  const id = `med_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  await db.$executeRawUnsafe(
    `
      INSERT INTO "MediaAsset" (
        "id",
        "file_name",
        "mime_type",
        "size_bytes",
        "data_base64"
      )
      VALUES ($1,$2,$3,$4,$5)
    `,
    id,
    input.fileName,
    input.mimeType,
    input.sizeBytes,
    input.dataBase64
  )

  return getMediaAsset(id)
}

export async function getMediaAsset(id: string) {
  await ensureMediaStore()

  const rows = await db.$queryRawUnsafe<MediaAssetRow[]>(
    `
      SELECT
        "id",
        "file_name",
        "mime_type",
        "size_bytes",
        "data_base64",
        "created_at"
      FROM "MediaAsset"
      WHERE "id" = $1
      LIMIT 1
    `,
    id
  )

  return rows[0] ? mapAsset(rows[0]) : null
}

export async function getMediaAssetData(id: string) {
  await ensureMediaStore()

  const rows = await db.$queryRawUnsafe<MediaAssetRow[]>(
    `
      SELECT
        "id",
        "file_name",
        "mime_type",
        "size_bytes",
        "data_base64",
        "created_at"
      FROM "MediaAsset"
      WHERE "id" = $1
      LIMIT 1
    `,
    id
  )

  return rows[0] || null
}
