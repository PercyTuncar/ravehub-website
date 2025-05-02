export function EventsLoading() {
  return (
    <div className="mt-6">
      {/* Banner skeleton */}
      <div className="w-full h-[300px] bg-muted animate-pulse relative rounded-lg overflow-hidden mb-8">
        <div className="absolute bottom-8 left-8 right-8">
          <div className="h-8 w-48 bg-muted-foreground/20 rounded-md mb-2"></div>
          <div className="h-4 w-96 bg-muted-foreground/20 rounded-md mb-4"></div>
          <div className="flex gap-2">
            <div className="h-9 w-32 bg-muted-foreground/20 rounded-md"></div>
            <div className="h-9 w-32 bg-muted-foreground/20 rounded-md"></div>
          </div>
        </div>
      </div>

      {/* Categories skeleton */}
      <div className="flex space-x-2 overflow-x-auto pb-2 mb-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-9 w-24 bg-muted animate-pulse rounded-md flex-shrink-0"></div>
        ))}
      </div>

      {/* Filter skeleton */}
      <div className="bg-muted animate-pulse rounded-lg p-4 mb-6 h-16"></div>

      {/* Events grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-[350px] bg-muted animate-pulse rounded-lg"></div>
        ))}
      </div>
    </div>
  )
}
