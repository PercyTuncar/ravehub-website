import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const host = request.headers.get('host') || ''

  // Redirect www to non-www
  if (host.startsWith('www.')) {
    const newUrl = new URL(request.url)
    newUrl.host = host.replace(/^www\./, '')
    return NextResponse.redirect(newUrl, { status: 301 })
  }

  // Redirect http to https
  if (request.headers.get('x-forwarded-proto') === 'http') {
    const newUrl = new URL(request.url)
    newUrl.protocol = 'https'
    return NextResponse.redirect(newUrl, { status: 301 })
  }

  // Normalize trailing slashes (remove from non-root paths)
  if (pathname.length > 1 && pathname.endsWith('/')) {
    const newUrl = new URL(request.url)
    newUrl.pathname = pathname.slice(0, -1)
    return NextResponse.redirect(newUrl, { status: 301 })
  }

  // Handle case sensitivity for event slugs (convert to lowercase)
  if (pathname.startsWith('/eventos/')) {
    const slug = pathname.split('/eventos/')[1]?.split('/')[0]
    if (slug && slug !== slug.toLowerCase()) {
      const newUrl = new URL(request.url)
      newUrl.pathname = `/eventos/${slug.toLowerCase()}`
      return NextResponse.redirect(newUrl, { status: 301 })
    }
  }

  // Remove unnecessary query parameters that don't affect content
  const cleanParams = new URLSearchParams()
  const allowedParams = ['country', 'date', 'minPrice', 'maxPrice', 'search', 'category']

  for (const [key, value] of searchParams) {
    if (allowedParams.includes(key)) {
      cleanParams.set(key, value)
    }
  }

  // If query params changed, redirect to clean URL
  if (cleanParams.toString() !== searchParams.toString()) {
    const newUrl = new URL(request.url)
    newUrl.search = cleanParams.toString()
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