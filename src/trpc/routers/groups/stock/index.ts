import { createTRPCRouter } from '@/trpc/init'
import { checkGroupStockItemProcedure } from './check.procedure'
import { createGroupStockItemProcedure } from './create.procedure'
import { deleteGroupStockItemProcedure } from './delete.procedure'
import { getGroupStockItemProcedure } from './get.procedure'
import { listGroupStockItemsProcedure } from './list.procedure'
import { updateGroupStockItemProcedure } from './update.procedure'

export const groupStockRouter = createTRPCRouter({
  list: listGroupStockItemsProcedure,
  get: getGroupStockItemProcedure,
  create: createGroupStockItemProcedure,
  update: updateGroupStockItemProcedure,
  check: checkGroupStockItemProcedure,
  delete: deleteGroupStockItemProcedure,
})
