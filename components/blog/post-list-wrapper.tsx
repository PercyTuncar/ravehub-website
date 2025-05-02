"use client"

import { Suspense } from "react"
import { PostList } from "./post-list"
import type { BlogPost } from "@/types"

interface PostListWrapperProps {
  initialPosts?: BlogPost[]
  categoryId?: string
  tagSlug?: string
  showLoadMore?: boolean
}

export function PostListWrapper(props: PostListWrapperProps) {
  return (
    <Suspense fallback={<PostListSkeleton />}>
      <PostList {...props} />
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
