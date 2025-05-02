import type { Metadata } from "next"
import { Suspense } from "react"
import BlogList from "./blog-list"
import BlogListFallback from "./blog-list-fallback"
import FeaturedBlogBanner from "@/components/blog/featured-blog-banner"
import { Breadcrumbs } from "@/components/breadcrumbs"

export const metadata: Metadata = {
  title: "Blog | RaveHub",
  description: "Explora nuestro blog sobre música electrónica, festivales, cultura rave y más.",
  openGraph: {
    title: "Blog | RaveHub",
    description: "Explora nuestro blog sobre música electrónica, festivales, cultura rave y más.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | RaveHub",
    description: "Explora nuestro blog sobre música electrónica, festivales, cultura rave y más.",
  },
  alternates: {
    canonical: "/blog",
  },
}

export const viewport = {
  themeColor: "#000000",
}

export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <FeaturedBlogBanner />
      <Breadcrumbs className="my-4" />
      <h1 className="text-3xl font-bold mb-8">Blog</h1>

      <Suspense fallback={<BlogListFallback />}>
        <BlogList />
      </Suspense>
    </div>
  )
}
