import { db } from '@/lib/db'

export default async function Head({
  params,
}: {
  params: { slug: string }
}) {
  const product = await db.product.findUnique({
    where: { slug: params.slug },
  })

  if (!product) {
    return (
      <>
        <title>Produto | CarolSol Studio</title>
        <meta name="robots" content="noindex" />
      </>
    )
  }

  return (
    <>
      <title>{product.seoTitle || product.name} | CarolSol Studio</title>
      <meta
        name="description"
        content={product.seoDescription || product.shortDescription || product.name}
      />
      <meta property="og:title" content={product.seoTitle || product.name} />
      <meta
        property="og:description"
        content={product.seoDescription || product.shortDescription || product.name}
      />
    </>
  )
}
