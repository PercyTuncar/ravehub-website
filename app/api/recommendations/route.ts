import { NextResponse } from "next/server"
import { getRelatedPosts } from "@/lib/firebase/blog"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get("postId")
    const categoryId = searchParams.get("categoryId")
    const limit = parseInt(searchParams.get("limit") || "5")

    if (!postId && !categoryId) {
      return NextResponse.json(
        { error: "Se requiere postId o categoryId" },
        { status: 400 }
      )
    }

    const recommendations = await getRelatedPosts(
      postId || "",
      categoryId || "",
      [],
      limit
    )

    return NextResponse.json({
      recommendations: recommendations.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || post.seoDescription || "",
        mainImageUrl: post.mainImageUrl,
        publishDate: post.publishDate,
        category: post.category,
        tags: post.tags,
      }))
    })
  } catch (error) {
    console.error("Error fetching recommendations:", error)
    return NextResponse.json(
      { error: "Error al obtener recomendaciones" },
      { status: 500 }
    )
  }
}