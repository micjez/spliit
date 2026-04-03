import { createTRPCRouter } from '@/trpc/init'
import { activitiesRouter } from '@/trpc/routers/groups/activities'
import { associateManyGroupsProcedure } from '@/trpc/routers/groups/associateMany.procedure'
import { groupBalancesRouter } from '@/trpc/routers/groups/balances'
import { groupChoresRouter } from '@/trpc/routers/groups/chores'
import { createGroupProcedure } from '@/trpc/routers/groups/create.procedure'
import { groupExpensesRouter } from '@/trpc/routers/groups/expenses'
import { getGroupProcedure } from '@/trpc/routers/groups/get.procedure'
import { groupShoppingRouter } from '@/trpc/routers/groups/shopping'
import { groupStatsRouter } from '@/trpc/routers/groups/stats'
import { groupStockRouter } from '@/trpc/routers/groups/stock'
import { updateGroupProcedure } from '@/trpc/routers/groups/update.procedure'
import { getGroupDetailsProcedure } from './getDetails.procedure'
import { listGroupsProcedure } from './list.procedure'

export const groupsRouter = createTRPCRouter({
  expenses: groupExpensesRouter,
  shopping: groupShoppingRouter,
  stock: groupStockRouter,
  chores: groupChoresRouter,
  balances: groupBalancesRouter,
  stats: groupStatsRouter,
  activities: activitiesRouter,

  get: getGroupProcedure,
  getDetails: getGroupDetailsProcedure,
  list: listGroupsProcedure,
  listMine: listGroupsProcedure,
  associateMany: associateManyGroupsProcedure,
  create: createGroupProcedure,
  update: updateGroupProcedure,
})
