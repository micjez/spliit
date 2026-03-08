jest.mock('@/lib/prisma', () => ({
  prisma: {
    authSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  })),
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`)
  }),
}))

import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

import { createSession, getCurrentUser } from './auth'

const mockAuthSessionCreate = prisma.authSession.create as jest.Mock
const mockAuthSessionFindUnique = prisma.authSession.findUnique as jest.Mock
const mockAuthSessionDelete = prisma.authSession.delete as jest.Mock

const mockCookies = cookies as jest.Mock

describe('auth session helpers', () => {
  const cookieStore = {
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockCookies.mockResolvedValue(cookieStore)
  })

  it('sets persistent cookie when remember me is enabled', async () => {
    await createSession('user-1', true)

    expect(mockAuthSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          rememberMe: true,
        }),
      }),
    )

    expect(cookieStore.set).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'auth_session',
        maxAge: 60 * 60 * 24 * 30,
      }),
    )
  })

  it('sets session cookie without maxAge when remember me is disabled', async () => {
    await createSession('user-1', false)

    const cookieArg = cookieStore.set.mock.calls[0][0]
    expect(cookieArg.name).toBe('auth_session')
    expect(cookieArg.maxAge).toBeUndefined()
  })

  it('clears expired sessions when current user is fetched', async () => {
    cookieStore.get.mockReturnValue({ value: 'session-token' })
    mockAuthSessionFindUnique.mockResolvedValue({
      id: 'session-1',
      expiresAt: new Date(Date.now() - 5_000),
      user: {
        id: 'user-1',
        username: 'alice',
      },
    })

    const user = await getCurrentUser()

    expect(user).toBeNull()
    expect(mockAuthSessionDelete).toHaveBeenCalledWith({
      where: { id: 'session-1' },
    })
    expect(cookieStore.delete).toHaveBeenCalledWith('auth_session')
  })
})
