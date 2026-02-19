type MercadoPagoEnv = 'test' | 'prod'

type ResolveMercadoPagoConfigInput = {
  requestOrigin?: string
}

export type MercadoPagoConfig = {
  env: MercadoPagoEnv
  accessToken: string
  publicKey: string
  baseUrl: string
  redirectField: 'sandbox_init_point' | 'init_point'
}

function normalizeEnv(rawValue?: string): MercadoPagoEnv {
  return (rawValue || '').toLowerCase() === 'test' ? 'test' : 'prod'
}

function ensureAbsoluteHttpsBaseUrl(rawValue: string): string {
  const baseUrl = rawValue.trim().replace(/\/+$/, '')
  let parsedUrl: URL
  try {
    parsedUrl = new URL(baseUrl)
  } catch {
    throw new Error('BASE_URL invalida. Use URL absoluta https://')
  }

  if (parsedUrl.protocol !== 'https:') {
    throw new Error('BASE_URL deve usar HTTPS em ambiente publicado.')
  }

  if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
    throw new Error('BASE_URL nao pode apontar para localhost.')
  }

  return parsedUrl.origin
}

export function resolveMercadoPagoConfig(
  input: ResolveMercadoPagoConfigInput = {}
): MercadoPagoConfig {
  const env = normalizeEnv(process.env.MP_ENV)
  const accessToken =
    env === 'test'
      ? process.env.MERCADOPAGO_ACCESS_TOKEN_TEST || process.env.MERCADOPAGO_ACCESS_TOKEN || ''
      : process.env.MERCADOPAGO_ACCESS_TOKEN_PROD || process.env.MERCADOPAGO_ACCESS_TOKEN || ''
  const publicKey =
    env === 'test'
      ? process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_TEST ||
        process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ||
        process.env.MERCADOPAGO_PUBLIC_KEY ||
        ''
      : process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_PROD ||
        process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ||
        process.env.MERCADOPAGO_PUBLIC_KEY ||
        ''

  const baseUrlSource =
    process.env.BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    input.requestOrigin ||
    ''
  const baseUrl = ensureAbsoluteHttpsBaseUrl(baseUrlSource)

  return {
    env,
    accessToken,
    publicKey,
    baseUrl,
    redirectField: env === 'test' ? 'sandbox_init_point' : 'init_point',
  }
}

