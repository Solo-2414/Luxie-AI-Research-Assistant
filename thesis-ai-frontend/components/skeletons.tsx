function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-100 ${className}`} />
}

export function ReviewSkeleton() {
  return (
    <div className="space-y-8" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Bar className="h-5 w-40" />
          <Bar className="h-4 w-full" />
          <Bar className="h-4 w-full" />
          <Bar className="h-4 w-4/5" />
        </div>
      ))}
    </div>
  )
}

export function SourceCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4" aria-hidden="true">
      <div className="flex gap-1.5">
        <Bar className="h-5 w-5" />
        <Bar className="h-5 w-12" />
        <Bar className="h-5 w-20" />
      </div>
      <Bar className="mt-3 h-4 w-full" />
      <Bar className="mt-2 h-4 w-2/3" />
      <Bar className="mt-4 h-3 w-full" />
      <Bar className="mt-2 h-3 w-5/6" />
    </div>
  )
}
