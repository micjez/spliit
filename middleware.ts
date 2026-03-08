import { AUTH_COOKIE_NAME } from '@/lib/auth-constants'
import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = new Set([
  '/signin',
  '/api/health',
  '/api/health/liveness',
  '/api/health/readiness',
])

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.has(pathname)
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (pathname === '/login' || pathname === '/signup') {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  const hasSessionCookie = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value)

  if (!hasSessionCookie && !isPublicPath(pathname)) {
    const signinUrl = new URL('/signin', request.url)
    signinUrl.searchParams.set('next', `${pathname}${search}`)
    return NextResponse.redirect(signinUrl)
  }

  if (hasSessionCookie && pathname === '/signin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
  ],
}
