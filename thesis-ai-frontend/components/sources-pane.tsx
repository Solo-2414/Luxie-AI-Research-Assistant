"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { FileSearch } from "lucide-react"
import type { PaperSource } from "@/lib/types"
import { paperId } from "@/lib/citations"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SourceCard } from "./source-card"
import { SourceCardSkeleton } from "./skeletons"

type SortKey = "newest" | "oldest" | "most-cited"

interface SourcesPaneProps {
  papers: PaperSource[]
  referenceCounts: number[]
  activeId: string | null
  loading: boolean
  currentYear: number
}

export function SourcesPane({ papers, referenceCounts, activeId, loading, currentYear }: SourcesPaneProps) {
  const [sort, setSort] = useState<SortKey>("newest")
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map())
  const recentCount = papers.filter((paper) => paper.year !== null && paper.year >= currentYear - 5).length
  const compliance = papers.length === 0 ? 0 : Math.round((recentCount / papers.length) * 100)

  const ordered = useMemo(() => {
    const withIndex = papers.map((paper, originalIndex) => ({ paper, originalIndex }))
    switch (sort) {
      case "newest":
        return withIndex.sort((a, b) => (b.paper.year ?? 0) - (a.paper.year ?? 0))
      case "oldest":
        return withIndex.sort((a, b) => (a.paper.year ?? 0) - (b.paper.year ?? 0))
      case "most-cited":
        return withIndex.sort(
          (a, b) => referenceCounts[b.originalIndex] - referenceCounts[a.originalIndex],
        )
    }
  }, [papers, sort, referenceCounts])

  useEffect(() => {
    if (!activeId) return
    const node = cardRefs.current.get(activeId)
    node?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [activeId])

  return (
    <section aria-label="Sources" className="flex h-full flex-col">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white/80 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-900">Sources</h2>
          {!loading && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
              {papers.length}
            </span>
          )}
          {!loading && papers.length > 0 && (
            <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[0.7rem] font-medium text-green-700">
              {compliance}% Thesis Compliant (Recent Literature)
            </span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-400">Sort</span>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger
              size="sm"
              className="h-8 w-[min(150px,45vw)] border-gray-200 bg-white text-xs"
              aria-label="Sort sources"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="most-cited">Highest citations</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SourceCardSkeleton key={i} />)
        ) : papers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
              <FileSearch className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-gray-900">No papers found</p>
            <p className="mt-1 max-w-xs text-xs text-gray-500">
              Try running a new research query to gather sources for your literature review.
            </p>
          </div>
        ) : (
          ordered.map(({ paper, originalIndex }) => {
            const id = paperId(originalIndex)
            return (
              <SourceCard
                key={id}
                ref={(node) => {
                  if (node) cardRefs.current.set(id, node)
                  else cardRefs.current.delete(id)
                }}
                paper={paper}
                index={originalIndex}
                active={id === activeId}
                referenceCount={referenceCounts[originalIndex]}
                currentYear={currentYear}
              />
            )
          })
        )}
      </div>
    </section>
  )
}
