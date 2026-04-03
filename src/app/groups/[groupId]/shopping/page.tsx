import GroupShoppingPageClient from '@/app/groups/[groupId]/shopping/page.client'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shopping',
}

export default function GroupShoppingPage() {
  return <GroupShoppingPageClient />
}
