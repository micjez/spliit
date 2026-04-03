'use client'

import { StockItemForm } from '@/app/groups/[groupId]/stock/stock-item-form'
import { trpc } from '@/trpc/client'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

export function EditStockItemForm({
  groupId,
  stockItemId,
}: {
  groupId: string
  stockItemId: string
}) {
  const t = useTranslations('Stock')
  const { data: categoriesData } = trpc.categories.list.useQuery()
  const { data: itemData } = trpc.groups.stock.get.useQuery({
    groupId,
    stockItemId,
  })
  const { mutateAsync: updateStockItemMutateAsync } =
    trpc.groups.stock.update.useMutation()
  const { mutateAsync: deleteStockItemMutateAsync } =
    trpc.groups.stock.delete.useMutation()
  const { mutateAsync: checkStockItemMutateAsync } =
    trpc.groups.stock.check.useMutation()
  const categories = categoriesData?.categories
  const item = itemData?.item
  const utils = trpc.useUtils()
  const router = useRouter()

  if (!categories || !item) return null

  const activeShoppingItem = item.shoppingItems[0]

  return (
    <StockItemForm
      categories={categories}
      mode="edit"
      title={t('editTitle')}
      description={t('editDescription')}
      cancelHref={`/groups/${groupId}/stock`}
      createShoppingHref={`/groups/${groupId}/shopping/create?stockItemId=${stockItemId}`}
      existingShoppingHref={
        activeShoppingItem
          ? `/groups/${groupId}/shopping/${activeShoppingItem.id}/edit`
          : undefined
      }
      defaultValues={{
        title: item.title,
        currentQuantity: Number(item.currentQuantity.toString()),
        unit: item.unit,
        checkIntervalDays: item.checkIntervalDays,
        categoryId: item.categoryId ?? 0,
        notes: item.notes ?? '',
      }}
      onSubmit={async (stockItemFormValues) => {
        await updateStockItemMutateAsync({
          groupId,
          stockItemId,
          stockItemFormValues,
        })
        await utils.groups.stock.invalidate()
        router.push(`/groups/${groupId}/stock`)
      }}
      onDelete={async () => {
        await deleteStockItemMutateAsync({
          groupId,
          stockItemId,
        })
        await utils.groups.stock.invalidate()
        router.push(`/groups/${groupId}/stock`)
      }}
      onCheck={async () => {
        await checkStockItemMutateAsync({
          groupId,
          stockItemId,
        })
        await utils.groups.stock.invalidate()
        router.push(`/groups/${groupId}/stock`)
      }}
    />
  )
}
