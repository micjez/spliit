import { markShoppingItemBought } from '@/lib/api'
import { baseProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const markGroupShoppingItemBoughtProcedure = baseProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      shoppingItemId: z.string().min(1),
    }),
  )
  .mutation(async ({ ctx, input: { groupId, shoppingItemId } }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    return {
      item: await markShoppingItemBought(groupId, shoppingItemId, ctx.user.id),
    }
  })
