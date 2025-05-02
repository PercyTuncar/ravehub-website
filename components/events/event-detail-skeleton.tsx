export default function EventDetailSkeleton() {
  return (
    <div className="flex flex-col space-y-8 animate-pulse">
      {/* Event Header Skeleton */}
      <div className="relative h-[300px] md:h-[400px] rounded-xl overflow-hidden bg-muted">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
          <div className="h-8 w-32 bg-muted-foreground/20 rounded-md mb-4"></div>
          <div className="h-12 w-3/4 bg-muted-foreground/20 rounded-md mb-2"></div>
          <div className="flex flex-wrap gap-2">
            <div className="h-6 w-20 bg-muted-foreground/20 rounded-full"></div>
            <div className="h-6 w-24 bg-muted-foreground/20 rounded-full"></div>
            <div className="h-6 w-16 bg-muted-foreground/20 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Event Info Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8 order-2 lg:order-1">
          <div className="border rounded-lg overflow-hidden">
            <div className="p-4 border-b">
              <div className="h-8 w-1/3 bg-muted-foreground/20 rounded-md mb-2"></div>
              <div className="h-4 w-1/2 bg-muted-foreground/20 rounded-md"></div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="h-6 bg-muted-foreground/20 rounded-md"></div>
                <div className="h-6 bg-muted-foreground/20 rounded-md"></div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-muted-foreground/20 rounded-md"></div>
                <div className="h-4 bg-muted-foreground/20 rounded-md"></div>
                <div className="h-4 bg-muted-foreground/20 rounded-md"></div>
                <div className="h-4 w-3/4 bg-muted-foreground/20 rounded-md"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="border rounded-lg overflow-hidden">
            <div className="p-4 border-b">
              <div className="h-6 w-1/2 bg-muted-foreground/20 rounded-md mb-2"></div>
              <div className="h-4 w-2/3 bg-muted-foreground/20 rounded-md"></div>
            </div>
            <div className="p-4 space-y-4">
              <div className="h-10 bg-muted-foreground/20 rounded-md"></div>
              <div className="space-y-2">
                <div className="h-16 bg-muted-foreground/20 rounded-md"></div>
                <div className="h-16 bg-muted-foreground/20 rounded-md"></div>
                <div className="h-16 bg-muted-foreground/20 rounded-md"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
