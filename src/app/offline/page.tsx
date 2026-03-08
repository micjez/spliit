import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'

export const metadata = {
  title: 'Offline',
}

export default function OfflinePage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6 sm:p-10">
      <section className="w-full max-w-lg rounded-xl border bg-card p-6 sm:p-8 text-center shadow-sm">
        <Image
          src="/logo-with-text.png"
          alt="Spliit"
          width={(35 * 522) / 180}
          height={35}
          className="mx-auto mb-6 h-auto w-auto"
          priority
        />
        <h1 className="text-xl font-semibold sm:text-2xl">You are offline</h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          Spliit cannot reach the network right now. Reconnect and try again.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link href="/">Go to home</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
