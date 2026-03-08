import { associateUserWithGroup, getGroup } from '@/lib/api'
import { baseProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const getGroupProcedure = baseProcedure
  .input(z.object({ groupId: z.string().min(1) }))
  .query(async ({ ctx, input: { groupId } }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const group = await getGroup(groupId)
    if (group) {
      await associateUserWithGroup(ctx.user.id, groupId)
    }
    return { group }
  })
