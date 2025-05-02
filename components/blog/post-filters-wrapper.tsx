"use client"

import { Suspense } from "react"
import { PostFilters } from "./post-filters"

export function PostFiltersWrapper() {
  return (
    <Suspense fallback={<PostFiltersSkeleton />}>
      <PostFilters />
    </Suspense>
  )
}

function PostFiltersSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
      <div className="relative w-full md:w-auto md:min-w-[320px]">
        <div className="h-10 bg-gray-200 rounded-md animate-pulse w-full"></div>
      </div>
      <div className="flex gap-2 w-full md:w-auto">
        <div className="h-10 bg-gray-200 rounded-md animate-pulse w-32"></div>
      </div>
    </div>
  )
}
