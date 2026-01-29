import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth-options'
import { db } from '@/lib/db'

const ensureAdmin = async () => {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'admin') {
    return null
  }
  return session
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await ensureAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = await params
    const userId = id?.trim()
    if (!userId) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await request.json()
    const data: Record<string, any> = {}

    if (body.name !== undefined) data.name = body.name || null
    if (body.email) data.email = String(body.email).toLowerCase()
    if (body.role) data.role = body.role === 'admin' ? 'admin' : 'customer'
    if (body.cpf !== undefined) data.cpf = body.cpf || null
    if (body.birthday) data.birthday = new Date(body.birthday)
    if (body.birthday === '' || body.birthday === null) data.birthday = null

    if (body.password) {
      data.password = await bcrypt.hash(String(body.password), 10)
    }

    const updated = await db.user.update({
      where: { id: userId },
      data,
    })

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
    })
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar cliente' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await ensureAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = await params
    const userId = id?.trim()
    if (!userId) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    if (session.user?.id === userId) {
      return NextResponse.json(
        { error: 'Você não pode remover sua própria conta' },
        { status: 400 }
      )
    }

    const existing = await db.user.findUnique({ where: { id: userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    if (existing.role === 'admin') {
      const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim()
      if (superAdminEmail && existing.email.toLowerCase() === superAdminEmail) {
        return NextResponse.json(
          { error: 'Não é possível remover o superadmin' },
          { status: 400 }
        )
      }

      const adminCount = await db.user.count({ where: { role: 'admin' } })
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Você não pode remover o último administrador' },
          { status: 400 }
        )
      }
    }

    await db.user.delete({ where: { id: userId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao remover cliente:', error)
    return NextResponse.json(
      { error: 'Erro ao remover cliente' },
      { status: 500 }
    )
  }
}
