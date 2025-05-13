import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { getPostBySlug } from "@/lib/firebase/blog"
import { Breadcrumbs } from "@/components/blog/breadcrumbs"
import { PostDetailSkeleton } from "@/components/blog/post-detail-skeleton"
import { BlogSidebarSkeleton } from "@/components/blog/blog-sidebar-skeleton"
import { PostDetailWrapper } from "@/components/blog/post-detail-wrapper"
import { BlogSidebarWrapper } from "@/components/blog/blog-sidebar-wrapper"
import { getRedirectedSlug } from "@/lib/firebase/slug-redirects"
import { EnhancedPostSchema } from "@/components/blog/enhanced-post-schema"

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

// Helper function to safely format dates for ISO string
function safeISOString(date: any): string | undefined {
  if (!date) return undefined

  try {
    // If it's a string, try to convert to Date
    if (typeof date === "string") {
      const parsedDate = new Date(date)
      // Check if date is valid
      return !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : undefined
    }

    // If it's a Date object
    if (date instanceof Date) {
      // Check if date is valid
      return !isNaN(date.getTime()) ? date.toISOString() : undefined
    }

    // If it's a Firebase Timestamp (has seconds and nanoseconds)
    if (date && typeof date === "object" && "seconds" in date && "nanoseconds" in date) {
      const milliseconds = date.seconds * 1000 + date.nanoseconds / 1000000
      const parsedDate = new Date(milliseconds)
      return !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : undefined
    }

    // Last attempt: convert to Date if it's a number or valid string
    const parsedDate = new Date(date)
    return !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : undefined
  } catch (e) {
    console.error("Error converting date to ISO string:", e)
    return undefined
  }
}

// Function to extract tag names from various tag formats
function extractTagNames(tags: any[]): string[] {
  if (!tags || !Array.isArray(tags)) return []

  return tags
    .map((tag) => {
      if (typeof tag === "string") return tag
      if (typeof tag === "object" && tag !== null && "name" in tag) return tag.name
      return ""
    })
    .filter(Boolean)
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await getPostBySlug(params.slug)

  if (!post) {
    return {
      title: "Artículo no encontrado | RaveHub Blog",
      description: "El artículo que buscas no existe o ha sido eliminado.",
    }
  }

  // Extract tag names if they are objects
  const tagNames = extractTagNames(post.tags || [])

  return {
    title: post.seoTitle || `${post.title} | RaveHub Blog`,
    description: post.seoDescription || post.shortDescription || post.excerpt || "",
    keywords: post.seoKeywords || tagNames || [],
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.shortDescription || post.excerpt || "",
      images:
        post.mainImageUrl || post.featuredImageUrl
          ? [{ url: post.mainImageUrl || post.featuredImageUrl || "" }]
          : undefined,
      type: "article",
      publishedTime: safeISOString(post.publishDate),
      modifiedTime: safeISOString(post.updatedAt || post.updatedDate),
      authors: post.author ? [post.author] : undefined,
      tags: tagNames,
      section: post.categoryName,
    },
    twitter: {
      card: post.twitterCardType || "summary_large_image",
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.shortDescription || post.excerpt || "",
      images:
        post.mainImageUrl || post.featuredImageUrl ? [post.mainImageUrl || post.featuredImageUrl || ""] : undefined,
    },
    alternates: {
      canonical: post.canonicalUrl || `/blog/${post.slug}`,
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  // Check if current slug is the final one or needs redirection
  const finalSlug = await getRedirectedSlug(params.slug)

  // If final slug is different from original, redirect
  if (finalSlug !== params.slug) {
    redirect(`/blog/${finalSlug}`)
  }

  // Continue with existing logic using final slug
  const post = await getPostBySlug(finalSlug)

  if (!post) {
    console.log(`Post not found for slug: ${finalSlug}`)
    notFound()
  }

  // Full URL for schema
  const fullUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://ravehublatam.com"}/blog/${post.slug}`

  // Build basic navigation path (without category that will be loaded later)
  const breadcrumbItems = [
    { label: "Inicio", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: post.title, href: `/blog/${post.slug}`, current: true },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<PostDetailSkeleton />}>
            <PostDetailWrapper slug={finalSlug} priority={true} />
          </Suspense>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Suspense fallback={<BlogSidebarSkeleton />}>
            <BlogSidebarWrapper postId={post.id} />
          </Suspense>
        </div>
      </div>

      {/* Structured data for SEO */}
      <Suspense fallback={null}>
        <EnhancedPostSchema post={post} category={post.category} url={fullUrl} />
      </Suspense>
    </div>
  )
}
