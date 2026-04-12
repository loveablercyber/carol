type MercadoPagoEnv = 'test' | 'prod'

type ResolveMercadoPagoConfigInput = {
  requestOrigin?: string
}

export type MercadoPagoConfig = {
  env: MercadoPagoEnv
  accessToken: string
  publicKey: string
  baseUrl: string
}

function normalizeEnv(rawValue?: string): MercadoPagoEnv {
  const normalized = (rawValue || '').toLowerCase()
  if (normalized !== 'test' && normalized !== 'prod') {
    throw new Error("MP_ENV obrigatorio. Use 'test' ou 'prod'.")
  }
  return normalized
}

function ensurePresent(value: string, keyName: string): string {
  if (!value) {
    throw new Error(`${keyName} obrigatorio para o ambiente selecionado.`)
  }
  return value
}

function enforceCredentialPrefix(
  env: MercadoPagoEnv,
  token: string,
  publicKey: string
) {
  const tokenIsTest = token.startsWith('TEST-')
  const publicKeyIsTest = publicKey.startsWith('TEST-')
  const credentialPrefix = (value: string) => value.split('-')[0] || 'missing'

  if (env === 'test' && (!tokenIsTest || !publicKeyIsTest)) {
    throw new Error(
      `Ambiente TEST requer credenciais TEST-* (token=${credentialPrefix(token)}, publicKey=${credentialPrefix(publicKey)}).`
    )
  }

  if (env === 'prod' && (tokenIsTest || publicKeyIsTest)) {
    throw new Error('Ambiente PROD nao aceita credenciais TEST-*.')
  }

  if (looksLikeAccessToken(publicKey)) {
    const publicKeyVarName =
      env === 'test'
        ? 'NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_TEST'
        : 'NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_PROD'

    throw new Error(
      `${publicKeyVarName} invalida: o valor informado parece ACCESS TOKEN. Configure essa variavel com a Public Key da conta ${env.toUpperCase()}.`
    )
  }
}

function looksLikeAccessToken(value: string): boolean {
  const parts = value.trim().split('-')
  if (parts.length !== 5) return false

  const [prefix, appId, userId, hash, checksum] = parts
  if (prefix !== 'APP_USR' && prefix !== 'TEST') return false

  return (
    /^\d{10,20}$/.test(appId) &&
    /^\d{4,8}$/.test(userId) &&
    /^[a-f0-9]{32}$/i.test(hash) &&
    /^\d{8,12}$/.test(checksum)
  )
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
      ? ensurePresent(
          process.env.MERCADOPAGO_ACCESS_TOKEN_TEST ||
            process.env.MERCADOPAGO_ACCESS_TOKEN ||
            '',
          'MERCADOPAGO_ACCESS_TOKEN_TEST'
        )
      : ensurePresent(
          process.env.MERCADOPAGO_ACCESS_TOKEN_PROD ||
            process.env.MERCADOPAGO_ACCESS_TOKEN ||
            '',
          'MERCADOPAGO_ACCESS_TOKEN_PROD'
        )
  const publicKey =
    env === 'test'
      ? ensurePresent(
          process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_TEST ||
            process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ||
            process.env.MERCADOPAGO_PUBLIC_KEY ||
            '',
          'NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_TEST'
        )
      : ensurePresent(
          process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_PROD ||
            process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ||
            process.env.MERCADOPAGO_PUBLIC_KEY ||
            '',
          'NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_PROD'
        )

  enforceCredentialPrefix(env, accessToken, publicKey)

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
  }
}
