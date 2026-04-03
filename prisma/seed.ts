import { PrismaClient, RecurrenceRule, SplitMode } from '@prisma/client'
import { randomBytes, scrypt as scryptCallback } from 'node:crypto'
import { promisify } from 'node:util'

const prisma = new PrismaClient()
const scrypt = promisify(scryptCallback)

const IDS = {
  group: 'seed-group-flatmates',
  users: {
    alice: 'seed-user-alice',
    bob: 'seed-user-bob',
    charlie: 'seed-user-charlie',
  },
  userGroups: {
    alice: 'seed-user-group-alice',
    bob: 'seed-user-group-bob',
    charlie: 'seed-user-group-charlie',
  },
  participants: {
    alice: 'seed-participant-alice',
    bob: 'seed-participant-bob',
    charlie: 'seed-participant-charlie',
  },
  expenses: {
    groceries: 'seed-expense-groceries',
    cleaning: 'seed-expense-cleaning',
    internet: 'seed-expense-internet',
  },
  shoppingItems: {
    milk: 'seed-shopping-milk',
    apples: 'seed-shopping-apples',
    detergent: 'seed-shopping-detergent',
    trashBags: 'seed-shopping-trash-bags',
  },
} as const

const USERS = [
  { id: IDS.users.alice, username: 'alice', password: 'password123' },
  { id: IDS.users.bob, username: 'bob', password: 'password123' },
  { id: IDS.users.charlie, username: 'charlie', password: 'password123' },
] as const

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = (await scrypt(password, salt, 64)) as Buffer
  return `${salt}:${hash.toString('hex')}`
}

async function upsertUser(user: (typeof USERS)[number]) {
  const passwordHash = await hashPassword(user.password)
  return prisma.user.upsert({
    where: { username: user.username },
    update: { passwordHash },
    create: {
      id: user.id,
      username: user.username,
      passwordHash,
    },
  })
}

async function main() {
  console.log('Seeding demo users, group, expenses, and shopping items...')

  const [alice, bob, charlie] = await Promise.all(USERS.map(upsertUser))

  await prisma.group.upsert({
    where: { id: IDS.group },
    update: {
      name: 'Flatmates Demo',
      information:
        'Sample group created by the seed script. Use it to test expenses and shopping.',
      currency: '$',
      currencyCode: 'USD',
    },
    create: {
      id: IDS.group,
      name: 'Flatmates Demo',
      information:
        'Sample group created by the seed script. Use it to test expenses and shopping.',
      currency: '$',
      currencyCode: 'USD',
    },
  })

  await prisma.userGroup.upsert({
    where: {
      userId_groupId: {
        userId: alice.id,
        groupId: IDS.group,
      },
    },
    update: {},
    create: {
      id: IDS.userGroups.alice,
      userId: alice.id,
      groupId: IDS.group,
    },
  })
  await prisma.userGroup.upsert({
    where: {
      userId_groupId: {
        userId: bob.id,
        groupId: IDS.group,
      },
    },
    update: {},
    create: {
      id: IDS.userGroups.bob,
      userId: bob.id,
      groupId: IDS.group,
    },
  })
  await prisma.userGroup.upsert({
    where: {
      userId_groupId: {
        userId: charlie.id,
        groupId: IDS.group,
      },
    },
    update: {},
    create: {
      id: IDS.userGroups.charlie,
      userId: charlie.id,
      groupId: IDS.group,
    },
  })

  await prisma.participant.upsert({
    where: { id: IDS.participants.alice },
    update: { name: 'Alice', groupId: IDS.group },
    create: { id: IDS.participants.alice, name: 'Alice', groupId: IDS.group },
  })
  await prisma.participant.upsert({
    where: { id: IDS.participants.bob },
    update: { name: 'Bob', groupId: IDS.group },
    create: { id: IDS.participants.bob, name: 'Bob', groupId: IDS.group },
  })
  await prisma.participant.upsert({
    where: { id: IDS.participants.charlie },
    update: { name: 'Charlie', groupId: IDS.group },
    create: {
      id: IDS.participants.charlie,
      name: 'Charlie',
      groupId: IDS.group,
    },
  })

  await prisma.expensePaidFor.deleteMany({
    where: {
      expenseId: {
        in: Object.values(IDS.expenses),
      },
    },
  })

  await prisma.expense.deleteMany({
    where: {
      id: {
        in: Object.values(IDS.expenses),
      },
    },
  })

  await prisma.shoppingItem.deleteMany({
    where: {
      id: {
        in: Object.values(IDS.shoppingItems),
      },
    },
  })

  await prisma.expense.create({
    data: {
      id: IDS.expenses.groceries,
      groupId: IDS.group,
      expenseDate: new Date('2026-04-01'),
      title: 'Weekly groceries',
      categoryId: 9,
      amount: 8625,
      paidById: IDS.participants.alice,
      splitMode: SplitMode.EVENLY,
      recurrenceRule: RecurrenceRule.NONE,
      paidFor: {
        createMany: {
          data: [
            { participantId: IDS.participants.alice, shares: 100 },
            { participantId: IDS.participants.bob, shares: 100 },
            { participantId: IDS.participants.charlie, shares: 100 },
          ],
        },
      },
      notes: 'Seeded sample grocery expense.',
    },
  })

  await prisma.expense.create({
    data: {
      id: IDS.expenses.cleaning,
      groupId: IDS.group,
      expenseDate: new Date('2026-04-02'),
      title: 'Cleaning supplies',
      categoryId: 37,
      amount: 2499,
      paidById: IDS.participants.bob,
      splitMode: SplitMode.EVENLY,
      recurrenceRule: RecurrenceRule.NONE,
      paidFor: {
        createMany: {
          data: [
            { participantId: IDS.participants.alice, shares: 100 },
            { participantId: IDS.participants.bob, shares: 100 },
            { participantId: IDS.participants.charlie, shares: 100 },
          ],
        },
      },
      notes: 'Soap, sponges, and surface cleaner.',
    },
  })

  await prisma.expense.create({
    data: {
      id: IDS.expenses.internet,
      groupId: IDS.group,
      expenseDate: new Date('2026-04-03'),
      title: 'Internet bill',
      categoryId: 41,
      amount: 5400,
      paidById: IDS.participants.charlie,
      splitMode: SplitMode.EVENLY,
      recurrenceRule: RecurrenceRule.MONTHLY,
      paidFor: {
        createMany: {
          data: [
            { participantId: IDS.participants.alice, shares: 100 },
            { participantId: IDS.participants.bob, shares: 100 },
            { participantId: IDS.participants.charlie, shares: 100 },
          ],
        },
      },
      notes: 'Home internet subscription.',
    },
  })

  await prisma.shoppingItem.createMany({
    data: [
      {
        id: IDS.shoppingItems.milk,
        title: 'Milk',
        quantity: '2',
        unit: 'l',
        groupId: IDS.group,
        categoryId: 9,
        createdByUserId: alice.id,
        notes: 'Semi-skimmed if available',
      },
      {
        id: IDS.shoppingItems.apples,
        title: 'Apples',
        quantity: '1.5',
        unit: 'kg',
        groupId: IDS.group,
        categoryId: 9,
        createdByUserId: bob.id,
      },
      {
        id: IDS.shoppingItems.detergent,
        title: 'Laundry detergent',
        quantity: '1',
        unit: 'bottle',
        groupId: IDS.group,
        categoryId: 14,
        createdByUserId: charlie.id,
      },
      {
        id: IDS.shoppingItems.trashBags,
        title: 'Trash bags',
        quantity: '1',
        unit: 'pack',
        groupId: IDS.group,
        categoryId: 40,
        createdByUserId: alice.id,
        boughtByUserId: bob.id,
        boughtAt: new Date('2026-04-03T09:15:00Z'),
        archivedAt: new Date('2026-04-03T09:15:00Z'),
        isBought: true,
        isArchived: true,
      },
    ],
  })

  console.log('Seed complete.')
  console.log('Users created/updated:')
  USERS.forEach((user) => {
    console.log(`- ${user.username} / ${user.password}`)
  })
  console.log(`Demo group id: ${IDS.group}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
