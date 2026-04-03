import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_STOCK_ITEMS = [
  {
    title: 'Toilet paper',
    currentQuantity: '12',
    unit: 'rolls',
    checkIntervalDays: 30,
    category: { grouping: 'Home', name: 'Household Supplies' },
    notes: 'Baseline household item.',
  },
  {
    title: 'Toothpaste',
    currentQuantity: '3',
    unit: 'tubes',
    checkIntervalDays: 30,
    category: { grouping: 'Home', name: 'Household Supplies' },
    notes: 'Baseline household item.',
  },
  {
    title: 'Paper towels',
    currentQuantity: '4',
    unit: 'rolls',
    checkIntervalDays: 30,
    category: { grouping: 'Home', name: 'Household Supplies' },
    notes: 'Baseline household item.',
  },
  {
    title: 'Trash bags',
    currentQuantity: '1',
    unit: 'pack',
    checkIntervalDays: 30,
    category: { grouping: 'Utilities', name: 'Trash' },
    notes: 'Baseline household item.',
  },
  {
    title: 'Dish soap',
    currentQuantity: '1',
    unit: 'bottle',
    checkIntervalDays: 14,
    category: { grouping: 'Utilities', name: 'Cleaning' },
    notes: 'Baseline household item.',
  },
  {
    title: 'Laundry detergent',
    currentQuantity: '1',
    unit: 'bottle',
    checkIntervalDays: 30,
    category: { grouping: 'Home', name: 'Household Supplies' },
    notes: 'Baseline household item.',
  },
] as const

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function parseArgs() {
  const args = process.argv.slice(2)
  const allGroups = args.includes('--all-groups')
  const groupIdIndex = args.indexOf('--group-id')
  const groupIds =
    groupIdIndex >= 0
      ? args[groupIdIndex + 1]
          ?.split(',')
          .map((value) => value.trim())
          .filter(Boolean) ?? []
      : []

  if (!allGroups && groupIds.length === 0) {
    throw new Error(
      'Pass --all-groups or --group-id <id>[,<id2>,...] to seed stock items.',
    )
  }

  return { allGroups, groupIds }
}

async function main() {
  const { allGroups, groupIds } = parseArgs()
  const groups = await prisma.group.findMany({
    where: allGroups ? undefined : { id: { in: groupIds } },
    select: {
      id: true,
      name: true,
      users: {
        orderBy: [{ createdAt: 'asc' }],
        select: { userId: true },
        take: 1,
      },
    },
  })

  if (groups.length === 0) {
    throw new Error('No matching groups found.')
  }

  for (const group of groups) {
    const createdByUserId = group.users[0]?.userId

    if (!createdByUserId) {
      console.log(
        `Skipping group ${group.id} (${group.name}) because it has no associated users.`,
      )
      continue
    }

    for (const item of DEFAULT_STOCK_ITEMS) {
      const existingItem = await prisma.stockItem.findFirst({
        where: {
          groupId: group.id,
          title: {
            equals: item.title,
            mode: 'insensitive',
          },
        },
        select: { id: true },
      })

      if (existingItem) continue

      const category = await prisma.category.findFirst({
        where: {
          grouping: item.category.grouping,
          name: item.category.name,
        },
        select: { id: true },
      })

      await prisma.stockItem.create({
        data: {
          id: crypto.randomUUID(),
          title: item.title,
          currentQuantity: item.currentQuantity,
          unit: item.unit,
          checkIntervalDays: item.checkIntervalDays,
          nextCheckAt: addDays(new Date(), item.checkIntervalDays),
          categoryId: category?.id,
          notes: item.notes,
          groupId: group.id,
          createdByUserId,
        },
      })
    }

    console.log(
      `Seeded default stock items for group ${group.id} (${group.name}).`,
    )
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
