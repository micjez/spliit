import { createTRPCRouter } from '@/trpc/init'
import { completeGroupChoreProcedure } from './complete.procedure'
import { createGroupChoreProcedure } from './create.procedure'
import { deleteGroupChoreProcedure } from './delete.procedure'
import { getGroupChoreProcedure } from './get.procedure'
import { listGroupChoresProcedure } from './list.procedure'
import { updateGroupChoreProcedure } from './update.procedure'

export const groupChoresRouter = createTRPCRouter({
  list: listGroupChoresProcedure,
  get: getGroupChoreProcedure,
  create: createGroupChoreProcedure,
  update: updateGroupChoreProcedure,
  complete: completeGroupChoreProcedure,
  delete: deleteGroupChoreProcedure,
})
