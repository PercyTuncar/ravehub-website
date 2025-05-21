"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import type { BlogPost } from "@/types/blog"
import { getAllPosts } from "@/lib/firebase/blog"
import { BlogCard, BlogCardSkeleton } from "./blog-card"
import { Loader2 } from "lucide-react"
import { useInView } from "react-intersection-observer"

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

  // Usar IntersectionObserver hook para infinite scroll más eficiente
  const { ref: loaderRef, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  })

  // Memoizar los parámetros de búsqueda para evitar re-renders innecesarios
  const searchKey = useMemo(() => `${categoryParam || ""}-${tagParam || ""}`, [categoryParam, tagParam])

  // Función para cargar posts optimizada con useCallback
  const fetchPosts = useCallback(
    async (pageNum: number, resetList = false) => {
      setLoading(true)
      try {
        const {
          posts: newPosts,
          lastVisible: newLastVisible,
          hasMore: newHasMore,
        } = await getAllPosts(pageNum, pageNum === 1 ? 6 : 3, categoryParam || undefined, tagParam || undefined)

        if (resetList) {
          setPosts(newPosts)
        } else {
          setPosts((prevPosts) => [...prevPosts, ...newPosts])
        }

        setLastVisible(newLastVisible)
        setHasMore(newHasMore)
        setInitialLoad(false)
      } catch (error) {
        console.error("Error al obtener posts:", error)
      } finally {
        setLoading(false)
      }
    },
    [categoryParam, tagParam],
  )

  // Efecto para cargar posts iniciales cuando cambian los filtros
  useEffect(() => {
    if (initialPosts.length === 0 || categoryParam || tagParam) {
      setPage(1)
      fetchPosts(1, true)
    } else {
      setInitialLoad(false)
    }
  }, [searchKey, initialPosts.length, fetchPosts])

  // Efecto para infinite scroll
  useEffect(() => {
    if (inView && hasMore && !loading && !initialLoad && showLoadMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchPosts(nextPage)
    }
  }, [inView, hasMore, loading, initialLoad, showLoadMore, page, fetchPosts])

  // Implementar caché del lado del cliente para mejorar la experiencia
  useEffect(() => {
    // Guardar posts en sessionStorage para navegación rápida
    if (posts.length > 0 && !categoryParam && !tagParam) {
      try {
        sessionStorage.setItem(
          "blog_recent_posts",
          JSON.stringify({
            posts,
            lastVisible,
            hasMore,
            timestamp: Date.now(),
          }),
        )
      } catch (e) {
        console.error("Error caching posts:", e)
      }
    }
  }, [posts, lastVisible, hasMore, categoryParam, tagParam])

  // Cargar desde caché si está disponible
  useEffect(() => {
    if (initialPosts.length === 0 && !categoryParam && !tagParam) {
      try {
        const cached = sessionStorage.getItem("blog_recent_posts")
        if (cached) {
          const {
            posts: cachedPosts,
            lastVisible: cachedLastVisible,
            hasMore: cachedHasMore,
            timestamp,
          } = JSON.parse(cached)

          // Usar caché solo si tiene menos de 5 minutos
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            setPosts(cachedPosts)
            setLastVisible(cachedLastVisible)
            setHasMore(cachedHasMore)
            setInitialLoad(false)
            return
          }
        }
      } catch (e) {
        console.error("Error reading cached posts:", e)
      }
    }
  }, [initialPosts.length, categoryParam, tagParam])

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
          : // Mostrar los posts cargados con optimización de renderizado
            posts.map((post, index) => (
              <BlogCard
                key={post.id}
                post={post}
                priority={index < 2} // Priorizar la carga de las primeras imágenes
              />
            ))}
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
