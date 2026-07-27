export const INSTITUTIONAL_DOMAIN = 'colegiopedropalacios.edu.mx'
export const SESSION_COOKIE = 'cpp_session'
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7
export const PASSWORD_ITERATIONS = 210000
export const PRIMARY_ADMIN_ID = 'primary-admin-samuel'
export const PRIMARY_ADMIN_EMAIL =
  'samuel-sistemas@colegiopedropalacios.edu.mx'

const encoder = new TextEncoder()

function bytesToBase64Url(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

function base64UrlToBytes(value) {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

export function isInstitutionalEmail(email) {
  const normalized = normalizeEmail(email)
  const [localPart, domain, extra] = normalized.split('@')
  return Boolean(localPart && domain === INSTITUTIONAL_DOMAIN && !extra)
}

export function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 10) {
    return 'La contraseña debe tener al menos 10 caracteres.'
  }
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(password) || !/\d/.test(password)) {
    return 'La contraseña debe incluir al menos una letra y un número.'
  }
  return ''
}

export function getAdminEmails(env) {
  return new Set(
    String(env.ADMIN_EMAILS || '')
      .split(',')
      .map(normalizeEmail)
      .filter(isInstitutionalEmail),
  )
}

export function getAllowedEmails(env) {
  return new Set(
    String(env.ALLOWED_EMAILS || '')
      .split(',')
      .map(normalizeEmail)
      .filter(isInstitutionalEmail),
  )
}

export async function hashPassword(
  password,
  salt = crypto.getRandomValues(new Uint8Array(16)),
  iterations = PASSWORD_ITERATIONS,
) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations,
    },
    keyMaterial,
    256,
  )

  return {
    hash: bytesToBase64Url(new Uint8Array(bits)),
    salt: bytesToBase64Url(salt),
    iterations,
  }
}

export async function verifyPassword(password, expectedHash, salt, iterations) {
  const result = await hashPassword(
    password,
    base64UrlToBytes(salt),
    iterations,
  )
  const actual = encoder.encode(result.hash)
  const expected = encoder.encode(expectedHash)

  if (actual.length !== expected.length) return false
  let difference = 0
  for (let index = 0; index < actual.length; index += 1) {
    difference |= actual[index] ^ expected[index]
  }
  return difference === 0
}

export function createSessionToken() {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)))
}

export async function hashSessionToken(token) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token))
  return bytesToBase64Url(new Uint8Array(digest))
}

export function readSessionToken(request) {
  const cookie = request.headers.get('Cookie') || ''
  const item = cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
  return item ? decodeURIComponent(item.slice(SESSION_COOKIE.length + 1)) : ''
}

export function createSessionCookie(token, request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DURATION_SECONDS}${secure}`
}

export function clearSessionCookie(request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
}

export function sessionExpiry() {
  return new Date(Date.now() + SESSION_DURATION_SECONDS * 1000).toISOString()
}

export function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  }
}
