/**
 * Helper function to check if a route should be protected
 * @param pathname The current pathname
 * @returns boolean indicating if the route should be protected
 */
export function isProtectedRoute(pathname: string): boolean {
  // List of route prefixes that should be protected
  const protectedPrefixes = ["/perfil", "/checkout", "/mis-entradas", "/mis-compras"]

  return protectedPrefixes.some((prefix) => pathname.startsWith(prefix))
}

/**
 * Helper function to check if a route is an admin route
 * @param pathname The current pathname
 * @returns boolean indicating if the route is an admin route
 */
export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/admin")
}

/**
 * Get the appropriate redirect URL for a protected route
 * @param pathname The current pathname
 * @returns The URL to redirect to
 */
export function getRedirectUrl(pathname: string): string {
  const encodedRedirect = encodeURIComponent(pathname)
  return `/login?redirect=${encodedRedirect}`
}
