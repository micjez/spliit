'use client'

import { CategorySelector } from '@/components/category-selector'
import { AsyncButton } from '@/components/async-button'
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
import {
  ShoppingItemFormValues,
  shoppingItemFormSchema,
} from '@/lib/schemas'
import { AppRouterOutput } from '@/trpc/routers/_app'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

const UNIT_SUGGESTIONS = ['pcs', 'kg', 'g', 'l', 'ml', 'packs']

type SubmitAction = 'create' | 'create-next'

export function ShoppingItemForm({
  categories,
  defaultValues,
  mode,
  title,
  description,
  cancelHref,
  onSubmit,
  onDelete,
}: {
  categories: AppRouterOutput['categories']['list']['categories']
  defaultValues?: Partial<ShoppingItemFormValues>
  mode: 'create' | 'edit'
  title: string
  description: string
  cancelHref: string
  onSubmit: (
    value: ShoppingItemFormValues,
    submitAction: SubmitAction,
  ) => Promise<void>
  onDelete?: () => Promise<void>
}) {
  const t = useTranslations('Shopping.Form')
  const td = useTranslations('Shopping.DeletePopup')
  const form = useForm<ShoppingItemFormValues>({
    resolver: zodResolver(shoppingItemFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      quantity: defaultValues?.quantity ?? 1,
      unit: defaultValues?.unit ?? '',
      categoryId: defaultValues?.categoryId ?? 0,
      notes: defaultValues?.notes ?? '',
    },
  })

  useEffect(() => {
    form.reset({
      title: defaultValues?.title ?? '',
      quantity: defaultValues?.quantity ?? 1,
      unit: defaultValues?.unit ?? '',
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
                    quantity: Number(values.quantity),
                    unit: values.unit,
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
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('quantityLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="decimal"
                      placeholder="1"
                      {...field}
                      onChange={(event) => field.onChange(event.target.value)}
                    />
                  </FormControl>
                  <FormDescription>{t('quantityDescription')}</FormDescription>
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
                      list="shopping-unit-suggestions"
                      placeholder={t('unitPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <datalist id="shopping-unit-suggestions">
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
                <FormItem>
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
              <div>
                {onDelete && (
                  <AsyncButton
                    type="button"
                    variant="destructive"
                    loadingContent={t('deleting')}
                    action={onDelete}
                  >
                    {td('label')}
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
