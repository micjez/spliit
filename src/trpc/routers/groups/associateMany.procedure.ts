import { associateUserWithGroups } from '@/lib/api'
import { baseProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const associateManyGroupsProcedure = baseProcedure
  .input(
    z.object({
      groupIds: z.array(z.string().min(1)),
    }),
  )
  .mutation(async ({ ctx, input: { groupIds } }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    return associateUserWithGroups(ctx.user.id, groupIds)
  })
