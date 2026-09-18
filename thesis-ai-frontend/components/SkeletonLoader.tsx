function SkeletonBar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />
}

function PaperSkeletonCard() {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4" aria-hidden="true">
      <div className="flex items-center gap-2">
        <SkeletonBar className="h-5 w-5" />
        <SkeletonBar className="h-5 w-14" />
        <SkeletonBar className="h-5 w-20" />
      </div>
      <SkeletonBar className="mt-4 h-4 w-full" />
      <SkeletonBar className="mt-2 h-4 w-4/5" />
      <SkeletonBar className="mt-4 h-3 w-full" />
      <SkeletonBar className="mt-2 h-3 w-11/12" />
      <SkeletonBar className="mt-2 h-3 w-2/3" />
    </article>
  )
}

export function SkeletonLoader() {
  return (
    <div className="grid min-h-0 flex-1 auto-rows-[minmax(28rem,auto)] grid-cols-1 lg:grid-rows-1 lg:grid-cols-[1.1fr_0.9fr]" aria-label="Loading research results" aria-busy="true">
      <section aria-label="Loading literature review" className="min-h-0 border-gray-200 lg:border-r">
        <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-4 sm:px-8">
          <SkeletonBar className="h-4 w-4 rounded-full" />
          <SkeletonBar className="h-4 w-32" />
        </div>
        <div className="mx-auto max-w-2xl space-y-8 px-4 py-8 sm:px-8" aria-hidden="true">
          <div className="space-y-3">
            <SkeletonBar className="h-5 w-44" />
            <SkeletonBar className="h-4 w-full" />
            <SkeletonBar className="h-4 w-full" />
            <SkeletonBar className="h-4 w-4/5" />
          </div>
          <div className="space-y-3">
            <SkeletonBar className="h-5 w-36" />
            <SkeletonBar className="h-4 w-full" />
            <SkeletonBar className="h-4 w-11/12" />
            <SkeletonBar className="h-4 w-3/4" />
          </div>
          <div className="space-y-3">
            <SkeletonBar className="h-5 w-52" />
            <SkeletonBar className="h-4 w-full" />
            <SkeletonBar className="h-4 w-5/6" />
          </div>
        </div>
      </section>

      <section aria-label="Loading paper sources" className="min-h-0 border-t border-gray-200 lg:border-t-0">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <SkeletonBar className="h-4 w-14" />
            <SkeletonBar className="h-5 w-6 rounded-full" />
          </div>
          <SkeletonBar className="h-8 w-28" />
        </div>
        <div className="space-y-3 px-4 py-5 sm:px-6">
          {Array.from({ length: 3 }).map((_, index) => <PaperSkeletonCard key={index} />)}
        </div>
      </section>
    </div>
  )
}