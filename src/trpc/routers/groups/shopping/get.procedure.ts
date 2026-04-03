import { getShoppingItem, isUserAssociatedWithGroup } from '@/lib/api'
import { baseProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const getGroupShoppingItemProcedure = baseProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      shoppingItemId: z.string().min(1),
    }),
  )
  .query(async ({ ctx, input: { groupId, shoppingItemId } }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    if (!(await isUserAssociatedWithGroup(ctx.user.id, groupId))) {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    const item = await getShoppingItem(groupId, shoppingItemId)
    if (!item) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Shopping item not found',
      })
    }

    return { item }
  })
