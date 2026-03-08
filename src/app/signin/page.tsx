import { loginAction } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

type Props = {
  searchParams?: Promise<{
    error?: string
    next?: string
  }>
}

function getErrorMessage(error?: string) {
  switch (error) {
    case 'invalid_credentials':
      return 'Invalid username or password.'
    case 'invalid_input':
      return 'Please provide a valid username and password.'
    default:
      return null
  }
}

export default async function SigninPage({ searchParams }: Props) {
  const user = await getCurrentUser()
  if (user) redirect('/groups')

  const params = searchParams ? await searchParams : undefined
  const errorMessage = getErrorMessage(params?.error)

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sign in with your username and password.
        </p>

        {errorMessage ? (
          <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}

        <form action={loginAction} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={params?.next || '/groups'} />

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              minLength={3}
              maxLength={32}
              pattern="[A-Za-z0-9._-]+"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              maxLength={72}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="rememberMe"
              className="h-4 w-4 rounded border-input"
            />
            Remember me
          </label>

          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
      </div>
    </main>
  )
}
