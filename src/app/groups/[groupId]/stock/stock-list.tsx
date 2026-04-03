'use client'

import { CategoryIcon } from '@/app/groups/[groupId]/expenses/category-icon'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/lib/utils'
import { trpc } from '@/trpc/client'
import { AppRouterOutput } from '@/trpc/routers/_app'
import { BellRing, ChevronRight } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useCurrentGroup } from '../current-group-context'

type StockItem = AppRouterOutput['groups']['stock']['list']['items'][number]

const formatQuantity = (value: StockItem['currentQuantity']) =>
  value
    .toString()
    .replace(/\.0+$/, '')
    .replace(/(\.\d*?)0+$/, '$1')

export function StockList() {
  const { groupId } = useCurrentGroup()
  const t = useTranslations('Stock')
  const utils = trpc.useUtils()
  const { toast } = useToast()
  const remindedRef = useRef(false)

  useEffect(() => {
    void utils.groups.stock.invalidate()
  }, [utils])

  const { data, isLoading } = trpc.groups.stock.list.useQuery({ groupId })
  const dueItems =
    data?.items.filter(
      (item: StockItem) => new Date(item.nextCheckAt) <= new Date(),
    ) ?? []
  const upcomingItems =
    data?.items.filter(
      (item: StockItem) => new Date(item.nextCheckAt) > new Date(),
    ) ?? []

  useEffect(() => {
    if (remindedRef.current || dueItems.length === 0) return
    remindedRef.current = true
    toast({
      title: t('dueToastTitle', { count: dueItems.length }),
      description: t('dueToastDescription'),
    })
  }, [dueItems.length, t, toast])

  if (isLoading) return null

  if ((data?.items.length ?? 0) === 0) {
    return <StockEmptyState />
  }

  return (
    <div className="flex flex-col gap-4">
      {dueItems.length > 0 && (
        <div className="px-4 sm:px-6">
          <Alert>
            <BellRing className="h-4 w-4" />
            <AlertTitle>
              {t('dueAlertTitle', { count: dueItems.length })}
            </AlertTitle>
            <AlertDescription>{t('dueAlertDescription')}</AlertDescription>
          </Alert>
        </div>
      )}
      <StockSection
        titleKey="dueTitle"
        descriptionKey="dueDescription"
        emptyKey="dueEmpty"
        items={dueItems}
      />
      <StockSection
        titleKey="upcomingTitle"
        descriptionKey="upcomingDescription"
        emptyKey="upcomingEmpty"
        items={upcomingItems}
      />
    </div>
  )
}

function StockSection({
  titleKey,
  descriptionKey,
  emptyKey,
  items,
}: {
  titleKey: 'dueTitle' | 'upcomingTitle'
  descriptionKey: 'dueDescription' | 'upcomingDescription'
  emptyKey: 'dueEmpty' | 'upcomingEmpty'
  items: StockItem[]
}) {
  const t = useTranslations('Stock')

  return (
    <section>
      <div className="text-muted-foreground text-xs pl-4 sm:pl-6 py-1 font-semibold sticky top-16 bg-white dark:bg-[#1b1917]">
        {t(titleKey)}
      </div>
      <p className="px-4 sm:px-6 text-sm text-muted-foreground pb-2">
        {t(descriptionKey)}
      </p>
      {items.length === 0 ? (
        <p className="px-6 text-sm py-4 text-muted-foreground">{t(emptyKey)}</p>
      ) : (
        items.map((item) => <StockItemCard key={item.id} item={item} />)
      )}
    </section>
  )
}

function StockItemCard({ item }: { item: StockItem }) {
  const { groupId } = useCurrentGroup()
  const t = useTranslations('Stock')
  const tc = useTranslations('Categories')
  const locale = useLocale()
  const router = useRouter()
  const activeShoppingItem = item.shoppingItems[0]
  const isDue = new Date(item.nextCheckAt) <= new Date()

  return (
    <div
      className="flex justify-between sm:mx-6 px-4 sm:rounded-lg sm:pr-2 sm:pl-4 py-4 text-sm cursor-pointer hover:bg-accent gap-1 items-stretch"
      onClick={() => {
        router.push(`/groups/${groupId}/stock/${item.id}/edit`)
      }}
    >
      <CategoryIcon
        category={
          item.category ?? { grouping: 'Uncategorized', name: 'General', id: 0 }
        }
        className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground"
      />
      <div className="flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span>{item.title}</span>
          {isDue && <Badge variant="destructive">{t('dueBadge')}</Badge>}
          {activeShoppingItem && (
            <Badge variant="secondary">{t('onShoppingList')}</Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {t('quantitySummary', {
            quantity: formatQuantity(item.currentQuantity),
            unit: item.unit,
          })}
        </div>
        <div className="text-xs text-muted-foreground">
          {t('cadenceSummary', { days: item.checkIntervalDays })}
        </div>
        <div className="text-xs text-muted-foreground">
          {t('nextCheck', {
            date: formatDate(new Date(item.nextCheckAt), locale, {
              dateStyle: 'medium',
            }),
          })}
        </div>
        <div className="text-xs text-muted-foreground">
          {item.category
            ? tc(`${item.category.grouping}.${item.category.name}`)
            : t('uncategorized')}
        </div>
      </div>
      <Button
        size="icon"
        variant="link"
        className="self-center hidden sm:flex"
        asChild
      >
        <Link href={`/groups/${groupId}/stock/${item.id}/edit`}>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  )
}

function StockEmptyState() {
  const { groupId } = useCurrentGroup()
  const t = useTranslations('Stock')

  return (
    <p className="px-6 text-sm py-6">
      {t('empty')}{' '}
      <Button variant="link" asChild className="-m-4">
        <Link href={`/groups/${groupId}/stock/create`}>{t('createFirst')}</Link>
      </Button>
    </p>
  )
}
