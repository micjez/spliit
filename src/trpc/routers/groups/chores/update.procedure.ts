import { updateChore } from '@/lib/api'
import { choreItemFormSchema } from '@/lib/schemas'
import { baseProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const updateGroupChoreProcedure = baseProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      choreId: z.string().min(1),
      choreItemFormValues: choreItemFormSchema,
    }),
  )
  .mutation(async ({ ctx, input: { groupId, choreId, choreItemFormValues } }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    return {
      item: await updateChore(groupId, choreId, ctx.user.id, choreItemFormValues),
    }
  })
