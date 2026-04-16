import { NextResponse } from 'next/server'
import { getMediaAssetData } from '@/lib/media-store'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const asset = await getMediaAssetData(id)

  if (!asset) {
    return NextResponse.json({ error: 'Midia nao encontrada' }, { status: 404 })
  }

  const body = Buffer.from(asset.data_base64, 'base64')

  return new NextResponse(body, {
    headers: {
      'Content-Type': asset.mime_type,
      'Content-Length': String(asset.size_bytes),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
