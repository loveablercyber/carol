import { NextRequest, NextResponse } from 'next/server'

const parseAddress = (data: any) => {
  if (!data) return null
  const street = data.logradouro || data.rua || data.endereco || data.street
  const neighborhood = data.bairro || data.neighborhood
  const city = data.localidade || data.cidade || data.city
  const state = data.uf || data.estado || data.state
  const complement = data.complemento || data.complement
  if (!street || !neighborhood || !city || !state) return null
  return { street, neighborhood, city, state, complement: complement || '' }
}

export async function GET(request: NextRequest) {
  try {
    const zip = request.nextUrl.searchParams.get('zip') || ''
    const cep = zip.replace(/\D/g, '')
    if (cep.length !== 8) {
      return NextResponse.json({ error: 'CEP inválido' }, { status: 400 })
    }

    const token = process.env.CORREIOS_TOKEN
    if (token) {
      try {
        const response = await fetch(
          `https://api.correios.com.br/cep/v1/enderecos/${cep}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          }
        )
        if (response.ok) {
          const data = await response.json()
          const address = parseAddress(data)
          if (address) {
            return NextResponse.json({ address, source: 'correios' })
          }
        }
      } catch (error) {
        console.error('Erro ao consultar Correios:', error)
      }
    }

    const viacep = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    if (!viacep.ok) {
      return NextResponse.json({ error: 'CEP não encontrado' }, { status: 404 })
    }
    const viacepData = await viacep.json()
    if (viacepData?.erro) {
      return NextResponse.json({ error: 'CEP não encontrado' }, { status: 404 })
    }
    const address = parseAddress(viacepData)
    if (!address) {
      return NextResponse.json({ error: 'CEP não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ address, source: 'viacep' })
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
    return NextResponse.json({ error: 'Erro ao buscar CEP' }, { status: 500 })
  }
}
