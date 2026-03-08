jest.mock('@/lib/auth', () => ({
  clearCurrentSession: jest.fn(),
  createSession: jest.fn(),
  getCurrentUser: jest.fn(),
  hashPassword: jest.fn(),
  normalizeUsername: jest.fn((username: string) =>
    username.trim().toLowerCase(),
  ),
  verifyPassword: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`)
  }),
}))

import * as auth from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

import { loginAction, logoutAction, signupAction } from './actions'

const mockClearCurrentSession = auth.clearCurrentSession as jest.Mock
const mockCreateSession = auth.createSession as jest.Mock
const mockGetCurrentUser = auth.getCurrentUser as jest.Mock
const mockHashPassword = auth.hashPassword as jest.Mock
const mockNormalizeUsername = auth.normalizeUsername as jest.Mock
const mockVerifyPassword = auth.verifyPassword as jest.Mock

const mockPrismaUserCreate = prisma.user.create as jest.Mock
const mockPrismaUserFindUnique = prisma.user.findUnique as jest.Mock

const mockRedirect = redirect as unknown as jest.Mock

function buildFormData(values: Record<string, string>) {
  const formData = new FormData()
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value)
  }
  return formData
}

describe('auth actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetCurrentUser.mockResolvedValue(null)
  })

  it('signs up and creates a non-remembered session', async () => {
    mockHashPassword.mockResolvedValue('hashed-password')
    mockPrismaUserCreate.mockResolvedValue({ id: 'user-1' })

    await expect(
      signupAction(
        buildFormData({
          username: 'Alice',
          password: 'password123',
          confirmPassword: 'password123',
        }),
      ),
    ).rejects.toThrow('REDIRECT:/groups')

    expect(mockPrismaUserCreate).toHaveBeenCalled()
    expect(mockCreateSession).toHaveBeenCalledWith('user-1', false)
  })

  it('redirects signup when username already exists', async () => {
    mockHashPassword.mockResolvedValue('hashed-password')

    const duplicateError = new Error('duplicate username') as Error & {
      code: string
    }
    duplicateError.code = 'P2002'
    mockPrismaUserCreate.mockRejectedValue(duplicateError)

    await expect(
      signupAction(
        buildFormData({
          username: 'Alice',
          password: 'password123',
          confirmPassword: 'password123',
        }),
      ),
    ).rejects.toThrow('REDIRECT:/signup?error=username_taken')
  })

  it('logs in with remember me and redirects to requested path', async () => {
    mockPrismaUserFindUnique.mockResolvedValue({
      id: 'user-1',
      passwordHash: 'stored-hash',
    })
    mockVerifyPassword.mockResolvedValue(true)

    const formData = buildFormData({
      username: 'Alice',
      password: 'password123',
      next: '/groups/abc',
    })
    formData.set('rememberMe', 'on')

    await expect(loginAction(formData)).rejects.toThrow('REDIRECT:/groups/abc')

    expect(mockNormalizeUsername).toHaveBeenCalledWith('Alice')
    expect(mockCreateSession).toHaveBeenCalledWith('user-1', true)
  })

  it('rejects invalid login credentials', async () => {
    mockPrismaUserFindUnique.mockResolvedValue(null)

    await expect(
      loginAction(
        buildFormData({
          username: 'Alice',
          password: 'wrong-password',
        }),
      ),
    ).rejects.toThrow('REDIRECT:/signin?error=invalid_credentials')
  })

  it('logs out and clears session', async () => {
    await expect(logoutAction()).rejects.toThrow('REDIRECT:/signin')
    expect(mockClearCurrentSession).toHaveBeenCalledTimes(1)
    expect(mockRedirect).toHaveBeenCalledWith('/signin')
  })
})
