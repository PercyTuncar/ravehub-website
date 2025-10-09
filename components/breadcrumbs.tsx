"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href: string
  isCurrent?: boolean
}

interface BreadcrumbsProps {
  className?: string
}

export function Breadcrumbs({ className = "" }: BreadcrumbsProps) {
  const pathname = usePathname()

  // Skip rendering breadcrumbs on homepage
  if (pathname === "/") return null

  // Generate breadcrumb items based on the current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const asPathWithoutQuery = pathname.split("?")[0]
    const asPathNestedRoutes = asPathWithoutQuery.split("/").filter((v) => v.length > 0)

    const crumblist = asPathNestedRoutes.map((subpath, idx) => {
      const href = "/" + asPathNestedRoutes.slice(0, idx + 1).join("/")
      return {
        href,
        label: formatBreadcrumb(subpath),
        isCurrent: idx === asPathNestedRoutes.length - 1,
      }
    })

    return [{ href: "/", label: "Inicio" }, ...crumblist]
  }

  // Format the breadcrumb label to be more readable
  const formatBreadcrumb = (str: string): string => {
    // Handle special cases
    if (str === "eventos") return "Eventos"
    if (str === "tienda") return "Tienda"
    if (str === "blog") return "Blog"
    if (str === "galeria") return "Galería"
    if (str === "contacto") return "Contacto"
    if (str === "perfil") return "Perfil"
    if (str === "admin") return "Admin"

    // Default formatting: capitalize and replace hyphens with spaces
    return str
      .replace(/-/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const breadcrumbs = generateBreadcrumbs()
  const CANONICAL_DOMAIN = "https://www.ravehublatam.com"

  // Generate structured data for breadcrumbs
  const breadcrumbsStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: crumb.label,
      item: {
        "@type": "Thing",
        id: `${CANONICAL_DOMAIN}${crumb.href}`,
      },
    })),
  }

  return (
    <nav aria-label="Breadcrumbs" className={`py-2 px-4 bg-gray-50 dark:bg-gray-800 text-sm ${className}`}>
      <ol className="flex flex-wrap items-center">
        {breadcrumbs.map((crumb, idx) => (
          <li key={idx} className="flex items-center">
            {idx > 0 && <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />}

            {crumb.isCurrent ? (
              <span aria-current="page" className="font-medium text-gray-700 dark:text-gray-300">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-gray-300 flex items-center"
              >
                {idx === 0 ? <Home className="h-4 w-4 mr-1" /> : null}
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>

      {/* Structured data for breadcrumbs - always include it */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbsStructuredData),
        }}
      />
    </nav>
  )
}
