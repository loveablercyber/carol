import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { createMediaAsset } from '@/lib/media-store'

const MAX_FILE_SIZE_BYTES = 6 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Faça login antes de enviar a foto da avaliação.' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Use uma imagem JPG, PNG ou WEBP.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Limite de 6 MB.' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const asset = await createMediaAsset({
      fileName: file.name || 'foto-avaliacao',
      mimeType: file.type,
      sizeBytes: file.size,
      dataBase64: buffer.toString('base64'),
    })

    return NextResponse.json({ asset, url: asset?.url || null })
  } catch (error) {
    console.error('Erro ao enviar foto pelo chatbot:', error)
    return NextResponse.json({ error: 'Erro ao enviar foto' }, { status: 500 })
  }
}
