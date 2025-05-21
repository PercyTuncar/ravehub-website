"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import type { BlogPost } from "@/types/blog"
import { getAllPosts } from "@/lib/firebase/blog"
import { BlogCard, BlogCardSkeleton } from "./blog-card"
import { Loader2 } from "lucide-react"

interface BlogListProps {
  initialPosts?: BlogPost[]
  initialLastVisible?: string | null
  initialHasMore?: boolean
  categoryId?: string
  tagSlug?: string
  showLoadMore?: boolean
}

export function BlogList({
  initialPosts = [],
  initialLastVisible = null,
  initialHasMore = true,
  categoryId,
  tagSlug,
  showLoadMore = true,
}: BlogListProps) {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get("categoria") || categoryId
  const tagParam = searchParams.get("etiqueta") || tagSlug

  const [posts, setPosts] = useState<BlogPost[]>(initialPosts)
  const [lastVisible, setLastVisible] = useState<string | null>(initialLastVisible)
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore)
  const [page, setPage] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(false)
  const [initialLoad, setInitialLoad] = useState<boolean>(initialPosts.length === 0)
  const loaderRef = useRef<HTMLDivElement>(null)

  // Cuando cambian los parámetros de búsqueda, reiniciamos la lista de posts
  useEffect(() => {
    const query = searchParams.get("q")
    const sort = searchParams.get("sort")
    const category = categoryParam || searchParams.get("categoria")
    const tag = tagParam || searchParams.get("etiqueta")

    // Crear una clave de caché basada en los parámetros actuales
    const cacheKey = `posts_${query || ""}_${sort || "recent"}_${category || ""}_${tag || ""}_page1`

    const fetchPosts = async () => {
      setLoading(true)
      try {
        // Intentar obtener de sessionStorage primero
        const cachedData = sessionStorage.getItem(cacheKey)
        if (cachedData) {
          const parsed = JSON.parse(cachedData)
          const cacheTime = parsed.timestamp
          // Usar caché si tiene menos de 1 minuto
          if (Date.now() - cacheTime < 60000) {
            setPosts(parsed.posts)
            setLastVisible(parsed.lastVisible)
            setHasMore(parsed.hasMore)
            setPage(1)
            setInitialLoad(false)
            setLoading(false)
            return
          }
        }

        const {
          posts: newPosts,
          lastVisible: newLastVisible,
          hasMore: newHasMore,
        } = await getAllPosts(1, 6, categoryParam || undefined, tagParam || undefined)

        setPosts(newPosts)
        setLastVisible(newLastVisible)
        setHasMore(newHasMore)
        setPage(1)
        setInitialLoad(false)

        // Guardar en sessionStorage
        try {
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({
              posts: newPosts,
              lastVisible: newLastVisible,
              hasMore: newHasMore,
              timestamp: Date.now(),
            }),
          )
        } catch (e) {
          console.error("Error caching posts:", e)
        }
      } catch (error) {
        console.error("Error al obtener posts:", error)
      } finally {
        setLoading(false)
      }
    }

    if (initialPosts.length === 0 || categoryParam || tagParam || searchParams.get("q") || searchParams.get("sort")) {
      fetchPosts()
    } else {
      setInitialLoad(false)
    }
  }, [categoryParam, tagParam, searchParams, initialPosts.length])

  const loadMorePosts = async () => {
    if (!hasMore || loading) return

    setLoading(true)
    try {
      const nextPage = page + 1
      const {
        posts: newPosts,
        lastVisible: newLastVisible,
        hasMore: newHasMore,
      } = await getAllPosts(nextPage, 3, categoryParam || undefined, tagParam || undefined)

      setPosts((prevPosts) => [...prevPosts, ...newPosts])
      setLastVisible(newLastVisible)
      setHasMore(newHasMore)
      setPage(nextPage)
    } catch (error) {
      console.error("Error al cargar más posts:", error)
    } finally {
      setLoading(false)
    }
  }

  // Configurar el observador de intersección para el infinite scroll
  useEffect(() => {
    if (!showLoadMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !loading && !initialLoad) {
          loadMorePosts()
        }
      },
      { rootMargin: "200px" }, // Cargar más contenido cuando estemos a 200px del final
    )

    const currentLoaderRef = loaderRef.current
    if (currentLoaderRef) {
      observer.observe(currentLoaderRef)
    }

    return () => {
      if (currentLoaderRef) {
        observer.unobserve(currentLoaderRef)
      }
    }
  }, [hasMore, loading, initialLoad, showLoadMore])

  if (posts.length === 0 && !loading && !initialLoad) {
    return (
      <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
        <h3 className="text-xl font-semibold mb-2">No se encontraron artículos</h3>
        <p className="text-gray-500">No hay artículos disponibles con los filtros seleccionados.</p>
        <p className="text-sm text-gray-400 mt-4">Intenta con otros filtros o vuelve más tarde.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {initialLoad
          ? // Mostrar skeletons durante la carga inicial
            Array.from({ length: 6 }).map((_, index) => <BlogCardSkeleton key={`skeleton-${index}`} />)
          : // Mostrar los posts cargados
            posts.map((post) => <BlogCard key={post.id} post={post} />)}
      </div>

      {/* Loader invisible que detecta cuando el usuario llega al final */}
      {showLoadMore && hasMore && (
        <div ref={loaderRef} className="mt-8 text-center">
          {loading && (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Cargando más artículos...</span>
            </div>
          )}
        </div>
      )}

      {/* Mensaje cuando no hay más posts para cargar */}
      {!hasMore && posts.length > 0 && !initialLoad && (
        <div className="mt-8 text-center text-gray-500 py-4">No hay más artículos para mostrar</div>
      )}
    </div>
  )
}

// También exportar como default para mantener compatibilidad
export default BlogList
