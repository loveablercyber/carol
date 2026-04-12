import { db } from '@/lib/db'
import {
  DEFAULT_HOME_MODULES,
  HomeModuleConfig,
  HomeModuleKey,
  getDefaultHomeModule,
} from '@/lib/home-modules-defaults'

type HomeModuleDbRow = {
  module_key: string
  icon: string
  title: string
  subtitle: string
  description: string
  button_text: string
  href: string | null
  image: string | null
  color: string
  text_color: string
  shadow: string | null
  is_primary: boolean
  open_chatbot: boolean
  instagram_url: string | null
  instagram_photos_json: string | null
  plans_json: string | null
  enabled: boolean
  position: number
}

type HomeModuleUpdateInput = {
  key: string
  title: string
  subtitle: string
  description: string
  buttonText: string
  href?: string
  image?: string
  color: string
  textColor: string
  shadow?: string
  isPrimary?: boolean
  openChatbot?: boolean
  instagramUrl?: string
  instagramPhotos?: string[]
  plans?: string[]
  enabled: boolean
  position: number
}

let bootstrapPromise: Promise<void> | null = null

function parseArrayJson(rawValue: string | null): string[] {
  if (!rawValue) return []

  try {
    const parsed = JSON.parse(rawValue)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((value): value is string => typeof value === 'string')
  } catch {
    return []
  }
}

function normalizeOptionalString(value?: string | null) {
  const normalized = String(value || '').trim()
  return normalized || undefined
}

function mapRowToModule(row: HomeModuleDbRow): HomeModuleConfig | null {
  const defaults = getDefaultHomeModule(row.module_key)
  if (!defaults) {
    return null
  }

  return {
    key: row.module_key as HomeModuleKey,
    icon: row.icon as HomeModuleConfig['icon'],
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    buttonText: row.button_text,
    href: normalizeOptionalString(row.href),
    image: normalizeOptionalString(row.image),
    color: row.color || defaults.color,
    textColor: row.text_color || defaults.textColor,
    shadow: normalizeOptionalString(row.shadow),
    isPrimary: Boolean(row.is_primary),
    openChatbot: Boolean(row.open_chatbot),
    instagramUrl: normalizeOptionalString(row.instagram_url),
    instagramPhotos: parseArrayJson(row.instagram_photos_json),
    plans: parseArrayJson(row.plans_json),
    enabled: Boolean(row.enabled),
    position: Number(row.position || 0),
  }
}

async function ensureHomeModulesStore() {
  if (bootstrapPromise) {
    return bootstrapPromise
  }

  bootstrapPromise = (async () => {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "HomeModuleConfig" (
        "module_key" TEXT PRIMARY KEY,
        "icon" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "subtitle" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "button_text" TEXT NOT NULL,
        "href" TEXT NULL,
        "image" TEXT NULL,
        "color" TEXT NOT NULL,
        "text_color" TEXT NOT NULL,
        "shadow" TEXT NULL,
        "is_primary" BOOLEAN NOT NULL DEFAULT FALSE,
        "open_chatbot" BOOLEAN NOT NULL DEFAULT FALSE,
        "instagram_url" TEXT NULL,
        "instagram_photos_json" TEXT NULL,
        "plans_json" TEXT NULL,
        "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
        "position" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    for (const homeModule of DEFAULT_HOME_MODULES) {
      await db.$executeRawUnsafe(
        `
          INSERT INTO "HomeModuleConfig" (
            "module_key",
            "icon",
            "title",
            "subtitle",
            "description",
            "button_text",
            "href",
            "image",
            "color",
            "text_color",
            "shadow",
            "is_primary",
            "open_chatbot",
            "instagram_url",
            "instagram_photos_json",
            "plans_json",
            "enabled",
            "position"
          )
          VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
          )
          ON CONFLICT ("module_key") DO NOTHING
        `,
        homeModule.key,
        homeModule.icon,
        homeModule.title,
        homeModule.subtitle,
        homeModule.description,
        homeModule.buttonText,
        homeModule.href || null,
        homeModule.image || null,
        homeModule.color,
        homeModule.textColor,
        homeModule.shadow || null,
        Boolean(homeModule.isPrimary),
        Boolean(homeModule.openChatbot),
        homeModule.instagramUrl || null,
        JSON.stringify(homeModule.instagramPhotos || []),
        JSON.stringify(homeModule.plans || []),
        Boolean(homeModule.enabled),
        homeModule.position
      )
    }
  })()

  return bootstrapPromise
}

function normalizeModulesPayload(inputModules: HomeModuleUpdateInput[]) {
  return inputModules
    .map((module, index) => {
      const defaults = getDefaultHomeModule(module.key)
      if (!defaults) return null

      return {
        key: defaults.key,
        icon: defaults.icon,
        title: String(module.title || defaults.title).trim() || defaults.title,
        subtitle: String(module.subtitle || defaults.subtitle).trim() || defaults.subtitle,
        description:
          String(module.description || defaults.description).trim() || defaults.description,
        buttonText:
          String(module.buttonText || defaults.buttonText).trim() || defaults.buttonText,
        href: normalizeOptionalString(module.href),
        image: normalizeOptionalString(module.image),
        color: String(module.color || defaults.color).trim() || defaults.color,
        textColor: String(module.textColor || defaults.textColor).trim() || defaults.textColor,
        shadow: normalizeOptionalString(module.shadow),
        isPrimary: Boolean(module.isPrimary),
        openChatbot: Boolean(module.openChatbot),
        instagramUrl: normalizeOptionalString(module.instagramUrl),
        instagramPhotos: Array.isArray(module.instagramPhotos)
          ? module.instagramPhotos.filter((value) => typeof value === 'string')
          : defaults.instagramPhotos || [],
        plans: Array.isArray(module.plans)
          ? module.plans.filter((value) => typeof value === 'string')
          : defaults.plans || [],
        enabled: Boolean(module.enabled),
        position: Number.isFinite(module.position) ? Number(module.position) : index,
      }
    })
    .filter((module): module is NonNullable<typeof module> => Boolean(module))
}

export async function getAllHomeModules() {
  await ensureHomeModulesStore()
  const rows = await db.$queryRawUnsafe<HomeModuleDbRow[]>(
    `
      SELECT
        "module_key",
        "icon",
        "title",
        "subtitle",
        "description",
        "button_text",
        "href",
        "image",
        "color",
        "text_color",
        "shadow",
        "is_primary",
        "open_chatbot",
        "instagram_url",
        "instagram_photos_json",
        "plans_json",
        "enabled",
        "position"
      FROM "HomeModuleConfig"
      ORDER BY "position" ASC, "module_key" ASC
    `
  )

  return rows
    .map(mapRowToModule)
    .filter((module): module is HomeModuleConfig => Boolean(module))
}

export async function getVisibleHomeModules() {
  const modules = await getAllHomeModules()
  return modules.filter((module) => module.enabled)
}

export async function saveHomeModules(modules: HomeModuleUpdateInput[]) {
  await ensureHomeModulesStore()

  const normalized = normalizeModulesPayload(modules)
  if (normalized.length === 0) {
    return getAllHomeModules()
  }

  await db.$transaction(
    normalized.map((module) =>
      db.$executeRawUnsafe(
        `
          UPDATE "HomeModuleConfig"
          SET
            "title" = $2,
            "subtitle" = $3,
            "description" = $4,
            "button_text" = $5,
            "href" = $6,
            "image" = $7,
            "color" = $8,
            "text_color" = $9,
            "shadow" = $10,
            "is_primary" = $11,
            "open_chatbot" = $12,
            "instagram_url" = $13,
            "instagram_photos_json" = $14,
            "plans_json" = $15,
            "enabled" = $16,
            "position" = $17,
            "updated_at" = NOW()
          WHERE "module_key" = $1
        `,
        module.key,
        module.title,
        module.subtitle,
        module.description,
        module.buttonText,
        module.href || null,
        module.image || null,
        module.color,
        module.textColor,
        module.shadow || null,
        module.isPrimary,
        module.openChatbot,
        module.instagramUrl || null,
        JSON.stringify(module.instagramPhotos || []),
        JSON.stringify(module.plans || []),
        module.enabled,
        module.position
      )
    )
  )

  return getAllHomeModules()
}
