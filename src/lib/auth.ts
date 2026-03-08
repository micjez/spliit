import 'server-only'

import { AUTH_COOKIE_NAME } from '@/lib/auth-constants'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)

const SESSION_TTL_SECONDS = 60 * 60 * 24
const REMEMBER_ME_TTL_SECONDS = 60 * 60 * 24 * 30
const PASSWORD_SALT_BYTES = 16
const PASSWORD_KEYLEN = 64
const SESSION_TOKEN_BYTES = 32

export type AuthUser = {
  id: string
  username: string
}

function getTokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function getSessionExpiryDate(rememberMe: boolean) {
  return new Date(
    Date.now() +
      (rememberMe ? REMEMBER_ME_TTL_SECONDS : SESSION_TTL_SECONDS) * 1000,
  )
}

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase()
}

export async function hashPassword(password: string) {
  const salt = randomBytes(PASSWORD_SALT_BYTES).toString('hex')
  const hash = (await scrypt(password, salt, PASSWORD_KEYLEN)) as Buffer
  return `${salt}:${hash.toString('hex')}`
}

export async function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedHashHex] = passwordHash.split(':')
  if (!salt || !storedHashHex) return false

  const computedHash = (await scrypt(password, salt, PASSWORD_KEYLEN)) as Buffer
  const storedHash = Buffer.from(storedHashHex, 'hex')

  if (computedHash.length !== storedHash.length) return false
  return timingSafeEqual(computedHash, storedHash)
}

export async function createSession(userId: string, rememberMe: boolean) {
  const token = randomBytes(SESSION_TOKEN_BYTES).toString('base64url')
  const tokenHash = getTokenHash(token)
  const expiresAt = getSessionExpiryDate(rememberMe)

  await prisma.authSession.create({
    data: {
      id: randomUUID(),
      tokenHash,
      rememberMe,
      expiresAt,
      userId,
    },
  })
  ;(await cookies()).set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    ...(rememberMe ? { maxAge: REMEMBER_ME_TTL_SECONDS } : {}),
  })
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value
  if (!token) return null

  const session = await prisma.authSession.findUnique({
    where: {
      tokenHash: getTokenHash(token),
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  })

  if (!session) {
    ;(await cookies()).delete(AUTH_COOKIE_NAME)
    return null
  }

  if (session.expiresAt <= new Date()) {
    await prisma.authSession.delete({ where: { id: session.id } })
    ;(await cookies()).delete(AUTH_COOKIE_NAME)
    return null
  }

  return session.user
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/signin')
  return user
}

export async function clearCurrentSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (token) {
    await prisma.authSession.deleteMany({
      where: {
        tokenHash: getTokenHash(token),
      },
    })
  }

  cookieStore.delete(AUTH_COOKIE_NAME)
}
