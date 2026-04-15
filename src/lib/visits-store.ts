import { db } from '@/lib/db'

type VisitCountRow = {
  count: number | bigint | string
}

let bootstrapPromise: Promise<void> | null = null

function getTodayDateKey() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(new Date())
}

async function ensureVisitsStore() {
  if (bootstrapPromise) return bootstrapPromise

  bootstrapPromise = (async () => {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "WebsiteDailyVisit" (
        "id" TEXT PRIMARY KEY,
        "visitor_id" TEXT NOT NULL,
        "visit_date" DATE NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "website_daily_visit_unique_visitor_day"
          UNIQUE ("visitor_id", "visit_date")
      )
    `)

    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "idx_website_daily_visit_date" ON "WebsiteDailyVisit" ("visit_date")`
    )
  })()

  return bootstrapPromise
}

export function normalizeVisitorId(value?: string | null) {
  if (!value || !/^[a-zA-Z0-9_-]{8,120}$/.test(value)) {
    return crypto.randomUUID()
  }
  return value
}

export async function registerDailyVisit(visitorId: string) {
  await ensureVisitsStore()
  const visitDate = getTodayDateKey()

  await db.$executeRawUnsafe(
    `
      INSERT INTO "WebsiteDailyVisit" ("id", "visitor_id", "visit_date")
      VALUES ($1, $2, $3::date)
      ON CONFLICT ("visitor_id", "visit_date") DO NOTHING
    `,
    `visit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    visitorId,
    visitDate
  )

  return getDailyVisitCount()
}

export async function getDailyVisitCount() {
  await ensureVisitsStore()
  const visitDate = getTodayDateKey()

  const rows = await db.$queryRawUnsafe<VisitCountRow[]>(
    `
      SELECT COUNT(*) AS "count"
      FROM "WebsiteDailyVisit"
      WHERE "visit_date" = $1::date
    `,
    visitDate
  )

  return Number(rows[0]?.count || 0)
}
