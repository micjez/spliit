import {
  getGroupShoppingItemsByStatus,
  isUserAssociatedWithGroup,
} from '@/lib/api'
import { baseProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const listGroupShoppingItemsProcedure = baseProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      cursor: z.number().optional(),
      limit: z.number().optional(),
      status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
    }),
  )
  .query(async ({ ctx, input: { groupId, cursor = 0, limit = 10, status } }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    if (!(await isUserAssociatedWithGroup(ctx.user.id, groupId))) {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    const items = await getGroupShoppingItemsByStatus(groupId, {
      offset: cursor,
      length: limit + 1,
      status,
    })

    return {
      items: items.slice(0, limit),
      hasMore: !!items[limit],
      nextCursor: cursor + limit,
    }
  })
