import { requireUser } from '@/lib/auth'
import { PropsWithChildren, Suspense } from 'react'

export default async function GroupsLayout({
  children,
}: PropsWithChildren<{}>) {
  await requireUser()

  return (
    <Suspense>
      <main className="flex-1 max-w-screen-md w-full mx-auto px-4 py-6 flex flex-col gap-6">
        {children}
      </main>
    </Suspense>
  )
}
