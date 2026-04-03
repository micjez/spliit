'use client'

import { ShoppingItemForm } from '@/app/groups/[groupId]/shopping/shopping-item-form'
import { trpc } from '@/trpc/client'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

export function CreateShoppingItemForm({ groupId }: { groupId: string }) {
  const t = useTranslations('Shopping')
  const { data: categoriesData } = trpc.categories.list.useQuery()
  const { mutateAsync: createShoppingItemMutateAsync } =
    trpc.groups.shopping.create.useMutation()
  const categories = categoriesData?.categories
  const utils = trpc.useUtils()
  const router = useRouter()

  if (!categories) return null

  return (
    <ShoppingItemForm
      categories={categories}
      mode="create"
      title={t('createTitle')}
      description={t('createDescription')}
      cancelHref={`/groups/${groupId}/shopping`}
      onSubmit={async (shoppingItemFormValues, submitAction) => {
        await createShoppingItemMutateAsync({
          groupId,
          shoppingItemFormValues,
        })
        await utils.groups.shopping.invalidate()

        if (submitAction === 'create-next') {
          return
        }

        router.push(`/groups/${groupId}/shopping`)
      }}
    />
  )
}
