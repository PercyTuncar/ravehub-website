"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, User, Star, StarHalf, Eye, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeaturedPost {
  id: string
  title: string
  slug: string
  excerpt: string
  featuredImageUrl: string
  author: string
  authorImageUrl?: string
  publishDate: Date
  categories?: string[]
  viewCount?: number
  averageRating?: number
  ratingCount?: number
  reactions?: {
    total: number
    types?: {
      like?: number
      love?: number
      hot?: number
      wow?: number
      excited?: number
      [key: string]: number | undefined
    }
  }
  comments?: any[]
}

export default function FeaturedBlogBanner() {
  const [featuredPosts, setFeaturedPosts] = useState<FeaturedPost[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const fetchFeaturedPosts = async () => {
      try {
        const postsRef = collection(db, "blog")
        const q = query(
          postsRef,
          where("featured", "==", true),
          where("status", "==", "published"),
          orderBy("featuredOrder", "asc"),
          limit(5),
        )

        const querySnapshot = await getDocs(q)
        const posts: FeaturedPost[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          posts.push({
            id: doc.id,
            title: data.title || "Sin título",
            slug: data.slug || "",
            excerpt: data.excerpt || "",
            featuredImageUrl: data.featuredImageUrl || "/placeholder.jpg",
            author: data.author || "Ravehub",
            authorImageUrl: data.authorImageUrl || "",
            publishDate: data.publishDate ? new Date(data.publishDate) : new Date(),
            categories: data.categories || [],
            viewCount: data.viewCount || 0,
            averageRating: data.averageRating || 0,
            ratingCount: data.ratingCount || 0,
            reactions: data.reactions || { total: 0, types: {} },
            comments: data.comments || [],
          })
        })

        setFeaturedPosts(posts)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching featured posts:", error)
        setLoading(false)
      }
    }

    fetchFeaturedPosts()
  }, [])

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === featuredPosts.length - 1 ? 0 : prevIndex + 1))
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? featuredPosts.length - 1 : prevIndex - 1))
  }

  useEffect(() => {
    if (featuredPosts.length <= 1 || isHovering) return

    const interval = setInterval(() => {
      nextSlide()
    }, 6000)

    return () => clearInterval(interval)
  }, [currentIndex, featuredPosts.length, isHovering])

  if (loading) {
    return (
      <div className="w-full h-[550px] bg-gradient-to-r from-gray-900/5 to-gray-900/10 animate-pulse rounded-xl mb-8">
        <div className="h-full flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (featuredPosts.length === 0) {
    return null
  }

  const mainPost = featuredPosts[currentIndex]
  const sidePostsStart = (currentIndex + 1) % featuredPosts.length
  const sidePosts = [featuredPosts[sidePostsStart], featuredPosts[(sidePostsStart + 1) % featuredPosts.length]].filter(
    Boolean,
  )

  const formatDate = (date: Date) => {
    // Formato corto: día/mes/año
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "numeric",
      year: "2-digit",
    }).format(date)
  }

  const formatNumber = (num = 0) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num.toString()
  }

  const renderStarRating = (rating = 0) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && <StarHalf className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
        ))}
      </div>
    )
  }

  return (
    <section className="w-full mb-12 overflow-hidden">
      <div className="container px-4 mx-auto">
        <div
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Main featured post */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`main-${currentIndex}`}
              className="lg:col-span-2 relative rounded-xl overflow-hidden group h-[550px] shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <Link href={`/blog/${mainPost.slug}`} className="block h-full">
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10"></div>
                <Image
                  src={mainPost.featuredImageUrl || "/images/placeholder-blog.jpg"}
                  alt={mainPost.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 66vw"
                  priority
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMyMDIwMzAiLz48L3N2Zz4="
                />
                <div className="absolute top-4 left-4 z-20 flex items-center space-x-2">
                  <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-medium rounded-md">
                    Destacado
                  </span>
                  {mainPost.averageRating > 0 && (
                    <span className="inline-flex items-center px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-md">
                      {renderStarRating(mainPost.averageRating)}
                      <span className="ml-1">({mainPost.averageRating?.toFixed(1) || 0})</span>
                    </span>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                    {mainPost.title}
                  </h2>
                  <p className="text-gray-200 mb-4 line-clamp-2">{mainPost.excerpt}</p>

                  <div className="flex flex-wrap items-center justify-between">
                    <div className="flex items-center text-gray-300 text-sm mb-2 md:mb-0">
                      {mainPost.authorImageUrl ? (
                        <Image
                          src={mainPost.authorImageUrl || "/placeholder.svg"}
                          alt={mainPost.author}
                          width={24}
                          height={24}
                          className="rounded-full mr-2 object-cover"
                          placeholder="blur"
                          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmVyc2lvbj0iMS4xIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMiIgZmlsbD0iIzMwMzA0MCIvPjwvc3ZnPg=="
                        />
                      ) : (
                        <User size={16} className="mr-2" />
                      )}
                      <span className="mr-4">{mainPost.author}</span>
                      <Calendar size={16} className="mr-1" />
                      <span>{formatDate(mainPost.publishDate)}</span>
                    </div>

                    <div className="flex items-center space-x-4 text-gray-300 text-sm">
                      <div className="flex items-center">
                        <Eye size={16} className="mr-1" />
                        <span>{formatNumber(mainPost.viewCount)}</span>
                      </div>

                      {mainPost.reactions?.total > 0 && (
                        <div className="flex items-center">
                          <div className="flex mr-1">
                            {mainPost.reactions?.types &&
                              (() => {
                                const sortedReactions = Object.entries(mainPost.reactions.types)
                                  .filter(([_, count]) => count && count > 0)
                                  .sort(([_, countA], [__, countB]) => (countB as number) - (countA as number))

                                const displayCount = 3
                                const hasMore = sortedReactions.length > displayCount

                                return (
                                  <>
                                    {sortedReactions.slice(0, displayCount).map(([type, _]) => {
                                      const getEmoji = (type: string) => {
                                        switch (type) {
                                          case "crazy":
                                            return "🤪"
                                          case "somos":
                                            return "👌"
                                          case "excited":
                                            return "😈"
                                          case "scream":
                                            return "🌈"
                                          case "ono":
                                            return "🌸"
                                          case "like":
                                            return "👍"
                                          case "love":
                                            return "❤️"
                                          case "haha":
                                            return "😂"
                                          case "wow":
                                            return "😮"
                                          case "hot":
                                            return "🔥"
                                          default:
                                            return "👍"
                                        }
                                      }
                                      return (
                                        <span key={type} className="text-sm mr-0.5" aria-label={`Reacción ${type}`}>
                                          {getEmoji(type)}
                                        </span>
                                      )
                                    })}
                                    {hasMore && <span className="text-xs font-medium">+</span>}
                                  </>
                                )
                              })()}
                          </div>
                          <span>{formatNumber(mainPost.reactions.total)}</span>
                        </div>
                      )}

                      {mainPost.comments?.length > 0 && (
                        <div className="flex items-center">
                          <MessageSquare size={16} className="mr-1" />
                          <span>{mainPost.comments.length}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Engagement bar */}
                  <div className="mt-4 pt-4 border-t border-gray-700/50">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-300">
                        {mainPost.reactions?.total > 0 && <span>{mainPost.reactions.total} reacciones</span>}
                      </div>

                      <motion.div
                        className="text-sm text-white/80 bg-primary/80 backdrop-blur-sm px-3 py-1 rounded-full"
                        whileHover={{ scale: 1.05 }}
                      >
                        Leer artículo completo
                      </motion.div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* Side posts */}
          <div className="flex flex-col space-y-4">
            {sidePosts.map((post, index) => (
              <motion.div
                key={`side-${post.id}-${index}`}
                className="relative rounded-xl overflow-hidden group h-[265px] shadow-lg"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
              >
                <Link href={`/blog/${post.slug}`} className="block h-full">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10"></div>
                  <Image
                    src={post.featuredImageUrl || "/placeholder.jpg"}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMyMDIwMzAiLz48L3N2Zz4="
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                  <div className="absolute top-3 left-3 z-20 flex items-center space-x-2">
                    <span className="inline-block px-2 py-1 bg-primary text-white text-xs font-medium rounded-md">
                      Destacado
                    </span>
                    {post.averageRating > 0 && (
                      <span className="inline-flex items-center px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-md">
                        {renderStarRating(post.averageRating)}
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>

                    <div className="flex items-center justify-between text-gray-300 text-xs">
                      <div className="flex items-center">
                        {post.authorImageUrl ? (
                          <Image
                            src={post.authorImageUrl || "/placeholder.svg"}
                            alt={post.author}
                            width={20}
                            height={20}
                            className="rounded-full mr-1 object-cover"
                            placeholder="blur"
                            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmVyc2lvbj0iMS4xIj48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIxMCIgZmlsbD0iIzMwMzA0MCIvPjwvc3ZnPg=="
                          />
                        ) : (
                          <User size={12} className="mr-1" />
                        )}
                        <span className="mr-3">{post.author}</span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <Eye size={12} className="mr-1" />
                          <span>{formatNumber(post.viewCount)}</span>
                        </div>

                        {post.reactions?.total > 0 && (
                          <div className="flex items-center">
                            <div className="flex mr-1">
                              {post.reactions?.types &&
                                (() => {
                                  const sortedReactions = Object.entries(post.reactions.types)
                                    .filter(([_, count]) => count && count > 0)
                                    .sort(([_, countA], [__, countB]) => (countB as number) - (countA as number))

                                  const displayCount = 2
                                  const hasMore = sortedReactions.length > displayCount

                                  return (
                                    <>
                                      {sortedReactions.slice(0, displayCount).map(([type, _]) => {
                                        const getEmoji = (type: string) => {
                                          switch (type) {
                                            case "crazy":
                                              return "🤪"
                                            case "somos":
                                              return "👌"
                                            case "excited":
                                              return "😈"
                                            case "scream":
                                              return "🌈"
                                            case "ono":
                                              return "🌸"
                                            case "like":
                                              return "👍"
                                            case "love":
                                              return "❤️"
                                            case "haha":
                                              return "😂"
                                            case "wow":
                                              return "😮"
                                            case "hot":
                                              return "🔥"
                                            default:
                                              return "👍"
                                          }
                                        }
                                        return (
                                          <span key={type} className="text-xs mr-0.5" aria-label={`Reacción ${type}`}>
                                            {getEmoji(type)}
                                          </span>
                                        )
                                      })}
                                      {hasMore && <span className="text-xs font-medium">+</span>}
                                    </>
                                  )
                                })()}
                            </div>
                            <span>{formatNumber(post.reactions.total)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Date bar */}
                    <div className="mt-2 pt-2 border-t border-gray-700/50 flex justify-between items-center">
                      <div className="flex items-center text-gray-300 text-xs">
                        <Calendar size={12} className="mr-1" />
                        <span>{formatDate(post.publishDate)}</span>
                      </div>

                      <motion.div
                        className="text-xs text-white/80 bg-primary/80 backdrop-blur-sm px-2 py-0.5 rounded-full"
                        whileHover={{ scale: 1.05 }}
                      >
                        Leer más
                      </motion.div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Indicators */}
        {featuredPosts.length > 1 && (
          <div className="flex justify-center mt-6 space-x-2">
            {featuredPosts.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  index === currentIndex ? "bg-primary w-8" : "bg-gray-400 hover:bg-gray-600",
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
