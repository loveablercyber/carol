import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// POST /api/auth/register - Registrar novo usuário
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, cpf, birthday } = body

    if (!name || !email || !password || !cpf || !birthday) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se email ou CPF já existe
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email },
          { cpf }
        ]
      },
    })

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: 'Email já cadastrado' },
          { status: 409 }
        )
      }
      if (existingUser.cpf === cpf) {
        return NextResponse.json(
          { error: 'CPF já cadastrado' },
          { status: 409 }
        )
      }
    }

    // Criar hash da senha
    const passwordHash = await bcrypt.hash(password, 12)

    // Criar usuário
    const user = await db.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        cpf,
        birthday: new Date(birthday),
        role: 'customer',
      },
    })

    return NextResponse.json({
      message: 'Usuário criado com sucesso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao registrar usuário:', error)
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    )
  }
}
