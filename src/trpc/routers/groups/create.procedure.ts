import { associateUserWithGroup, createGroup } from '@/lib/api'
import { groupFormSchema } from '@/lib/schemas'
import { baseProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const createGroupProcedure = baseProcedure
  .input(
    z.object({
      groupFormValues: groupFormSchema,
    }),
  )
  .mutation(async ({ ctx, input: { groupFormValues } }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const group = await createGroup(groupFormValues)
    await associateUserWithGroup(ctx.user.id, group.id)
    return { groupId: group.id }
  })
