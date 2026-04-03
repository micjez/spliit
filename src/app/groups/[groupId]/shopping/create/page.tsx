import { CreateShoppingItemForm } from '@/app/groups/[groupId]/shopping/create-shopping-item-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Shopping Item',
}

export default async function CreateShoppingItemPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = await params
  return <CreateShoppingItemForm groupId={groupId} />
}
