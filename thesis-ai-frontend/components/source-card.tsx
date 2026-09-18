"use client"

import { forwardRef } from "react"
import { ExternalLink, Quote } from "lucide-react"
import type { PaperSource } from "@/lib/types"
import { formatAuthors } from "@/lib/citations"
import { cn } from "@/lib/utils"

interface SourceCardProps {
  paper: PaperSource
  index: number
  active: boolean
  referenceCount: number
  currentYear: number
}

export const SourceCard = forwardRef<HTMLElement, SourceCardProps>(function SourceCard(
  { paper, index, active, referenceCount, currentYear },
  ref,
) {
  return (
    <article
      ref={ref}
      aria-current={active ? "true" : undefined}
      className={cn(
        "luxcie-fade-up scroll-mt-4 rounded-xl border bg-white p-4 transition-all duration-200 hover:-translate-y-0.5",
        active
          ? "border-blue-300 shadow-sm ring-2 ring-blue-100"
          : "border-gray-200 hover:border-gray-400 hover:shadow-sm",
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-gray-100 text-[0.7rem] font-semibold text-gray-500">
          {index + 1}
        </span>
        <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[0.7rem] font-medium text-gray-600">
          {paper.year ?? "n.d."}
        </span>
        <span className={cn(
          "rounded-full border px-2 py-0.5 text-[0.7rem] font-medium",
          paper.year !== null && paper.year >= currentYear - 5
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-gray-200 bg-gray-100 text-gray-500",
        )}>
          {paper.year !== null && paper.year >= currentYear - 5 ? "Recent Study" : "Foundational Theory"}
        </span>
        {paper.field ? (
          <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[0.7rem] font-medium text-blue-700">
            {paper.field}
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 break-words text-pretty text-sm font-semibold leading-snug text-gray-900">{paper.title}</h3>
      <p className="mt-1 break-words text-xs text-gray-500">{formatAuthors(paper.authors)}</p>

      <p className="mt-3 break-words text-sm leading-relaxed text-gray-600">{paper.summary}</p>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
          <Quote className="h-3.5 w-3.5" aria-hidden="true" />
          {referenceCount === 1 ? "Cited once" : `Cited ${referenceCount}×`}
        </span>
        {paper.url ? (
          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1"
          >
            View paper
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        ) : (
          <span className="text-xs text-gray-400">No link available</span>
        )}
      </div>
    </article>
  )
})
