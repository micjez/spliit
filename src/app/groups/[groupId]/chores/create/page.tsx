import { CreateChoreItemForm } from '@/app/groups/[groupId]/chores/create-chore-item-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Chore',
}

export default async function CreateChorePage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = await params
  return <CreateChoreItemForm groupId={groupId} />
}
