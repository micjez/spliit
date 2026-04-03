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

type ChoreItem = AppRouterOutput['groups']['chores']['list']['items'][number]

export function ChoreList() {
  const { groupId } = useCurrentGroup()
  const t = useTranslations('Chores')
  const utils = trpc.useUtils()
  const { toast } = useToast()
  const remindedRef = useRef(false)

  useEffect(() => {
    void utils.groups.chores.invalidate()
  }, [utils])

  const { data, isLoading } = trpc.groups.chores.list.useQuery({ groupId })
  const dueItems =
    data?.items.filter(
      (item: ChoreItem) =>
        !item.isCompleted && new Date(item.dueAt) <= new Date(),
    ) ?? []
  const upcomingItems =
    data?.items.filter(
      (item: ChoreItem) =>
        !item.isCompleted && new Date(item.dueAt) > new Date(),
    ) ?? []
  const completedItems =
    data?.items.filter((item: ChoreItem) => item.isCompleted) ?? []

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
    return <ChoreEmptyState />
  }

  return (
    <div className="flex flex-col gap-4">
      {dueItems.length > 0 && (
        <div className="px-4 sm:px-6">
          <Alert>
            <BellRing className="h-4 w-4" />
            <AlertTitle>{t('dueAlertTitle', { count: dueItems.length })}</AlertTitle>
            <AlertDescription>{t('dueAlertDescription')}</AlertDescription>
          </Alert>
        </div>
      )}
      <ChoreSection
        titleKey="dueTitle"
        descriptionKey="dueDescription"
        emptyKey="dueEmpty"
        items={dueItems}
      />
      <ChoreSection
        titleKey="upcomingTitle"
        descriptionKey="upcomingDescription"
        emptyKey="upcomingEmpty"
        items={upcomingItems}
      />
      <ChoreSection
        titleKey="completedTitle"
        descriptionKey="completedDescription"
        emptyKey="completedEmpty"
        items={completedItems}
      />
    </div>
  )
}

function ChoreSection({
  titleKey,
  descriptionKey,
  emptyKey,
  items,
}: {
  titleKey: 'dueTitle' | 'upcomingTitle' | 'completedTitle'
  descriptionKey: 'dueDescription' | 'upcomingDescription' | 'completedDescription'
  emptyKey: 'dueEmpty' | 'upcomingEmpty' | 'completedEmpty'
  items: ChoreItem[]
}) {
  const t = useTranslations('Chores')

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
        items.map((item) => <ChoreItemCard key={item.id} item={item} />)
      )}
    </section>
  )
}

function ChoreItemCard({ item }: { item: ChoreItem }) {
  const { groupId } = useCurrentGroup()
  const t = useTranslations('Chores')
  const tc = useTranslations('Categories')
  const locale = useLocale()
  const router = useRouter()
  const utils = trpc.useUtils()
  const { mutateAsync: completeChoreMutateAsync } =
    trpc.groups.chores.complete.useMutation()

  const isDue = !item.isCompleted && new Date(item.dueAt) <= new Date()

  return (
    <div
      className="flex justify-between sm:mx-6 px-4 sm:rounded-lg sm:pr-2 sm:pl-4 py-4 text-sm cursor-pointer hover:bg-accent gap-2 items-stretch"
      onClick={() => {
        router.push(`/groups/${groupId}/chores/${item.id}/edit`)
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
          {item.isCompleted && <Badge variant="secondary">{t('completedBadge')}</Badge>}
        </div>
        <div className="text-xs text-muted-foreground">
          {t('dueAt', {
            date: formatDate(new Date(item.dueAt), locale, {
              dateStyle: 'medium',
            }),
          })}
        </div>
        <div className="text-xs text-muted-foreground">
          {t(`recurrence.${item.recurrenceRule}`)}
        </div>
        <div className="text-xs text-muted-foreground">
          {item.assigneeParticipant
            ? t('assignedTo', { name: item.assigneeParticipant.name })
            : t('unassigned')}
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
      <div className="flex flex-col items-end justify-between gap-2">
        {!item.isCompleted && (
          <div onClick={(event) => event.stopPropagation()}>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await completeChoreMutateAsync({
                  groupId,
                  choreId: item.id,
                })
                await utils.groups.chores.invalidate()
              }}
            >
              {t('completeAction')}
            </Button>
          </div>
        )}
        <Button
          size="icon"
          variant="link"
          className="self-center hidden sm:flex"
          asChild
        >
          <Link href={`/groups/${groupId}/chores/${item.id}/edit`}>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

function ChoreEmptyState() {
  const { groupId } = useCurrentGroup()
  const t = useTranslations('Chores')

  return (
    <p className="px-6 text-sm py-6">
      {t('empty')}{' '}
      <Button variant="link" asChild className="-m-4">
        <Link href={`/groups/${groupId}/chores/create`}>{t('createFirst')}</Link>
      </Button>
    </p>
  )
}
