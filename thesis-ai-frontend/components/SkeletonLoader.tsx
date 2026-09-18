function SkeletonBar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />
}

function PaperSkeletonCard() {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4" aria-hidden="true">
      <div className="flex flex-wrap items-center gap-1.5">
        <SkeletonBar className="h-5 w-5" />
        <SkeletonBar className="h-5 w-14" />
        <SkeletonBar className="h-5 w-20" />
        <SkeletonBar className="h-5 w-24" />
      </div>
      <SkeletonBar className="mt-4 h-4 w-full" />
      <SkeletonBar className="mt-2 h-4 w-4/5" />
      <SkeletonBar className="mt-2 h-3 w-1/3" />
      <SkeletonBar className="mt-4 h-3 w-full" />
      <SkeletonBar className="mt-2 h-3 w-11/12" />
      <SkeletonBar className="mt-2 h-3 w-2/3" />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
        <SkeletonBar className="h-8 w-28" />
        <div className="flex gap-2"><SkeletonBar className="h-8 w-20" /><SkeletonBar className="h-8 w-24" /></div>
      </div>
    </article>
  )
}

function ReviewLoadingSkeleton() {
  return (
    <section aria-label="Loading literature review" className="min-h-0">
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-4 sm:px-8">
        <SkeletonBar className="h-4 w-4 rounded-full" />
        <SkeletonBar className="h-4 w-32" />
      </div>
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-8 sm:px-8" role="status" aria-label="Generating literature review">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-500" aria-hidden="true" />
          Generating literature review...
        </div>
        <div className="space-y-8" aria-hidden="true">
          <div className="space-y-3"><SkeletonBar className="h-5 w-44" /><SkeletonBar className="h-4 w-full" /><SkeletonBar className="h-4 w-full" /><SkeletonBar className="h-4 w-4/5" /></div>
          <div className="space-y-3"><SkeletonBar className="h-5 w-36" /><SkeletonBar className="h-4 w-full" /><SkeletonBar className="h-4 w-11/12" /><SkeletonBar className="h-4 w-3/4" /></div>
          <div className="space-y-3"><SkeletonBar className="h-5 w-52" /><SkeletonBar className="h-4 w-full" /><SkeletonBar className="h-4 w-5/6" /></div>
        </div>
      </div>
    </section>
  )
}

function SourcesLoadingSkeleton() {
  return (
    <section aria-label="Loading paper sources" className="min-h-0">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2"><SkeletonBar className="h-4 w-14" /><SkeletonBar className="h-5 w-6 rounded-full" /></div>
        <SkeletonBar className="h-8 w-28" />
      </div>
      <div className="space-y-3 px-4 py-5 sm:px-6">{Array.from({ length: 3 }).map((_, index) => <PaperSkeletonCard key={index} />)}</div>
    </section>
  )
}

export function SkeletonLoader({ activeTab = "review" }: { activeTab?: "review" | "sources" }) {
  return (
    <div className="min-h-0 flex-1" aria-label="Loading research results" aria-busy="true">
      <div className="sm:hidden">{activeTab === "review" ? <ReviewLoadingSkeleton /> : <SourcesLoadingSkeleton />}</div>
      <div className="hidden min-h-0 flex-1 auto-rows-[minmax(28rem,auto)] grid-cols-1 md:grid md:grid-rows-1 md:overflow-hidden md:grid-cols-[1.1fr_0.9fr]">
        <div className="min-h-0 border-gray-200 md:border-r"><ReviewLoadingSkeleton /></div>
        <div className="min-h-0 border-t border-gray-200 md:border-t-0"><SourcesLoadingSkeleton /></div>
      </div>
    </div>
  )
}

export function LandingSkeleton() {
  return (
    <main className="min-h-screen bg-slate-50" aria-label="Loading landing page" aria-busy="true">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <SkeletonBar className="h-8 w-8 rounded-xl" />
            <SkeletonBar className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <SkeletonBar className="h-9 w-16 rounded-xl sm:w-20" />
            <SkeletonBar className="h-9 w-24 rounded-xl sm:w-28" />
          </div>
        </div>
      </nav>
      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-20 pt-24 text-center lg:px-8 lg:pb-28 lg:pt-32">
        <SkeletonBar className="h-7 w-36 rounded-full" />
        <SkeletonBar className="mt-6 h-12 w-full max-w-2xl sm:h-16" />
        <SkeletonBar className="mt-3 h-12 w-4/5 max-w-xl sm:h-5" />
        <SkeletonBar className="mt-9 h-12 w-40 rounded-xl" />
      </section>
      <section className="mx-auto grid max-w-6xl gap-5 px-6 pb-24 md:grid-cols-3 lg:px-8">
        {Array.from({ length: 3 }).map((_, index) => (
          <article key={index} className="rounded-2xl border border-slate-200 bg-white p-6">
            <SkeletonBar className="h-10 w-10 rounded-xl" />
            <SkeletonBar className="mt-5 h-4 w-36" />
            <SkeletonBar className="mt-3 h-3 w-full" />
            <SkeletonBar className="mt-2 h-3 w-4/5" />
          </article>
        ))}
      </section>
    </main>
  )
}

export function AuthSkeleton() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 sm:px-6 sm:py-12" aria-label="Loading authentication page" aria-busy="true">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2">
          <SkeletonBar className="h-8 w-8 rounded-xl" />
          <SkeletonBar className="h-4 w-20" />
        </div>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-col items-center">
            <SkeletonBar className="h-7 w-44" />
            <SkeletonBar className="mt-3 h-3 w-56" />
          </div>
          <SkeletonBar className="mt-6 h-11 w-full rounded-xl" />
          <div className="mt-6 space-y-4">
            <div>
              <SkeletonBar className="h-3 w-12" />
              <SkeletonBar className="mt-2 h-11 w-full rounded-xl" />
            </div>
            <div>
              <SkeletonBar className="h-3 w-16" />
              <SkeletonBar className="mt-2 h-11 w-full rounded-xl" />
            </div>
            <div>
              <SkeletonBar className="h-3 w-20" />
              <SkeletonBar className="mt-2 h-11 w-full rounded-xl" />
            </div>
            <SkeletonBar className="h-12 w-full rounded-xl" />
          </div>
          <div className="my-6 flex items-center gap-3">
            <SkeletonBar className="h-px flex-1" />
            <SkeletonBar className="h-3 w-24" />
            <SkeletonBar className="h-px flex-1" />
          </div>
          <SkeletonBar className="h-12 w-full rounded-xl" />
        </section>
        <SkeletonBar className="mx-auto mt-6 h-4 w-24" />
      </div>
    </main>
  )
}