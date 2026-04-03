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
import { Textarea } from '@/components/ui/textarea'
import { StockItemFormValues, stockItemFormSchema } from '@/lib/schemas'
import { AppRouterOutput } from '@/trpc/routers/_app'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

const INTERVAL_SUGGESTIONS = [7, 14, 30, 60, 90]
const UNIT_SUGGESTIONS = ['pcs', 'kg', 'g', 'l', 'ml', 'packs']

type SubmitAction = 'create' | 'create-next'

export function StockItemForm({
  categories,
  defaultValues,
  mode,
  title,
  description,
  cancelHref,
  createShoppingHref,
  existingShoppingHref,
  onSubmit,
  onDelete,
  onCheck,
}: {
  categories: AppRouterOutput['categories']['list']['categories']
  defaultValues?: Partial<StockItemFormValues>
  mode: 'create' | 'edit'
  title: string
  description: string
  cancelHref: string
  createShoppingHref?: string
  existingShoppingHref?: string
  onSubmit: (
    value: StockItemFormValues,
    submitAction: SubmitAction,
  ) => Promise<void>
  onDelete?: () => Promise<void>
  onCheck?: () => Promise<void>
}) {
  const t = useTranslations('Stock.Form')
  const form = useForm<StockItemFormValues>({
    resolver: zodResolver(stockItemFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      currentQuantity: defaultValues?.currentQuantity ?? 0,
      unit: defaultValues?.unit ?? '',
      checkIntervalDays: defaultValues?.checkIntervalDays ?? 30,
      categoryId: defaultValues?.categoryId ?? 0,
      notes: defaultValues?.notes ?? '',
    },
  })

  useEffect(() => {
    form.reset({
      title: defaultValues?.title ?? '',
      currentQuantity: defaultValues?.currentQuantity ?? 0,
      unit: defaultValues?.unit ?? '',
      checkIntervalDays: defaultValues?.checkIntervalDays ?? 30,
      categoryId: defaultValues?.categoryId ?? 0,
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
                    notes: '',
                    currentQuantity: values.currentQuantity,
                    unit: values.unit,
                    checkIntervalDays: values.checkIntervalDays,
                    categoryId: values.categoryId ?? 0,
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
              name="currentQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('currentQuantityLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="decimal"
                      placeholder="0"
                      {...field}
                      onChange={(event) => field.onChange(event.target.value)}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('currentQuantityDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('unitLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      list="stock-unit-suggestions"
                      placeholder={t('unitPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <datalist id="stock-unit-suggestions">
                    {UNIT_SUGGESTIONS.map((unit) => (
                      <option key={unit} value={unit} />
                    ))}
                  </datalist>
                  <FormDescription>{t('unitDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="checkIntervalDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('checkIntervalDaysLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      list="stock-interval-suggestions"
                      inputMode="numeric"
                      placeholder="30"
                      {...field}
                      onChange={(event) => field.onChange(event.target.value)}
                    />
                  </FormControl>
                  <datalist id="stock-interval-suggestions">
                    {INTERVAL_SUGGESTIONS.map((days) => (
                      <option key={days} value={days} />
                    ))}
                  </datalist>
                  <FormDescription>
                    {t('checkIntervalDaysDescription')}
                  </FormDescription>
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
                {onCheck && (
                  <AsyncButton
                    type="button"
                    variant="outline"
                    loadingContent={t('checking')}
                    action={onCheck}
                  >
                    {t('markChecked')}
                  </AsyncButton>
                )}
                {existingShoppingHref ? (
                  <Button variant="outline" asChild>
                    <Link href={existingShoppingHref}>
                      {t('viewShoppingItem')}
                    </Link>
                  </Button>
                ) : (
                  createShoppingHref && (
                    <Button variant="outline" asChild>
                      <Link href={createShoppingHref}>
                        {t('createShoppingItem')}
                      </Link>
                    </Button>
                  )
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
