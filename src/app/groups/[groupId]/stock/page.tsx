import GroupStockPageClient from '@/app/groups/[groupId]/stock/page.client'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Stock',
}

export default function GroupStockPage() {
  return <GroupStockPageClient />
}
