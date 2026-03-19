export function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Status bar skeleton */}
      <div className="bg-white rounded-xl shadow p-4 flex gap-4">
        <div className="h-5 bg-gray-200 rounded w-32" />
        <div className="h-5 bg-gray-200 rounded w-24" />
        <div className="h-5 bg-gray-200 rounded w-16" />
        <div className="h-5 bg-gray-200 rounded w-16" />
        <div className="ml-auto h-5 bg-gray-200 rounded w-24" />
      </div>

      {/* Metrics grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow p-5 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-24" />
            <div className="h-7 bg-gray-200 rounded w-36" />
          </div>
        ))}
      </div>

      {/* Fee table skeleton */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-32" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`flex justify-between px-5 py-3 ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
            <div className="h-4 bg-gray-200 rounded w-28" />
            <div className="h-4 bg-gray-200 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
