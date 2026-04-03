'use client'

import { AsyncButton } from '@/components/async-button'
import { CategorySelector } from '@/components/category-selector'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ChoreItemFormValues, choreItemFormSchema } from '@/lib/schemas'
import { AppRouterOutput } from '@/trpc/routers/_app'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChoreRecurrenceRule } from '@prisma/client'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

type SubmitAction = 'create' | 'create-next'
const UNASSIGNED_VALUE = 'unassigned'

const formatDateInputValue = (value?: Date) => {
  if (!value) return ''

  const date = new Date(value)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function ChoreItemForm({
  categories,
  participants,
  defaultValues,
  mode,
  title,
  description,
  cancelHref,
  onSubmit,
  onDelete,
  onComplete,
}: {
  categories: AppRouterOutput['categories']['list']['categories']
  participants: NonNullable<AppRouterOutput['groups']['get']['group']>['participants']
  defaultValues?: Partial<ChoreItemFormValues> & { isCompleted?: boolean }
  mode: 'create' | 'edit'
  title: string
  description: string
  cancelHref: string
  onSubmit: (
    value: ChoreItemFormValues,
    submitAction: SubmitAction,
  ) => Promise<void>
  onDelete?: () => Promise<void>
  onComplete?: () => Promise<void>
}) {
  const t = useTranslations('Chores.Form')
  const form = useForm<ChoreItemFormValues>({
    resolver: zodResolver(choreItemFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      dueAt: defaultValues?.dueAt ?? new Date(),
      recurrenceRule: defaultValues?.recurrenceRule ?? ChoreRecurrenceRule.NONE,
      categoryId: defaultValues?.categoryId ?? 0,
      assigneeParticipantId: defaultValues?.assigneeParticipantId,
      notes: defaultValues?.notes ?? '',
    },
  })

  useEffect(() => {
    form.reset({
      title: defaultValues?.title ?? '',
      dueAt: defaultValues?.dueAt ?? new Date(),
      recurrenceRule: defaultValues?.recurrenceRule ?? ChoreRecurrenceRule.NONE,
      categoryId: defaultValues?.categoryId ?? 0,
      assigneeParticipantId: defaultValues?.assigneeParticipantId,
      notes: defaultValues?.notes ?? '',
    })
  }, [defaultValues, form])

  return (
    <Card className="rounded-none -mx-4 border-x-0 sm:border-x sm:rounded-lg sm:mx-0">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        <Form {...form}>
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            onSubmit={async (event) => {
              const submitter = (event.nativeEvent as SubmitEvent)
                .submitter as HTMLButtonElement | null
              const submitAction =
                (submitter?.dataset.submitAction as SubmitAction | undefined) ??
                'create'

              await form.handleSubmit(async (values) => {
                await onSubmit(values, submitAction)
                if (mode === 'create' && submitAction === 'create-next') {
                  form.reset({
                    title: '',
                    dueAt: values.dueAt,
                    recurrenceRule: values.recurrenceRule,
                    categoryId: values.categoryId ?? 0,
                    assigneeParticipantId:
                      values.assigneeParticipantId ?? UNASSIGNED_VALUE,
                    notes: '',
                  })
                }
              })(event)
            }}
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>{t('titleLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('titlePlaceholder')} {...field} />
                  </FormControl>
                  <FormDescription>{t('titleDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dueAtLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={formatDateInputValue(field.value)}
                      onChange={(event) => field.onChange(event.target.value)}
                    />
                  </FormControl>
                  <FormDescription>{t('dueAtDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recurrenceRule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('recurrenceLabel')}</FormLabel>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('recurrencePlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={ChoreRecurrenceRule.NONE}>
                        {t('recurrence.NONE')}
                      </SelectItem>
                      <SelectItem value={ChoreRecurrenceRule.DAILY}>
                        {t('recurrence.DAILY')}
                      </SelectItem>
                      <SelectItem value={ChoreRecurrenceRule.WEEKLY}>
                        {t('recurrence.WEEKLY')}
                      </SelectItem>
                      <SelectItem value={ChoreRecurrenceRule.MONTHLY}>
                        {t('recurrence.MONTHLY')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>{t('recurrenceDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assigneeParticipantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('assigneeLabel')}</FormLabel>
                  <Select
                    defaultValue={field.value}
                    onValueChange={(value) =>
                      field.onChange(
                        value === UNASSIGNED_VALUE ? undefined : value,
                      )
                    }
                    value={field.value ?? UNASSIGNED_VALUE}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('assigneePlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED_VALUE}>
                        {t('assigneeUnassigned')}
                      </SelectItem>
                      {participants.map((participant) => (
                        <SelectItem key={participant.id} value={participant.id}>
                          {participant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>{t('assigneeDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('categoryLabel')}</FormLabel>
                  <FormControl>
                    <CategorySelector
                      categories={categories}
                      defaultValue={field.value ?? 0}
                      isLoading={false}
                      onValueChange={(value) => field.onChange(value)}
                    />
                  </FormControl>
                  <FormDescription>{t('categoryDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>{t('notesLabel')}</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-24"
                      placeholder={t('notesPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t('notesDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2 flex justify-between gap-2 flex-wrap">
              <div className="flex gap-2 flex-wrap">
                {onDelete && (
                  <AsyncButton
                    type="button"
                    variant="destructive"
                    loadingContent={t('deleting')}
                    action={onDelete}
                  >
                    {t('delete')}
                  </AsyncButton>
                )}
                {onComplete && !defaultValues?.isCompleted && (
                  <AsyncButton
                    type="button"
                    variant="outline"
                    loadingContent={t('completing')}
                    action={onComplete}
                  >
                    {t('complete')}
                  </AsyncButton>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="secondary" asChild>
                  <Link href={cancelHref}>{t('cancel')}</Link>
                </Button>
                {mode === 'create' && (
                  <Button
                    type="submit"
                    variant="outline"
                    data-submit-action="create-next"
                  >
                    {t('createAndNext')}
                  </Button>
                )}
                <Button type="submit" data-submit-action="create">
                  {mode === 'edit' ? t('save') : t('create')}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
