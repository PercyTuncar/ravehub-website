"use client"

import { Suspense, useEffect, useState } from "react"
import { BlogList } from "./blog-list"
import type { BlogPost } from "@/types/blog"
import { usePathname, useSearchParams } from "next/navigation"

interface PostListWrapperProps {
  initialPosts?: BlogPost[]
  categoryId?: string
  tagSlug?: string
  showLoadMore?: boolean
}

export function PostListWrapper(props: PostListWrapperProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isVisible, setIsVisible] = useState(false)

  // Efecto para restaurar la posición de desplazamiento cuando se navega hacia atrás
  useEffect(() => {
    // Guardar la posición de desplazamiento actual antes de navegar
    const handleBeforeUnload = () => {
      sessionStorage.setItem(
        `scroll_position_${pathname}${searchParams ? `_${searchParams}` : ""}`,
        window.scrollY.toString(),
      )
    }

    // Restaurar la posición de desplazamiento al cargar la página
    const savedPosition = sessionStorage.getItem(`scroll_position_${pathname}${searchParams ? `_${searchParams}` : ""}`)

    if (savedPosition) {
      window.scrollTo(0, Number.parseInt(savedPosition))
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    setIsVisible(true)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [pathname, searchParams])

  if (!isVisible) {
    return <PostListSkeleton />
  }

  return (
    <Suspense fallback={<PostListSkeleton />}>
      <BlogList {...props} />
    </Suspense>
  )
}

function PostListSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse border rounded-lg overflow-hidden">
            <div className="h-48 bg-gray-200"></div>
            <div className="p-4 space-y-3">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="flex justify-between pt-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
