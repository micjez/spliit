'use client'

import { ChoreItemForm } from '@/app/groups/[groupId]/chores/chore-item-form'
import { trpc } from '@/trpc/client'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useCurrentGroup } from '../current-group-context'

export function EditChoreItemForm({
  groupId,
  choreId,
}: {
  groupId: string
  choreId: string
}) {
  const t = useTranslations('Chores')
  const currentGroup = useCurrentGroup()
  const { data: categoriesData } = trpc.categories.list.useQuery()
  const { data: itemData } = trpc.groups.chores.get.useQuery({
    groupId,
    choreId,
  })
  const { mutateAsync: updateChoreMutateAsync } =
    trpc.groups.chores.update.useMutation()
  const { mutateAsync: deleteChoreMutateAsync } =
    trpc.groups.chores.delete.useMutation()
  const { mutateAsync: completeChoreMutateAsync } =
    trpc.groups.chores.complete.useMutation()
  const categories = categoriesData?.categories
  const item = itemData?.item
  const utils = trpc.useUtils()
  const router = useRouter()

  if (!categories || !item || currentGroup.isLoading) return null

  return (
    <ChoreItemForm
      categories={categories}
      participants={currentGroup.group.participants}
      mode="edit"
      title={t('editTitle')}
      description={t('editDescription')}
      cancelHref={`/groups/${groupId}/chores`}
      defaultValues={{
        title: item.title,
        dueAt: item.dueAt,
        recurrenceRule: item.recurrenceRule,
        categoryId: item.categoryId ?? 0,
        assigneeParticipantId: item.assigneeParticipantId ?? undefined,
        notes: item.notes ?? '',
        isCompleted: item.isCompleted,
      }}
      onSubmit={async (choreItemFormValues) => {
        await updateChoreMutateAsync({
          groupId,
          choreId,
          choreItemFormValues,
        })
        await utils.groups.chores.invalidate()
        router.push(`/groups/${groupId}/chores`)
      }}
      onDelete={async () => {
        await deleteChoreMutateAsync({
          groupId,
          choreId,
        })
        await utils.groups.chores.invalidate()
        router.push(`/groups/${groupId}/chores`)
      }}
      onComplete={async () => {
        await completeChoreMutateAsync({
          groupId,
          choreId,
        })
        await utils.groups.chores.invalidate()
        router.push(`/groups/${groupId}/chores`)
      }}
    />
  )
}
