import { createShoppingItem } from '@/lib/api'
import { shoppingItemFormSchema } from '@/lib/schemas'
import { baseProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const createGroupShoppingItemProcedure = baseProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      stockItemId: z.string().min(1).optional(),
      shoppingItemFormValues: shoppingItemFormSchema,
    }),
  )
  .mutation(
    async ({
      ctx,
      input: { groupId, shoppingItemFormValues, stockItemId },
    }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      return {
        item: await createShoppingItem(
          groupId,
          ctx.user.id,
          shoppingItemFormValues,
          {
            stockItemId,
          },
        ),
      }
    },
  )
