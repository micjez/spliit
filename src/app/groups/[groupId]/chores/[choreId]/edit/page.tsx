import { EditChoreItemForm } from '@/app/groups/[groupId]/chores/edit-chore-item-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Chore',
}

export default async function EditChorePage({
  params,
}: {
  params: Promise<{ groupId: string; choreId: string }>
}) {
  const { groupId, choreId } = await params
  return <EditChoreItemForm groupId={groupId} choreId={choreId} />
}
