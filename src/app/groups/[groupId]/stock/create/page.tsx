import { CreateStockItemForm } from '@/app/groups/[groupId]/stock/create-stock-item-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Stock Item',
}

export default async function CreateStockItemPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = await params
  return <CreateStockItemForm groupId={groupId} />
}
