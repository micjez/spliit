'use client'

import { ChoreItemForm } from '@/app/groups/[groupId]/chores/chore-item-form'
import { trpc } from '@/trpc/client'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useCurrentGroup } from '../current-group-context'

export function CreateChoreItemForm({ groupId }: { groupId: string }) {
  const t = useTranslations('Chores')
  const currentGroup = useCurrentGroup()
  const { data: categoriesData } = trpc.categories.list.useQuery()
  const { mutateAsync: createChoreMutateAsync } =
    trpc.groups.chores.create.useMutation()
  const categories = categoriesData?.categories
  const utils = trpc.useUtils()
  const router = useRouter()

  if (!categories || currentGroup.isLoading) return null

  return (
    <ChoreItemForm
      categories={categories}
      participants={currentGroup.group.participants}
      mode="create"
      title={t('createTitle')}
      description={t('createDescription')}
      cancelHref={`/groups/${groupId}/chores`}
      onSubmit={async (choreItemFormValues, submitAction) => {
        await createChoreMutateAsync({
          groupId,
          choreItemFormValues,
        })
        await utils.groups.chores.invalidate()

        if (submitAction === 'create-next') {
          return
        }

        router.push(`/groups/${groupId}/chores`)
      }}
    />
  )
}
