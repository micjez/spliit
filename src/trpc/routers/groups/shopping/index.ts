import { createTRPCRouter } from '@/trpc/init'
import { createGroupShoppingItemProcedure } from './create.procedure'
import { deleteGroupShoppingItemProcedure } from './delete.procedure'
import { getGroupShoppingItemProcedure } from './get.procedure'
import { listGroupShoppingItemsProcedure } from './list.procedure'
import { markGroupShoppingItemBoughtProcedure } from './markBought.procedure'
import { restoreGroupShoppingItemProcedure } from './restore.procedure'
import { updateGroupShoppingItemProcedure } from './update.procedure'

export const groupShoppingRouter = createTRPCRouter({
  list: listGroupShoppingItemsProcedure,
  get: getGroupShoppingItemProcedure,
  create: createGroupShoppingItemProcedure,
  update: updateGroupShoppingItemProcedure,
  markBought: markGroupShoppingItemBoughtProcedure,
  restore: restoreGroupShoppingItemProcedure,
  delete: deleteGroupShoppingItemProcedure,
})
