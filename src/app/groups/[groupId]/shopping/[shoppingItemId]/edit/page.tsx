import { EditShoppingItemForm } from '@/app/groups/[groupId]/shopping/edit-shopping-item-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Shopping Item',
}

export default async function EditShoppingItemPage({
  params,
}: {
  params: Promise<{ groupId: string; shoppingItemId: string }>
}) {
  const { groupId, shoppingItemId } = await params
  return (
    <EditShoppingItemForm groupId={groupId} shoppingItemId={shoppingItemId} />
  )
}
