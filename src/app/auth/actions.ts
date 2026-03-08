'use server'

import {
  clearCurrentSession,
  createSession,
  getCurrentUser,
  hashPassword,
  normalizeUsername,
  verifyPassword,
} from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(32)
  .regex(/^[a-zA-Z0-9._-]+$/)

const passwordSchema = z.string().min(8).max(72)

function safeRedirectPath(
  rawPath: FormDataEntryValue | null | undefined,
  fallback: string,
) {
  if (typeof rawPath !== 'string' || !rawPath.startsWith('/')) return fallback
  if (rawPath.startsWith('//')) return fallback
  return rawPath
}

export async function signupAction(formData: FormData) {
  const maybeUser = await getCurrentUser()
  if (maybeUser) redirect('/groups')

  const parsed = z
    .object({
      username: usernameSchema,
      password: passwordSchema,
      confirmPassword: passwordSchema,
    })
    .safeParse({
      username: formData.get('username'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    })

  if (!parsed.success || parsed.data.password !== parsed.data.confirmPassword) {
    redirect('/signup?error=invalid_input')
  }

  const normalizedUsername = normalizeUsername(parsed.data.username)

  try {
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        username: normalizedUsername,
        passwordHash: await hashPassword(parsed.data.password),
      },
    })

    await createSession(user.id, false)
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      redirect('/signup?error=username_taken')
    }

    throw error
  }

  redirect('/groups')
}

export async function loginAction(formData: FormData) {
  const maybeUser = await getCurrentUser()
  if (maybeUser) redirect('/groups')

  const parsed = z
    .object({
      username: usernameSchema,
      password: z.string(),
      rememberMe: z.boolean(),
      next: z.string().optional(),
    })
    .safeParse({
      username: formData.get('username'),
      password: formData.get('password'),
      rememberMe: formData.get('rememberMe') === 'on',
      next: formData.get('next') ?? undefined,
    })

  if (!parsed.success) {
    redirect('/signin?error=invalid_input')
  }

  const user = await prisma.user.findUnique({
    where: {
      username: normalizeUsername(parsed.data.username),
    },
  })

  if (!user) {
    redirect('/signin?error=invalid_credentials')
  }

  const isPasswordValid = await verifyPassword(
    parsed.data.password,
    user.passwordHash,
  )

  if (!isPasswordValid) {
    redirect('/signin?error=invalid_credentials')
  }

  await createSession(user.id, parsed.data.rememberMe)

  redirect(safeRedirectPath(parsed.data.next, '/groups'))
}

export async function logoutAction() {
  await clearCurrentSession()
  redirect('/signin')
}
