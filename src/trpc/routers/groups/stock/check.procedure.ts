import { checkStockItem } from '@/lib/api'
import { baseProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const checkGroupStockItemProcedure = baseProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      stockItemId: z.string().min(1),
    }),
  )
  .mutation(async ({ ctx, input: { groupId, stockItemId } }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    return {
      item: await checkStockItem(groupId, stockItemId, ctx.user.id),
    }
  })
