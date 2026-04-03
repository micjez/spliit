'use client'

import { ShoppingItemForm } from '@/app/groups/[groupId]/shopping/shopping-item-form'
import { trpc } from '@/trpc/client'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

export function EditShoppingItemForm({
  groupId,
  shoppingItemId,
}: {
  groupId: string
  shoppingItemId: string
}) {
  const t = useTranslations('Shopping')
  const { data: categoriesData } = trpc.categories.list.useQuery()
  const { data: itemData } = trpc.groups.shopping.get.useQuery({
    groupId,
    shoppingItemId,
  })
  const { mutateAsync: updateShoppingItemMutateAsync } =
    trpc.groups.shopping.update.useMutation()
  const { mutateAsync: deleteShoppingItemMutateAsync } =
    trpc.groups.shopping.delete.useMutation()
  const categories = categoriesData?.categories
  const item = itemData?.item
  const utils = trpc.useUtils()
  const router = useRouter()

  if (!categories || !item) return null

  return (
    <ShoppingItemForm
      categories={categories}
      mode="edit"
      title={t('editTitle')}
      description={t('editDescription')}
      cancelHref={`/groups/${groupId}/shopping`}
      defaultValues={{
        title: item.title,
        quantity: Number(item.quantity.toString()),
        unit: item.unit,
        categoryId: item.categoryId ?? 0,
        notes: item.notes ?? '',
      }}
      onSubmit={async (shoppingItemFormValues) => {
        await updateShoppingItemMutateAsync({
          groupId,
          shoppingItemId,
          shoppingItemFormValues,
        })
        await utils.groups.shopping.invalidate()
        router.push(`/groups/${groupId}/shopping`)
      }}
      onDelete={async () => {
        await deleteShoppingItemMutateAsync({
          groupId,
          shoppingItemId,
        })
        await utils.groups.shopping.invalidate()
        router.push(`/groups/${groupId}/shopping`)
      }}
    />
  )
}
