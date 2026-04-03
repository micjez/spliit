import { EditStockItemForm } from '@/app/groups/[groupId]/stock/edit-stock-item-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Stock Item',
}

export default async function EditStockItemPage({
  params,
}: {
  params: Promise<{ groupId: string; stockItemId: string }>
}) {
  const { groupId, stockItemId } = await params
  return <EditStockItemForm groupId={groupId} stockItemId={stockItemId} />
}
