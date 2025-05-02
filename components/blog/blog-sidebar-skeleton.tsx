export function BlogSidebarSkeleton() {
  return (
    <aside className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-10 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-10 bg-gray-200 rounded w-1/3"></div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="h-5 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start">
              <div className="flex-shrink-0 mr-3 bg-gray-200 rounded w-[60px] h-[60px]"></div>
              <div className="w-full">
                <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="h-5 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-[30px]"></div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
