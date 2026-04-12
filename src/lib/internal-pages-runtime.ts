import { InternalPageSlug, getDefaultInternalPage } from '@/lib/internal-pages-defaults'

export function asString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback
}

export function asStringArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) return fallback
  const normalized = value.filter((item): item is string => typeof item === 'string')
  return normalized.length > 0 ? normalized : fallback
}

export function asObjectArray<T extends Record<string, unknown>>(
  value: unknown,
  fallback: T[] = []
) {
  if (!Array.isArray(value)) return fallback
  const normalized = value.filter(
    (item): item is T => Boolean(item && typeof item === 'object' && !Array.isArray(item))
  )
  return normalized.length > 0 ? normalized : fallback
}

export async function loadInternalPageContent(slug: InternalPageSlug) {
  const defaults = getDefaultInternalPage(slug)
  const fallback = defaults?.content || {}

  try {
    const response = await fetch(`/api/internal-pages/${slug}`, {
      cache: 'no-store',
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || !data?.page?.content || typeof data.page.content !== 'object') {
      return fallback
    }

    return {
      ...fallback,
      ...data.page.content,
    }
  } catch {
    return fallback
  }
}

