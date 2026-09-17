"use client"

import { BookOpen } from "lucide-react"
import type { PaperSource } from "@/lib/types"
import { ReviewMarkdown } from "./review-markdown"
import { ReviewSkeleton } from "./skeletons"

interface ReviewPaneProps {
  review: string
  papers: PaperSource[]
  activeId: string | null
  loading: boolean
  onCite: (id: string) => void
}

export function ReviewPane({ review, papers, activeId, loading, onCite }: ReviewPaneProps) {
  return (
    <section aria-label="Literature review" className="flex h-full flex-col">
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-200 bg-white/80 px-8 py-4 backdrop-blur-md">
        <BookOpen className="h-4 w-4 text-gray-400" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-gray-900">Literature Review</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-8 py-8">
          {loading ? (
            <ReviewSkeleton />
          ) : review.trim() ? (
            <>
              <ReviewMarkdown review={review} papers={papers} activeId={activeId} onCite={onCite} />
              <p className="mt-10 border-t border-gray-100 pt-4 text-xs text-gray-400">
                Click any citation to highlight its source on the right.
              </p>
            </>
          ) : (
            <div className="py-16 text-center">
              <p className="text-sm font-medium text-gray-900">No review yet</p>
              <p className="mt-1 text-xs text-gray-500">
                Run a research query to generate a literature review.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
