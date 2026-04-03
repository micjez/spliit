import { createChore } from '@/lib/api'
import { choreItemFormSchema } from '@/lib/schemas'
import { baseProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const createGroupChoreProcedure = baseProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      choreItemFormValues: choreItemFormSchema,
    }),
  )
  .mutation(async ({ ctx, input: { groupId, choreItemFormValues } }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    return {
      item: await createChore(groupId, ctx.user.id, choreItemFormValues),
    }
  })
