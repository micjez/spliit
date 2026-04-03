import { updateShoppingItem } from '@/lib/api'
import { shoppingItemFormSchema } from '@/lib/schemas'
import { baseProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const updateGroupShoppingItemProcedure = baseProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      shoppingItemId: z.string().min(1),
      shoppingItemFormValues: shoppingItemFormSchema,
    }),
  )
  .mutation(
    async ({ ctx, input: { groupId, shoppingItemId, shoppingItemFormValues } }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      return {
        item: await updateShoppingItem(
          groupId,
          shoppingItemId,
          ctx.user.id,
          shoppingItemFormValues,
        ),
      }
    },
  )
