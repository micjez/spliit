'use client'

import { ShoppingList } from '@/app/groups/[groupId]/shopping/shopping-list'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useCurrentGroup } from '../current-group-context'

export const revalidate = 3600

export default function GroupShoppingPageClient() {
  const t = useTranslations('Shopping')
  const { groupId } = useCurrentGroup()

  return (
    <Card className="mb-4 rounded-none -mx-4 border-x-0 sm:border-x sm:rounded-lg sm:mx-0">
      <div className="flex flex-1">
        <CardHeader className="flex-1 p-4 sm:p-6">
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardHeader className="p-4 sm:p-6 flex flex-row space-y-0 gap-2">
          <Button asChild size="icon">
            <Link href={`/groups/${groupId}/shopping/create`} title={t('create')}>
              <Plus className="w-4 h-4" />
            </Link>
          </Button>
        </CardHeader>
      </div>

      <CardContent className="p-0 pt-2 pb-4 sm:pb-6 flex flex-col gap-4 relative">
        <ShoppingList />
      </CardContent>
    </Card>
  )
}
