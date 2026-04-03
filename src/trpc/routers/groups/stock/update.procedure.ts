import { updateStockItem } from '@/lib/api'
import { stockItemFormSchema } from '@/lib/schemas'
import { baseProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const updateGroupStockItemProcedure = baseProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      stockItemId: z.string().min(1),
      stockItemFormValues: stockItemFormSchema,
    }),
  )
  .mutation(
    async ({ ctx, input: { groupId, stockItemId, stockItemFormValues } }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      return {
        item: await updateStockItem(
          groupId,
          stockItemId,
          ctx.user.id,
          stockItemFormValues,
        ),
      }
    },
  )
