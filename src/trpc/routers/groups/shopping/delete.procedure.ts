import { deleteShoppingItem } from '@/lib/api'
import { baseProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const deleteGroupShoppingItemProcedure = baseProcedure
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

    await deleteShoppingItem(groupId, shoppingItemId, ctx.user.id)
    return { success: true }
  })
