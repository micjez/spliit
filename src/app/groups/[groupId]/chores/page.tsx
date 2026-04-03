import GroupChoresPageClient from '@/app/groups/[groupId]/chores/page.client'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chores',
}

export default function GroupChoresPage() {
  return <GroupChoresPageClient />
}
