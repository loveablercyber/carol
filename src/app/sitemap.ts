import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  let products: Array<{ slug: string; updatedAt: Date }> = []
  try {
    products = await db.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    })
  } catch {
    products = []
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date() },
    { url: `${baseUrl}/services`, lastModified: new Date() },
    { url: `${baseUrl}/shop`, lastModified: new Date() },
  ]

  const productRoutes = products.map((product) => ({
    url: `${baseUrl}/shop/products/${product.slug}`,
    lastModified: product.updatedAt,
  }))

  return [...staticRoutes, ...productRoutes]
}
