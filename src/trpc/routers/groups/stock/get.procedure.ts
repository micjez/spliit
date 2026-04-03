import { getStockItem, isUserAssociatedWithGroup } from '@/lib/api'
import { baseProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const getGroupStockItemProcedure = baseProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      stockItemId: z.string().min(1),
    }),
  )
  .query(async ({ ctx, input: { groupId, stockItemId } }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    if (!(await isUserAssociatedWithGroup(ctx.user.id, groupId))) {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    return {
      item: await getStockItem(groupId, stockItemId),
    }
  })
