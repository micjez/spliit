jest.mock('@/lib/prisma', () => ({
  prisma: {
    group: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    userGroup: {
      upsert: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

jest.mock('nanoid', () => ({
  nanoid: () => 'mock-id',
}))

import { prisma } from '@/lib/prisma'
import {
  associateUserWithGroup,
  associateUserWithGroups,
  listUserGroups,
} from './api'

const mockGroupFindUnique = prisma.group.findUnique as jest.Mock
const mockGroupFindMany = prisma.group.findMany as jest.Mock
const mockUserGroupUpsert = prisma.userGroup.upsert as jest.Mock
const mockUserGroupCreateMany = prisma.userGroup.createMany as jest.Mock
const mockUserGroupFindMany = prisma.userGroup.findMany as jest.Mock

describe('user-group association helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('associates a user with an existing group idempotently', async () => {
    mockGroupFindUnique.mockResolvedValue({ id: 'group-1' })

    await associateUserWithGroup('user-1', 'group-1')

    expect(mockUserGroupUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_groupId: {
            userId: 'user-1',
            groupId: 'group-1',
          },
        },
        update: {},
        create: expect.objectContaining({
          userId: 'user-1',
          groupId: 'group-1',
        }),
      }),
    )
  })

  it('throws for single-group association when group does not exist', async () => {
    mockGroupFindUnique.mockResolvedValue(null)

    await expect(associateUserWithGroup('user-1', 'missing')).rejects.toThrow(
      'Invalid group ID: missing',
    )
    expect(mockUserGroupUpsert).not.toHaveBeenCalled()
  })

  it('bulk-associates only unique valid groups and skips duplicates', async () => {
    mockGroupFindMany.mockResolvedValue([{ id: 'g-1' }, { id: 'g-2' }])
    mockUserGroupCreateMany.mockResolvedValue({ count: 2 })

    const result = await associateUserWithGroups('user-1', [
      'g-1',
      'g-1',
      'missing',
      'g-2',
    ])

    expect(result).toEqual({ associatedCount: 2 })
    expect(mockUserGroupCreateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skipDuplicates: true,
        data: expect.arrayContaining([
          expect.objectContaining({ userId: 'user-1', groupId: 'g-1' }),
          expect.objectContaining({ userId: 'user-1', groupId: 'g-2' }),
        ]),
      }),
    )
    expect(mockUserGroupCreateMany.mock.calls[0][0].data).toHaveLength(2)
  })

  it('lists user groups sorted by association date and serializes createdAt', async () => {
    const createdAt = new Date('2026-03-08T10:00:00.000Z')
    mockUserGroupFindMany.mockResolvedValue([
      {
        group: {
          id: 'group-1',
          name: 'Trip',
          information: null,
          currency: '$',
          currencyCode: 'USD',
          createdAt,
          _count: { participants: 3 },
        },
      },
    ])

    const groups = await listUserGroups('user-1')

    expect(mockUserGroupFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        orderBy: [{ createdAt: 'desc' }],
      }),
    )
    expect(groups).toEqual([
      expect.objectContaining({
        id: 'group-1',
        name: 'Trip',
        createdAt: createdAt.toISOString(),
      }),
    ])
  })
})
