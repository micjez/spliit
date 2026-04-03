'use client'

import { StockItemForm } from '@/app/groups/[groupId]/stock/stock-item-form'
import { trpc } from '@/trpc/client'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

export function CreateStockItemForm({ groupId }: { groupId: string }) {
  const t = useTranslations('Stock')
  const { data: categoriesData } = trpc.categories.list.useQuery()
  const { mutateAsync: createStockItemMutateAsync } =
    trpc.groups.stock.create.useMutation()
  const categories = categoriesData?.categories
  const utils = trpc.useUtils()
  const router = useRouter()

  if (!categories) return null

  return (
    <StockItemForm
      categories={categories}
      mode="create"
      title={t('createTitle')}
      description={t('createDescription')}
      cancelHref={`/groups/${groupId}/stock`}
      onSubmit={async (stockItemFormValues, submitAction) => {
        await createStockItemMutateAsync({
          groupId,
          stockItemFormValues,
        })
        await utils.groups.stock.invalidate()

        if (submitAction === 'create-next') {
          return
        }

        router.push(`/groups/${groupId}/stock`)
      }}
    />
  )
}
