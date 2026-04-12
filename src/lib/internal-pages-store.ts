import { db } from '@/lib/db'
import {
  DEFAULT_INTERNAL_PAGES,
  InternalPageConfig,
  InternalPageSlug,
  getDefaultInternalPage,
} from '@/lib/internal-pages-defaults'

type InternalPageDbRow = {
  page_slug: string
  title: string
  content_json: string
}

type InternalPageUpdateInput = {
  slug: string
  title: string
  content: Record<string, unknown>
}

let bootstrapPromise: Promise<void> | null = null

function safeParseJsonObject(rawValue: string) {
  try {
    const parsed = JSON.parse(rawValue)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function ensureInternalPagesStore() {
  if (bootstrapPromise) {
    return bootstrapPromise
  }

  bootstrapPromise = (async () => {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "InternalPageConfig" (
        "page_slug" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "content_json" TEXT NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    for (const page of DEFAULT_INTERNAL_PAGES) {
      await db.$executeRawUnsafe(
        `
          INSERT INTO "InternalPageConfig" ("page_slug", "title", "content_json")
          VALUES ($1, $2, $3)
          ON CONFLICT ("page_slug") DO NOTHING
        `,
        page.slug,
        page.title,
        JSON.stringify(page.content)
      )
    }
  })()

  return bootstrapPromise
}

function mapRowToPage(row: InternalPageDbRow): InternalPageConfig | null {
  const defaults = getDefaultInternalPage(row.page_slug)
  if (!defaults) {
    return null
  }

  const parsedContent = safeParseJsonObject(row.content_json)
  return {
    slug: row.page_slug as InternalPageSlug,
    title: row.title || defaults.title,
    content: {
      ...defaults.content,
      ...parsedContent,
    },
  }
}

export async function getAllInternalPages() {
  await ensureInternalPagesStore()

  const rows = await db.$queryRawUnsafe<InternalPageDbRow[]>(
    `
      SELECT
        "page_slug",
        "title",
        "content_json"
      FROM "InternalPageConfig"
      ORDER BY "page_slug" ASC
    `
  )

  return rows
    .map(mapRowToPage)
    .filter((page): page is InternalPageConfig => Boolean(page))
}

export async function getInternalPage(slug: string) {
  await ensureInternalPagesStore()

  const rows = await db.$queryRawUnsafe<InternalPageDbRow[]>(
    `
      SELECT
        "page_slug",
        "title",
        "content_json"
      FROM "InternalPageConfig"
      WHERE "page_slug" = $1
      LIMIT 1
    `,
    slug
  )

  const first = rows[0]
  if (!first) {
    const defaults = getDefaultInternalPage(slug)
    return defaults || null
  }

  return mapRowToPage(first)
}

function normalizePagesPayload(pages: InternalPageUpdateInput[]) {
  return pages
    .map((page) => {
      const defaults = getDefaultInternalPage(page.slug)
      if (!defaults) return null

      return {
        slug: defaults.slug,
        title: String(page.title || defaults.title).trim() || defaults.title,
        content:
          page.content && typeof page.content === 'object'
            ? {
                ...defaults.content,
                ...page.content,
              }
            : defaults.content,
      }
    })
    .filter((page): page is NonNullable<typeof page> => Boolean(page))
}

export async function saveInternalPages(pages: InternalPageUpdateInput[]) {
  await ensureInternalPagesStore()
  const normalized = normalizePagesPayload(pages)
  if (normalized.length === 0) {
    return getAllInternalPages()
  }

  await db.$transaction(
    normalized.map((page) =>
      db.$executeRawUnsafe(
        `
          UPDATE "InternalPageConfig"
          SET
            "title" = $2,
            "content_json" = $3,
            "updated_at" = NOW()
          WHERE "page_slug" = $1
        `,
        page.slug,
        page.title,
        JSON.stringify(page.content)
      )
    )
  )

  return getAllInternalPages()
}

