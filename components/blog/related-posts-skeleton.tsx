export function RelatedPostsSkeleton() {
  return (
    <div className="mt-8">
      <div className="h-7 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gray-200 aspect-video w-full"></div>
            <div className="p-4">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
