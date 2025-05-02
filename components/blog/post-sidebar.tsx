"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ListOrdered, ShoppingBag, BookOpenText, Calendar, TrendingUp } from "lucide-react"
import { NewsletterForm } from "./newsletter-form"
import { formatDate, formatCurrency } from "@/lib/utils"
import { getPopularPosts, getRecentPosts } from "@/lib/firebase/blog"
import { useCurrency } from "@/context/currency-context"
import type { BlogPost, Product } from "@/types"

interface TableOfContentsItem {
  id: string
  text: string
  level: number
}

interface PostSidebarProps {
  postId: string
  content: string
  relatedProducts?: Product[]
}

export function PostSidebar({ postId, content, relatedProducts }: PostSidebarProps) {
  const { currency } = useCurrency()
  const [popularPosts, setPopularPosts] = useState<BlogPost[]>([])
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([])
  const [tableOfContents, setTableOfContents] = useState<TableOfContentsItem[]>([])
  const [activeHeading, setActiveHeading] = useState<string | null>(null)

  useEffect(() => {
    loadSidebarData()
    generateTableOfContents()

    // Setup intersection observer for headings
    setupIntersectionObserver()

    return () => {
      // Cleanup intersection observers
      document.querySelectorAll("h2, h3").forEach((heading) => {
        const observer = (heading as any).__observer
        if (observer) {
          observer.disconnect()
        }
      })
    }
  }, [postId, content])

  const loadSidebarData = async () => {
    try {
      // Load popular posts
      const popularData = await getPopularPosts(3, postId)
      setPopularPosts(popularData)

      // Load recent posts
      const recentData = await getRecentPosts(3, postId)
      setRecentPosts(recentData)
    } catch (error) {
      console.error("Error loading sidebar data:", error)
    }
  }

  const generateTableOfContents = () => {
    if (typeof document === "undefined") return

    // Get all headings in the content
    const articleElement = document.querySelector("article")
    if (!articleElement) return

    const headings = articleElement.querySelectorAll("h2, h3")
    const toc: TableOfContentsItem[] = []

    headings.forEach((heading, index) => {
      const text = heading.textContent || `Sección ${index + 1}`
      const id = text.toLowerCase().replace(/[^\w]+/g, "-")

      // Set ID on the heading element
      heading.id = id

      toc.push({
        id,
        text,
        level: heading.tagName === "H2" ? 2 : 3,
      })
    })

    setTableOfContents(toc)
  }

  const setupIntersectionObserver = () => {
    if (typeof document === "undefined" || typeof IntersectionObserver === "undefined") return

    const headingElements = document.querySelectorAll("h2, h3")

    const callback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveHeading(entry.target.id)
        }
      })
    }

    const observer = new IntersectionObserver(callback, {
      rootMargin: "0px 0px -80% 0px",
    })

    headingElements.forEach((heading) => {
      observer.observe(heading)
      // Store observer reference for cleanup
      ;(heading as any).__observer = observer
    })
  }

  const scrollToHeading = (id: string) => {
    if (typeof document === "undefined") return

    const element = document.getElementById(id)
    if (element) {
      const yOffset = -100 // Adjust based on your header height
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: "smooth" })
    }
  }

  return (
    <div className="space-y-8">
      {/* Table of Contents */}
      {tableOfContents.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 font-medium mb-3">
              <ListOrdered className="h-5 w-5" />
              <h3>Tabla de contenido</h3>
            </div>
            <nav>
              <ul className="space-y-1.5">
                {tableOfContents.map((item) => (
                  <li key={item.id} className={`text-sm ${item.level === 3 ? "ml-4" : ""}`}>
                    <button
                      onClick={() => scrollToHeading(item.id)}
                      className={`hover:text-primary transition-colors ${
                        activeHeading === item.id ? "text-primary font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {item.text}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </CardContent>
        </Card>
      )}

      {/* Products section */}
      {relatedProducts && relatedProducts.length > 0 && (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 font-medium mb-4">
                <ShoppingBag className="h-5 w-5" />
                <h3>Productos relacionados</h3>
              </div>
              <div className="space-y-4">
                {relatedProducts.map((product) => {
                  // Calculate price with discount
                  const finalPrice = product.discountPercentage
                    ? product.price * (1 - product.discountPercentage / 100)
                    : product.price

                  return (
                    <div key={product.id} className="flex gap-3">
                      <div className="relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden">
                        <Image
                          src={product.images[0] || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-col">
                        <Link href={`/tienda/${product.slug}`} className="font-medium hover:text-primary line-clamp-2">
                          {product.name}
                        </Link>
                        <div className="mt-1">
                          {product.discountPercentage ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm line-through text-muted-foreground">
                                {formatCurrency(product.price, product.currency, currency)}
                              </span>
                              <span className="font-medium text-primary">
                                {formatCurrency(finalPrice, product.currency, currency)}
                              </span>
                            </div>
                          ) : (
                            <span className="font-medium">
                              {formatCurrency(product.price, product.currency, currency)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4">
                <Button variant="outline" asChild className="w-full">
                  <Link href="/tienda">Ver más productos</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Newsletter signup */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-3">
            <h3 className="font-medium">Suscríbete a nuestro newsletter</h3>
            <p className="text-sm text-muted-foreground">
              Recibe las últimas noticias sobre festivales y música electrónica
            </p>
          </div>
          <NewsletterForm />
        </CardContent>
      </Card>

      {/* Popular Posts */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 font-medium mb-4">
            <TrendingUp className="h-5 w-5" />
            <h3>Lo más popular</h3>
          </div>
          <div className="space-y-4">
            {popularPosts.map((post) => (
              <div key={post.id} className="flex gap-3">
                <div className="relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden">
                  <Image src={post.mainImageUrl || "/placeholder.svg"} alt={post.title} fill className="object-cover" />
                </div>
                <div>
                  <Link href={`/blog/${post.slug}`} className="font-medium hover:text-primary line-clamp-2">
                    {post.title}
                  </Link>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{formatDate(post.publishDate)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Posts */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 font-medium mb-4">
            <BookOpenText className="h-5 w-5" />
            <h3>Artículos recientes</h3>
          </div>
          <div className="space-y-4">
            {recentPosts.map((post) => (
              <div key={post.id} className="flex gap-3">
                <div className="relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden">
                  <Image src={post.mainImageUrl || "/placeholder.svg"} alt={post.title} fill className="object-cover" />
                </div>
                <div>
                  <Link href={`/blog/${post.slug}`} className="font-medium hover:text-primary line-clamp-2">
                    {post.title}
                  </Link>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{formatDate(post.publishDate)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
