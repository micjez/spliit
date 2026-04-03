import { prisma } from '@/lib/prisma'
import {
  ExpenseFormValues,
  GroupFormValues,
  ShoppingItemFormValues,
  StockItemFormValues,
} from '@/lib/schemas'
import {
  ActivityType,
  Expense,
  RecurrenceRule,
  RecurringExpenseLink,
} from '@prisma/client'
import { nanoid } from 'nanoid'

export function randomId() {
  return nanoid()
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

export async function createGroup(groupFormValues: GroupFormValues) {
  return prisma.group.create({
    data: {
      id: randomId(),
      name: groupFormValues.name,
      information: groupFormValues.information,
      currency: groupFormValues.currency,
      currencyCode: groupFormValues.currencyCode,
      participants: {
        createMany: {
          data: groupFormValues.participants.map(({ name }) => ({
            id: randomId(),
            name,
          })),
        },
      },
    },
    include: { participants: true },
  })
}

export async function createExpense(
  expenseFormValues: ExpenseFormValues,
  groupId: string,
  participantId?: string,
): Promise<Expense> {
  const group = await getGroup(groupId)
  if (!group) throw new Error(`Invalid group ID: ${groupId}`)

  for (const participant of [
    expenseFormValues.paidBy,
    ...expenseFormValues.paidFor.map((p) => p.participant),
  ]) {
    if (!group.participants.some((p) => p.id === participant))
      throw new Error(`Invalid participant ID: ${participant}`)
  }

  const expenseId = randomId()
  await logActivity(groupId, ActivityType.CREATE_EXPENSE, {
    participantId,
    expenseId,
    data: expenseFormValues.title,
  })

  const isCreateRecurrence =
    expenseFormValues.recurrenceRule !== RecurrenceRule.NONE
  const recurringExpenseLinkPayload = createPayloadForNewRecurringExpenseLink(
    expenseFormValues.recurrenceRule as RecurrenceRule,
    expenseFormValues.expenseDate,
    groupId,
  )

  return prisma.expense.create({
    data: {
      id: expenseId,
      groupId,
      expenseDate: expenseFormValues.expenseDate,
      categoryId: expenseFormValues.category,
      amount: expenseFormValues.amount,
      originalAmount: expenseFormValues.originalAmount,
      originalCurrency: expenseFormValues.originalCurrency,
      conversionRate: expenseFormValues.conversionRate,
      title: expenseFormValues.title,
      paidById: expenseFormValues.paidBy,
      splitMode: expenseFormValues.splitMode,
      recurrenceRule: expenseFormValues.recurrenceRule,
      recurringExpenseLink: {
        ...(isCreateRecurrence
          ? {
              create: recurringExpenseLinkPayload,
            }
          : {}),
      },
      paidFor: {
        createMany: {
          data: expenseFormValues.paidFor.map((paidFor) => ({
            participantId: paidFor.participant,
            shares: paidFor.shares,
          })),
        },
      },
      isReimbursement: expenseFormValues.isReimbursement,
      documents: {
        createMany: {
          data: expenseFormValues.documents.map((doc) => ({
            id: randomId(),
            url: doc.url,
            width: doc.width,
            height: doc.height,
          })),
        },
      },
      notes: expenseFormValues.notes,
    },
  })
}

export async function deleteExpense(
  groupId: string,
  expenseId: string,
  participantId?: string,
) {
  const existingExpense = await getExpense(groupId, expenseId)
  await logActivity(groupId, ActivityType.DELETE_EXPENSE, {
    participantId,
    expenseId,
    data: existingExpense?.title,
  })

  await prisma.expense.delete({
    where: { id: expenseId },
    include: { paidFor: true, paidBy: true },
  })
}

export async function getGroupExpensesParticipants(groupId: string) {
  const expenses = await getGroupExpenses(groupId)
  return Array.from(
    new Set(
      expenses.flatMap((e) => [
        e.paidBy.id,
        ...e.paidFor.map((pf) => pf.participant.id),
      ]),
    ),
  )
}

export async function getGroups(groupIds: string[]) {
  return (
    await prisma.group.findMany({
      where: { id: { in: groupIds } },
      include: { _count: { select: { participants: true } } },
    })
  ).map((group) => ({
    ...group,
    createdAt: group.createdAt.toISOString(),
  }))
}

export async function listUserGroups(userId: string) {
  return (
    await prisma.userGroup.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }],
      include: {
        group: {
          include: { _count: { select: { participants: true } } },
        },
      },
    })
  ).map(({ group }) => ({
    ...group,
    createdAt: group.createdAt.toISOString(),
  }))
}

export async function associateUserWithGroup(userId: string, groupId: string) {
  const groupExists = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true },
  })
  if (!groupExists) {
    throw new Error(`Invalid group ID: ${groupId}`)
  }

  await prisma.userGroup.upsert({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
    update: {},
    create: {
      id: randomId(),
      userId,
      groupId,
    },
  })
}

export async function associateUserWithGroups(
  userId: string,
  groupIds: string[],
) {
  const uniqueGroupIds = Array.from(new Set(groupIds.filter(Boolean)))
  if (uniqueGroupIds.length === 0) return { associatedCount: 0 }

  const existingGroupIds = new Set(
    (
      await prisma.group.findMany({
        where: { id: { in: uniqueGroupIds } },
        select: { id: true },
      })
    ).map((group) => group.id),
  )

  const validGroupIds = uniqueGroupIds.filter((groupId) =>
    existingGroupIds.has(groupId),
  )
  if (validGroupIds.length === 0) return { associatedCount: 0 }

  const result = await prisma.userGroup.createMany({
    data: validGroupIds.map((groupId) => ({
      id: randomId(),
      userId,
      groupId,
    })),
    skipDuplicates: true,
  })

  return { associatedCount: result.count }
}

export async function isUserAssociatedWithGroup(
  userId: string,
  groupId: string,
) {
  const association = await prisma.userGroup.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
    select: { id: true },
  })

  return association !== null
}

export async function assertUserCanAccessGroup(
  userId: string,
  groupId: string,
) {
  if (!(await isUserAssociatedWithGroup(userId, groupId))) {
    throw new Error('User is not associated with this group.')
  }
}

export async function updateExpense(
  groupId: string,
  expenseId: string,
  expenseFormValues: ExpenseFormValues,
  participantId?: string,
) {
  const group = await getGroup(groupId)
  if (!group) throw new Error(`Invalid group ID: ${groupId}`)

  const existingExpense = await getExpense(groupId, expenseId)
  if (!existingExpense) throw new Error(`Invalid expense ID: ${expenseId}`)

  for (const participant of [
    expenseFormValues.paidBy,
    ...expenseFormValues.paidFor.map((p) => p.participant),
  ]) {
    if (!group.participants.some((p) => p.id === participant))
      throw new Error(`Invalid participant ID: ${participant}`)
  }

  await logActivity(groupId, ActivityType.UPDATE_EXPENSE, {
    participantId,
    expenseId,
    data: expenseFormValues.title,
  })

  const isDeleteRecurrenceExpenseLink =
    existingExpense.recurrenceRule !== RecurrenceRule.NONE &&
    expenseFormValues.recurrenceRule === RecurrenceRule.NONE &&
    // Delete the existing RecurrenceExpenseLink only if it has not been acted upon yet
    existingExpense.recurringExpenseLink?.nextExpenseCreatedAt === null

  const isUpdateRecurrenceExpenseLink =
    existingExpense.recurrenceRule !== expenseFormValues.recurrenceRule &&
    // Update the exisiting RecurrenceExpenseLink only if it has not been acted upon yet
    existingExpense.recurringExpenseLink?.nextExpenseCreatedAt === null
  const isCreateRecurrenceExpenseLink =
    existingExpense.recurrenceRule === RecurrenceRule.NONE &&
    expenseFormValues.recurrenceRule !== RecurrenceRule.NONE &&
    // Create a new RecurrenceExpenseLink only if one does not already exist for the expense
    existingExpense.recurringExpenseLink === null

  const newRecurringExpenseLink = createPayloadForNewRecurringExpenseLink(
    expenseFormValues.recurrenceRule as RecurrenceRule,
    expenseFormValues.expenseDate,
    groupId,
  )

  const updatedRecurrenceExpenseLinkNextExpenseDate = calculateNextDate(
    expenseFormValues.recurrenceRule as RecurrenceRule,
    existingExpense.expenseDate,
  )

  return prisma.expense.update({
    where: { id: expenseId },
    data: {
      expenseDate: expenseFormValues.expenseDate,
      amount: expenseFormValues.amount,
      originalAmount: expenseFormValues.originalAmount,
      originalCurrency: expenseFormValues.originalCurrency,
      conversionRate: expenseFormValues.conversionRate,
      title: expenseFormValues.title,
      categoryId: expenseFormValues.category,
      paidById: expenseFormValues.paidBy,
      splitMode: expenseFormValues.splitMode,
      recurrenceRule: expenseFormValues.recurrenceRule,
      paidFor: {
        create: expenseFormValues.paidFor
          .filter(
            (p) =>
              !existingExpense.paidFor.some(
                (pp) => pp.participantId === p.participant,
              ),
          )
          .map((paidFor) => ({
            participantId: paidFor.participant,
            shares: paidFor.shares,
          })),
        update: expenseFormValues.paidFor.map((paidFor) => ({
          where: {
            expenseId_participantId: {
              expenseId,
              participantId: paidFor.participant,
            },
          },
          data: {
            shares: paidFor.shares,
          },
        })),
        deleteMany: existingExpense.paidFor.filter(
          (paidFor) =>
            !expenseFormValues.paidFor.some(
              (pf) => pf.participant === paidFor.participantId,
            ),
        ),
      },
      recurringExpenseLink: {
        ...(isCreateRecurrenceExpenseLink
          ? {
              create: newRecurringExpenseLink,
            }
          : {}),
        ...(isUpdateRecurrenceExpenseLink
          ? {
              update: {
                nextExpenseDate: updatedRecurrenceExpenseLinkNextExpenseDate,
              },
            }
          : {}),
        delete: isDeleteRecurrenceExpenseLink,
      },
      isReimbursement: expenseFormValues.isReimbursement,
      documents: {
        connectOrCreate: expenseFormValues.documents.map((doc) => ({
          create: doc,
          where: { id: doc.id },
        })),
        deleteMany: existingExpense.documents
          .filter(
            (existingDoc) =>
              !expenseFormValues.documents.some(
                (doc) => doc.id === existingDoc.id,
              ),
          )
          .map((doc) => ({
            id: doc.id,
          })),
      },
      notes: expenseFormValues.notes,
    },
  })
}

export async function updateGroup(
  groupId: string,
  groupFormValues: GroupFormValues,
  participantId?: string,
) {
  const existingGroup = await getGroup(groupId)
  if (!existingGroup) throw new Error('Invalid group ID')

  await logActivity(groupId, ActivityType.UPDATE_GROUP, { participantId })

  return prisma.group.update({
    where: { id: groupId },
    data: {
      name: groupFormValues.name,
      information: groupFormValues.information,
      currency: groupFormValues.currency,
      currencyCode: groupFormValues.currencyCode,
      participants: {
        deleteMany: existingGroup.participants.filter(
          (p) => !groupFormValues.participants.some((p2) => p2.id === p.id),
        ),
        updateMany: groupFormValues.participants
          .filter((participant) => participant.id !== undefined)
          .map((participant) => ({
            where: { id: participant.id },
            data: {
              name: participant.name,
            },
          })),
        createMany: {
          data: groupFormValues.participants
            .filter((participant) => participant.id === undefined)
            .map((participant) => ({
              id: randomId(),
              name: participant.name,
            })),
        },
      },
    },
  })
}

export async function getGroup(groupId: string) {
  return prisma.group.findUnique({
    where: { id: groupId },
    include: { participants: true },
  })
}

export async function getCategories() {
  return prisma.category.findMany()
}

export async function getGroupShoppingItems(groupId: string) {
  return prisma.shoppingItem.findMany({
    where: { groupId },
    include: {
      category: true,
      createdByUser: {
        select: { id: true, username: true },
      },
      boughtByUser: {
        select: { id: true, username: true },
      },
    },
    orderBy: [{ isArchived: 'asc' }, { createdAt: 'desc' }],
  })
}

export async function getGroupShoppingItemsByStatus(
  groupId: string,
  options?: {
    offset?: number
    length?: number
    status?: 'ACTIVE' | 'ARCHIVED'
  },
) {
  const status = options?.status ?? 'ACTIVE'

  return prisma.shoppingItem.findMany({
    where: {
      groupId,
      isArchived: status === 'ARCHIVED',
    },
    include: {
      category: true,
      createdByUser: {
        select: { id: true, username: true },
      },
      boughtByUser: {
        select: { id: true, username: true },
      },
      stockItem: {
        select: { id: true, title: true },
      },
    },
    orderBy:
      status === 'ARCHIVED'
        ? [{ boughtAt: 'desc' }, { archivedAt: 'desc' }, { createdAt: 'desc' }]
        : [{ createdAt: 'desc' }],
    skip: options?.offset,
    take: options?.length,
  })
}

export async function getShoppingItem(groupId: string, shoppingItemId: string) {
  return prisma.shoppingItem.findFirst({
    where: {
      id: shoppingItemId,
      groupId,
    },
    include: {
      category: true,
      createdByUser: {
        select: { id: true, username: true },
      },
      boughtByUser: {
        select: { id: true, username: true },
      },
      stockItem: {
        select: { id: true, title: true },
      },
    },
  })
}

export async function createShoppingItem(
  groupId: string,
  userId: string,
  shoppingItemFormValues: ShoppingItemFormValues,
  options?: { stockItemId?: string | null },
) {
  await assertUserCanAccessGroup(userId, groupId)
  const stockItemId = options?.stockItemId ?? null

  if (stockItemId) {
    await getStockItemForGroup(groupId, stockItemId)

    const activeLinkedShoppingItem = await prisma.shoppingItem.findFirst({
      where: {
        groupId,
        stockItemId,
        isArchived: false,
      },
      select: { id: true },
    })

    if (activeLinkedShoppingItem) {
      throw new Error('This stock item already has an active shopping item.')
    }
  }

  return prisma.shoppingItem.create({
    data: {
      id: randomId(),
      title: shoppingItemFormValues.title.trim(),
      quantity: shoppingItemFormValues.quantity.toString(),
      unit: shoppingItemFormValues.unit.trim(),
      notes: shoppingItemFormValues.notes?.trim() || null,
      categoryId:
        shoppingItemFormValues.categoryId &&
        shoppingItemFormValues.categoryId > 0
          ? shoppingItemFormValues.categoryId
          : null,
      groupId,
      createdByUserId: userId,
      stockItemId,
    },
    include: {
      category: true,
      createdByUser: {
        select: { id: true, username: true },
      },
      boughtByUser: {
        select: { id: true, username: true },
      },
      stockItem: {
        select: { id: true, title: true },
      },
    },
  })
}

export async function updateShoppingItem(
  groupId: string,
  shoppingItemId: string,
  userId: string,
  shoppingItemFormValues: ShoppingItemFormValues,
) {
  await assertUserCanAccessGroup(userId, groupId)
  await getShoppingItemForGroup(groupId, shoppingItemId)

  return prisma.shoppingItem.update({
    where: { id: shoppingItemId },
    data: {
      title: shoppingItemFormValues.title.trim(),
      quantity: shoppingItemFormValues.quantity.toString(),
      unit: shoppingItemFormValues.unit.trim(),
      notes: shoppingItemFormValues.notes?.trim() || null,
      categoryId:
        shoppingItemFormValues.categoryId &&
        shoppingItemFormValues.categoryId > 0
          ? shoppingItemFormValues.categoryId
          : null,
    },
    include: {
      category: true,
      createdByUser: {
        select: { id: true, username: true },
      },
      boughtByUser: {
        select: { id: true, username: true },
      },
      stockItem: {
        select: { id: true, title: true },
      },
    },
  })
}

export async function markShoppingItemBought(
  groupId: string,
  shoppingItemId: string,
  userId: string,
) {
  await assertUserCanAccessGroup(userId, groupId)
  await getShoppingItemForGroup(groupId, shoppingItemId)

  const now = new Date()
  return prisma.shoppingItem.update({
    where: { id: shoppingItemId },
    data: {
      isBought: true,
      isArchived: true,
      boughtAt: now,
      archivedAt: now,
      boughtByUserId: userId,
    },
    include: {
      category: true,
      createdByUser: {
        select: { id: true, username: true },
      },
      boughtByUser: {
        select: { id: true, username: true },
      },
      stockItem: {
        select: { id: true, title: true },
      },
    },
  })
}

export async function restoreShoppingItem(
  groupId: string,
  shoppingItemId: string,
  userId: string,
) {
  await assertUserCanAccessGroup(userId, groupId)
  await getShoppingItemForGroup(groupId, shoppingItemId)

  return prisma.shoppingItem.update({
    where: { id: shoppingItemId },
    data: {
      isBought: false,
      isArchived: false,
      boughtAt: null,
      archivedAt: null,
      boughtByUserId: null,
    },
    include: {
      category: true,
      createdByUser: {
        select: { id: true, username: true },
      },
      boughtByUser: {
        select: { id: true, username: true },
      },
      stockItem: {
        select: { id: true, title: true },
      },
    },
  })
}

export async function deleteShoppingItem(
  groupId: string,
  shoppingItemId: string,
  userId: string,
) {
  await assertUserCanAccessGroup(userId, groupId)
  await getShoppingItemForGroup(groupId, shoppingItemId)

  return prisma.shoppingItem.delete({
    where: { id: shoppingItemId },
  })
}

async function getShoppingItemForGroup(
  groupId: string,
  shoppingItemId: string,
) {
  const shoppingItem = await prisma.shoppingItem.findFirst({
    where: {
      id: shoppingItemId,
      groupId,
    },
    select: { id: true },
  })

  if (!shoppingItem) {
    throw new Error('Invalid shopping item ID.')
  }

  return shoppingItem
}

export async function getGroupStockItems(groupId: string) {
  return prisma.stockItem.findMany({
    where: { groupId },
    include: {
      category: true,
      createdByUser: {
        select: { id: true, username: true },
      },
      lastCheckedByUser: {
        select: { id: true, username: true },
      },
      shoppingItems: {
        where: { isArchived: false },
        select: {
          id: true,
          title: true,
          quantity: true,
          unit: true,
        },
        orderBy: [{ createdAt: 'desc' }],
        take: 1,
      },
    },
    orderBy: [{ nextCheckAt: 'asc' }, { createdAt: 'desc' }],
  })
}

export async function getStockItem(groupId: string, stockItemId: string) {
  return prisma.stockItem.findFirst({
    where: {
      id: stockItemId,
      groupId,
    },
    include: {
      category: true,
      createdByUser: {
        select: { id: true, username: true },
      },
      lastCheckedByUser: {
        select: { id: true, username: true },
      },
      shoppingItems: {
        where: { isArchived: false },
        select: {
          id: true,
          title: true,
          quantity: true,
          unit: true,
        },
        orderBy: [{ createdAt: 'desc' }],
        take: 1,
      },
    },
  })
}

export async function createStockItem(
  groupId: string,
  userId: string,
  stockItemFormValues: StockItemFormValues,
) {
  await assertUserCanAccessGroup(userId, groupId)

  const now = new Date()

  return prisma.stockItem.create({
    data: {
      id: randomId(),
      title: stockItemFormValues.title.trim(),
      currentQuantity: stockItemFormValues.currentQuantity.toString(),
      unit: stockItemFormValues.unit.trim(),
      notes: stockItemFormValues.notes?.trim() || null,
      categoryId:
        stockItemFormValues.categoryId && stockItemFormValues.categoryId > 0
          ? stockItemFormValues.categoryId
          : null,
      checkIntervalDays: stockItemFormValues.checkIntervalDays,
      nextCheckAt: addDays(now, stockItemFormValues.checkIntervalDays),
      groupId,
      createdByUserId: userId,
    },
    include: {
      category: true,
      createdByUser: {
        select: { id: true, username: true },
      },
      lastCheckedByUser: {
        select: { id: true, username: true },
      },
      shoppingItems: {
        where: { isArchived: false },
        select: {
          id: true,
          title: true,
          quantity: true,
          unit: true,
        },
        orderBy: [{ createdAt: 'desc' }],
        take: 1,
      },
    },
  })
}

export async function updateStockItem(
  groupId: string,
  stockItemId: string,
  userId: string,
  stockItemFormValues: StockItemFormValues,
) {
  await assertUserCanAccessGroup(userId, groupId)
  const existingStockItem = await getStockItemForGroup(groupId, stockItemId)

  return prisma.stockItem.update({
    where: { id: stockItemId },
    data: {
      title: stockItemFormValues.title.trim(),
      currentQuantity: stockItemFormValues.currentQuantity.toString(),
      unit: stockItemFormValues.unit.trim(),
      notes: stockItemFormValues.notes?.trim() || null,
      categoryId:
        stockItemFormValues.categoryId && stockItemFormValues.categoryId > 0
          ? stockItemFormValues.categoryId
          : null,
      checkIntervalDays: stockItemFormValues.checkIntervalDays,
      nextCheckAt:
        existingStockItem.lastCheckedAt === null
          ? addDays(new Date(), stockItemFormValues.checkIntervalDays)
          : addDays(
              existingStockItem.lastCheckedAt,
              stockItemFormValues.checkIntervalDays,
            ),
    },
    include: {
      category: true,
      createdByUser: {
        select: { id: true, username: true },
      },
      lastCheckedByUser: {
        select: { id: true, username: true },
      },
      shoppingItems: {
        where: { isArchived: false },
        select: {
          id: true,
          title: true,
          quantity: true,
          unit: true,
        },
        orderBy: [{ createdAt: 'desc' }],
        take: 1,
      },
    },
  })
}

export async function checkStockItem(
  groupId: string,
  stockItemId: string,
  userId: string,
) {
  await assertUserCanAccessGroup(userId, groupId)
  const stockItem = await getStockItemForGroup(groupId, stockItemId)
  const now = new Date()

  return prisma.stockItem.update({
    where: { id: stockItemId },
    data: {
      lastCheckedAt: now,
      lastCheckedByUserId: userId,
      nextCheckAt: addDays(now, stockItem.checkIntervalDays),
    },
    include: {
      category: true,
      createdByUser: {
        select: { id: true, username: true },
      },
      lastCheckedByUser: {
        select: { id: true, username: true },
      },
      shoppingItems: {
        where: { isArchived: false },
        select: {
          id: true,
          title: true,
          quantity: true,
          unit: true,
        },
        orderBy: [{ createdAt: 'desc' }],
        take: 1,
      },
    },
  })
}

export async function deleteStockItem(
  groupId: string,
  stockItemId: string,
  userId: string,
) {
  await assertUserCanAccessGroup(userId, groupId)
  await getStockItemForGroup(groupId, stockItemId)

  return prisma.stockItem.delete({
    where: { id: stockItemId },
  })
}

async function getStockItemForGroup(groupId: string, stockItemId: string) {
  const stockItem = await prisma.stockItem.findFirst({
    where: {
      id: stockItemId,
      groupId,
    },
    select: {
      id: true,
      checkIntervalDays: true,
      lastCheckedAt: true,
    },
  })

  if (!stockItem) {
    throw new Error('Invalid stock item ID.')
  }

  return stockItem
}

export async function getGroupExpenses(
  groupId: string,
  options?: { offset?: number; length?: number; filter?: string },
) {
  await createRecurringExpenses()

  return prisma.expense.findMany({
    select: {
      amount: true,
      category: true,
      createdAt: true,
      expenseDate: true,
      id: true,
      isReimbursement: true,
      paidBy: { select: { id: true, name: true } },
      paidFor: {
        select: {
          participant: { select: { id: true, name: true } },
          shares: true,
        },
      },
      splitMode: true,
      recurrenceRule: true,
      title: true,
      _count: { select: { documents: true } },
    },
    where: {
      groupId,
      title: options?.filter
        ? { contains: options.filter, mode: 'insensitive' }
        : undefined,
    },
    orderBy: [{ expenseDate: 'desc' }, { createdAt: 'desc' }],
    skip: options && options.offset,
    take: options && options.length,
  })
}

export async function getGroupExpenseCount(groupId: string) {
  return prisma.expense.count({ where: { groupId } })
}

export async function getExpense(groupId: string, expenseId: string) {
  return prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      paidBy: true,
      paidFor: true,
      category: true,
      documents: true,
      recurringExpenseLink: true,
    },
  })
}

export async function getActivities(
  groupId: string,
  options?: { offset?: number; length?: number },
) {
  const activities = await prisma.activity.findMany({
    where: { groupId },
    orderBy: [{ time: 'desc' }],
    skip: options?.offset,
    take: options?.length,
  })

  const expenseIds = activities
    .map((activity) => activity.expenseId)
    .filter(Boolean)
  const expenses = await prisma.expense.findMany({
    where: {
      groupId,
      id: { in: expenseIds },
    },
  })

  return activities.map((activity) => ({
    ...activity,
    expense:
      activity.expenseId !== null
        ? expenses.find((expense) => expense.id === activity.expenseId)
        : undefined,
  }))
}

export async function logActivity(
  groupId: string,
  activityType: ActivityType,
  extra?: { participantId?: string; expenseId?: string; data?: string },
) {
  return prisma.activity.create({
    data: {
      id: randomId(),
      groupId,
      activityType,
      ...extra,
    },
  })
}

async function createRecurringExpenses() {
  const localDate = new Date() // Current local date
  const utcDateFromLocal = new Date(
    Date.UTC(
      localDate.getUTCFullYear(),
      localDate.getUTCMonth(),
      localDate.getUTCDate(),
      // More precision beyond date is required to ensure that recurring Expenses are created within <most precises unit> of when expected
      localDate.getUTCHours(),
      localDate.getUTCMinutes(),
    ),
  )

  const recurringExpenseLinksWithExpensesToCreate =
    await prisma.recurringExpenseLink.findMany({
      where: {
        nextExpenseCreatedAt: null,
        nextExpenseDate: {
          lte: utcDateFromLocal,
        },
      },
      include: {
        currentFrameExpense: {
          include: {
            paidBy: true,
            paidFor: true,
            category: true,
            documents: true,
          },
        },
      },
    })

  for (const recurringExpenseLink of recurringExpenseLinksWithExpensesToCreate) {
    let newExpenseDate = recurringExpenseLink.nextExpenseDate

    let currentExpenseRecord = recurringExpenseLink.currentFrameExpense
    let currentReccuringExpenseLinkId = recurringExpenseLink.id

    while (newExpenseDate < utcDateFromLocal) {
      const newExpenseId = randomId()
      const newRecurringExpenseLinkId = randomId()

      const newRecurringExpenseNextExpenseDate = calculateNextDate(
        currentExpenseRecord.recurrenceRule as RecurrenceRule,
        newExpenseDate,
      )

      const {
        category,
        paidBy,
        paidFor,
        documents,
        ...destructeredCurrentExpenseRecord
      } = currentExpenseRecord

      // Use a transacton to ensure that the only one expense is created for the RecurringExpenseLink
      // just in case two clients are processing the same RecurringExpenseLink at the same time
      const newExpense = await prisma
        .$transaction(async (transaction) => {
          const newExpense = await transaction.expense.create({
            data: {
              ...destructeredCurrentExpenseRecord,
              categoryId: currentExpenseRecord.categoryId,
              paidById: currentExpenseRecord.paidById,
              paidFor: {
                createMany: {
                  data: currentExpenseRecord.paidFor.map((paidFor) => ({
                    participantId: paidFor.participantId,
                    shares: paidFor.shares,
                  })),
                },
              },
              documents: {
                connect: currentExpenseRecord.documents.map(
                  (documentRecord) => ({
                    id: documentRecord.id,
                  }),
                ),
              },
              id: newExpenseId,
              expenseDate: newExpenseDate,
              recurringExpenseLink: {
                create: {
                  groupId: currentExpenseRecord.groupId,
                  id: newRecurringExpenseLinkId,
                  nextExpenseDate: newRecurringExpenseNextExpenseDate,
                },
              },
            },
            // Ensure that the same information is available on the returned record that was created
            include: {
              paidFor: true,
              documents: true,
              category: true,
              paidBy: true,
            },
          })

          // Mark the RecurringExpenseLink as being "completed" since the new Expense was created
          // if an expense hasn't been created for this RecurringExpenseLink yet
          await transaction.recurringExpenseLink.update({
            where: {
              id: currentReccuringExpenseLinkId,
              nextExpenseCreatedAt: null,
            },
            data: {
              nextExpenseCreatedAt: newExpense.createdAt,
            },
          })

          return newExpense
        })
        .catch(() => {
          console.error(
            'Failed to created recurringExpense for expenseId: %s',
            currentExpenseRecord.id,
          )
          return null
        })

      // If the new expense failed to be created, break out of the while-loop
      if (newExpense === null) break

      // Set the values for the next iteration of the for-loop in case multiple recurring Expenses need to be created
      currentExpenseRecord = newExpense
      currentReccuringExpenseLinkId = newRecurringExpenseLinkId
      newExpenseDate = newRecurringExpenseNextExpenseDate
    }
  }
}

function createPayloadForNewRecurringExpenseLink(
  recurrenceRule: RecurrenceRule,
  priorDateToNextRecurrence: Date,
  groupId: String,
): RecurringExpenseLink {
  const nextExpenseDate = calculateNextDate(
    recurrenceRule,
    priorDateToNextRecurrence,
  )

  const recurringExpenseLinkId = randomId()
  const recurringExpenseLinkPayload = {
    id: recurringExpenseLinkId,
    groupId: groupId,
    nextExpenseDate: nextExpenseDate,
  }

  return recurringExpenseLinkPayload as RecurringExpenseLink
}

// TODO: Modify this function to use a more comprehensive recurrence Rule library like rrule (https://github.com/jkbrzt/rrule)
//
// Current limitations:
// - If a date is intended to be repeated monthly on the 29th, 30th or 31st, it will change to repeating on the smallest
// date that the reccurence has encountered. Ex. If a recurrence is created for Jan 31st on 2025, the recurring expense
// will be created for Feb 28th, March 28, etc. until it is cancelled or fixed
function calculateNextDate(
  recurrenceRule: RecurrenceRule,
  priorDateToNextRecurrence: Date,
): Date {
  const nextDate = new Date(priorDateToNextRecurrence)
  switch (recurrenceRule) {
    case RecurrenceRule.DAILY:
      nextDate.setUTCDate(nextDate.getUTCDate() + 1)
      break
    case RecurrenceRule.WEEKLY:
      nextDate.setUTCDate(nextDate.getUTCDate() + 7)
      break
    case RecurrenceRule.MONTHLY:
      const nextYear = nextDate.getUTCFullYear()
      const nextMonth = nextDate.getUTCMonth() + 1
      let nextDay = nextDate.getUTCDate()

      // Reduce the next day until it is within the direct next month
      while (!isDateInNextMonth(nextYear, nextMonth, nextDay)) {
        nextDay -= 1
      }
      nextDate.setUTCMonth(nextMonth, nextDay)
      break
  }

  return nextDate
}

function isDateInNextMonth(
  utcYear: number,
  utcMonth: number,
  utcDate: number,
): Boolean {
  const testDate = new Date(Date.UTC(utcYear, utcMonth, utcDate))

  // We're not concerned if the year or month changes. We only want to make sure that the date is our target date
  if (testDate.getUTCDate() !== utcDate) {
    return false
  }

  return true
}
