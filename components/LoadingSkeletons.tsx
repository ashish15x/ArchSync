export function ProjectCardSkeleton() {
  return (
    <div className="border border-gray-800 rounded-lg p-6 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-6 h-6 bg-gray-800 rounded"></div>
        <div className="flex-1">
          <div className="h-6 bg-gray-800 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-800 rounded w-1/2"></div>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <div className="h-6 w-16 bg-gray-800 rounded"></div>
        <div className="h-6 w-16 bg-gray-800 rounded"></div>
      </div>
    </div>
  );
}

export function UnderstandingCardSkeleton() {
  return (
    <div className="border border-gray-800 rounded-lg p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 rounded-full bg-gray-800"></div>
          <div className="flex-1">
            <div className="h-5 bg-gray-800 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-800 rounded w-24"></div>
          </div>
        </div>
        <div className="h-6 w-20 bg-gray-800 rounded"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-800 rounded w-full"></div>
        <div className="h-4 bg-gray-800 rounded w-5/6"></div>
        <div className="h-4 bg-gray-800 rounded w-4/6"></div>
      </div>
    </div>
  );
}

export function SearchResultSkeleton() {
  return (
    <div className="border border-gray-800 rounded-lg p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 rounded-full bg-gray-800"></div>
          <div className="flex-1">
            <div className="h-5 bg-gray-800 rounded w-40 mb-2"></div>
            <div className="h-4 bg-gray-800 rounded w-32"></div>
          </div>
        </div>
        <div className="h-8 w-24 bg-gray-800 rounded-full"></div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-4 bg-gray-800 rounded w-full"></div>
        <div className="h-4 bg-gray-800 rounded w-11/12"></div>
        <div className="h-4 bg-gray-800 rounded w-3/4"></div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-800">
        <div className="h-4 w-32 bg-gray-800 rounded"></div>
        <div className="h-4 w-24 bg-gray-800 rounded"></div>
      </div>
    </div>
  );
}
