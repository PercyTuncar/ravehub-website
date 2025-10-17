import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') || ''

  // Only apply redirects in production, not in development
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next()
  }

  // Redirect www to non-www
  if (host.startsWith('www.')) {
    const newUrl = new URL(request.url)
    newUrl.host = host.replace(/^www\./, '')
    return NextResponse.redirect(newUrl, { status: 301 })
  }

  // Redirect http to https (only in production)
  if (request.headers.get('x-forwarded-proto') === 'http') {
    const newUrl = new URL(request.url)
    newUrl.protocol = 'https'
    return NextResponse.redirect(newUrl, { status: 301 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}