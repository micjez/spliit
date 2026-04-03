'use client'

import { CategoryIcon } from '@/app/groups/[groupId]/expenses/category-icon'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { trpc } from '@/trpc/client'
import { AppRouterOutput } from '@/trpc/routers/_app'
import { ChevronRight } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { forwardRef, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { useCurrentGroup } from '../current-group-context'

const PAGE_SIZE = 20

type ShoppingItem =
  AppRouterOutput['groups']['shopping']['list']['items'][number]

const formatQuantity = (value: ShoppingItem['quantity']) =>
  value
    .toString()
    .replace(/\.0+$/, '')
    .replace(/(\.\d*?)0+$/, '$1')

export function ShoppingList() {
  const { groupId } = useCurrentGroup()
  const utils = trpc.useUtils()

  useEffect(() => {
    utils.groups.shopping.invalidate()
  }, [utils])

  const activeQuery = trpc.groups.shopping.list.useInfiniteQuery(
    { groupId, limit: PAGE_SIZE, status: 'ACTIVE' },
    { getNextPageParam: ({ nextCursor, hasMore }) => (hasMore ? nextCursor : undefined) },
  )
  const archivedQuery = trpc.groups.shopping.list.useInfiniteQuery(
    { groupId, limit: PAGE_SIZE, status: 'ARCHIVED' },
    { getNextPageParam: ({ nextCursor, hasMore }) => (hasMore ? nextCursor : undefined) },
  )

  const activeItems = activeQuery.data?.pages.flatMap((page) => page.items) ?? []
  const archivedItems =
    archivedQuery.data?.pages.flatMap((page) => page.items) ?? []

  if (activeQuery.isLoading || archivedQuery.isLoading) return <ShoppingListLoading />

  if (activeItems.length === 0 && archivedItems.length === 0) {
    return <ShoppingEmptyState />
  }

  return (
    <div className="flex flex-col gap-4">
      <ShoppingSection
        titleKey="activeTitle"
        descriptionKey="activeDescription"
        emptyKey="activeEmpty"
        items={activeItems}
        hasMore={activeQuery.data?.pages.at(-1)?.hasMore ?? false}
        fetchNextPage={activeQuery.fetchNextPage}
      />
      <ShoppingSection
        titleKey="archivedTitle"
        descriptionKey="archivedDescription"
        emptyKey="archivedEmpty"
        items={archivedItems}
        hasMore={archivedQuery.data?.pages.at(-1)?.hasMore ?? false}
        fetchNextPage={archivedQuery.fetchNextPage}
      />
    </div>
  )
}

function ShoppingSection({
  titleKey,
  descriptionKey,
  emptyKey,
  items,
  hasMore,
  fetchNextPage,
}: {
  titleKey: 'activeTitle' | 'archivedTitle'
  descriptionKey: 'activeDescription' | 'archivedDescription'
  emptyKey: 'activeEmpty' | 'archivedEmpty'
  items: ShoppingItem[]
  hasMore: boolean
  fetchNextPage: () => Promise<unknown>
}) {
  const t = useTranslations('Shopping')
  const { ref, inView } = useInView()

  useEffect(() => {
    if (inView && hasMore) void fetchNextPage()
  }, [fetchNextPage, hasMore, inView])

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
        items.map((item) => <ShoppingItemCard key={item.id} item={item} />)
      )}
      {hasMore && <ShoppingListLoading ref={ref} />}
    </section>
  )
}

function ShoppingItemCard({ item }: { item: ShoppingItem }) {
  const { groupId } = useCurrentGroup()
  const t = useTranslations('Shopping')
  const tc = useTranslations('Categories')
  const locale = useLocale()
  const router = useRouter()
  const utils = trpc.useUtils()
  const { mutateAsync: markBoughtMutateAsync } =
    trpc.groups.shopping.markBought.useMutation()
  const { mutateAsync: restoreShoppingItemMutateAsync } =
    trpc.groups.shopping.restore.useMutation()

  return (
    <div
      className="flex justify-between sm:mx-6 px-4 sm:rounded-lg sm:pr-2 sm:pl-4 py-4 text-sm cursor-pointer hover:bg-accent gap-1 items-stretch"
      onClick={() => {
        router.push(`/groups/${groupId}/shopping/${item.id}/edit`)
      }}
    >
      <CategoryIcon
        category={item.category ?? { grouping: 'Uncategorized', name: 'General', id: 0 }}
        className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground"
      />
      <div className="flex-1">
        <div className="mb-1">{item.title}</div>
        <div className="text-xs text-muted-foreground">
          {t('quantitySummary', {
            quantity: formatQuantity(item.quantity),
            unit: item.unit,
          })}
        </div>
        <div className="text-xs text-muted-foreground">
          {item.category
            ? tc(`${item.category.grouping}.${item.category.name}`)
            : t('uncategorized')}
        </div>
        {item.notes && (
          <div className="text-xs text-muted-foreground line-clamp-2">
            {item.notes}
          </div>
        )}
      </div>
      <div className="flex flex-col justify-between items-end gap-2">
        <div
          className="self-end"
          onClick={(event) => event.stopPropagation()}
        >
          <Checkbox
            checked={item.isArchived}
            aria-label={
              item.isArchived ? t('markUnbought') : t('markBought')
            }
            onCheckedChange={async (checked) => {
              if (checked) {
                await markBoughtMutateAsync({
                  groupId,
                  shoppingItemId: item.id,
                })
              } else {
                await restoreShoppingItemMutateAsync({
                  groupId,
                  shoppingItemId: item.id,
                })
              }
              await utils.groups.shopping.invalidate()
            }}
          />
        </div>
        {item.isArchived && (
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {item.boughtByUser
              ? t('boughtByShort', { username: item.boughtByUser.username })
              : t('boughtBadge')}
          </div>
        )}
        <div className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(item.isArchived ? item.boughtAt ?? item.createdAt : item.createdAt, locale, {
            dateStyle: 'medium',
          })}
        </div>
      </div>
      <Button
        size="icon"
        variant="link"
        className="self-center hidden sm:flex"
        asChild
      >
        <Link href={`/groups/${groupId}/shopping/${item.id}/edit`}>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  )
}

function ShoppingEmptyState() {
  const { groupId } = useCurrentGroup()
  const t = useTranslations('Shopping')

  return (
    <p className="px-6 text-sm py-6">
      {t('empty')}{' '}
      <Button variant="link" asChild className="-m-4">
        <Link href={`/groups/${groupId}/shopping/create`}>{t('createFirst')}</Link>
      </Button>
    </p>
  )
}

const ShoppingListLoading = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div ref={ref}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex justify-between items-start px-2 sm:px-6 py-4 text-sm gap-2"
        >
          <div className="flex-0 pl-2 pr-1">
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-4 w-32 rounded-full" />
          </div>
          <div className="flex-0 flex flex-col gap-2 items-end mr-2 sm:mr-12">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-4 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
})
ShoppingListLoading.displayName = 'ShoppingListLoading'
