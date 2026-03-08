import { listUserGroups } from '@/lib/api'
import { baseProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'

export const listGroupsProcedure = baseProcedure
  .query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const groups = await listUserGroups(ctx.user.id)
    return { groups }
  })
