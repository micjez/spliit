'use client'

import { ShoppingItemForm } from '@/app/groups/[groupId]/shopping/shopping-item-form'
import { useToast } from '@/components/ui/use-toast'
import { trpc } from '@/trpc/client'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'

export function CreateShoppingItemForm({ groupId }: { groupId: string }) {
  const t = useTranslations('Shopping')
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const stockItemId = searchParams.get('stockItemId') ?? undefined
  const { data: categoriesData } = trpc.categories.list.useQuery()
  const { data: stockItemData } = trpc.groups.stock.get.useQuery(
    { groupId, stockItemId: stockItemId ?? '' },
    { enabled: !!stockItemId },
  )
  const { mutateAsync: createShoppingItemMutateAsync } =
    trpc.groups.shopping.create.useMutation()
  const categories = categoriesData?.categories
  const stockItem = stockItemData?.item
  const utils = trpc.useUtils()
  const router = useRouter()

  if (!categories) return null

  return (
    <ShoppingItemForm
      categories={categories}
      mode="create"
      title={t('createTitle')}
      description={
        stockItem
          ? t('createFromStockDescription', { title: stockItem.title })
          : t('createDescription')
      }
      cancelHref={`/groups/${groupId}/shopping`}
      defaultValues={
        stockItem
          ? {
              title: stockItem.title,
              quantity: 1,
              unit: stockItem.unit,
              categoryId: stockItem.categoryId ?? 0,
              notes: stockItem.notes ?? '',
            }
          : undefined
      }
      onSubmit={async (shoppingItemFormValues, submitAction) => {
        try {
          await createShoppingItemMutateAsync({
            groupId,
            stockItemId,
            shoppingItemFormValues,
          })
        } catch (error) {
          console.error(error)
          toast({
            variant: 'destructive',
            description: t('duplicateFromStockError'),
          })
          return
        }
        await utils.groups.shopping.invalidate()
        await utils.groups.stock.invalidate()

        if (submitAction === 'create-next') {
          return
        }

        router.push(`/groups/${groupId}/shopping`)
      }}
    />
  )
}
