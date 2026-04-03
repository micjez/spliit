import { getGroupChores, isUserAssociatedWithGroup } from '@/lib/api'
import { baseProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const listGroupChoresProcedure = baseProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
    }),
  )
  .query(async ({ ctx, input: { groupId } }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    if (!(await isUserAssociatedWithGroup(ctx.user.id, groupId))) {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    return {
      items: await getGroupChores(groupId),
    }
  })
