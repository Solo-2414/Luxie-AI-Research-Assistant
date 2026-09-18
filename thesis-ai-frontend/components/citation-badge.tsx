"use client"

import { cn } from "@/lib/utils"

interface CitationBadgeProps {
  label: string
  matched: boolean
  active: boolean
  onActivate: () => void
}

export function CitationBadge({ label, matched, active, onActivate }: CitationBadgeProps) {
  if (!matched) {
    // Unmatched citation: show as static, non-interactive text.
    return (
      <span className="mx-0.5 rounded-full border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[0.75em] font-medium text-gray-500">
        {label}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={onActivate}
      aria-label={`Jump to source: ${label}`}
      className={cn(
        "mx-0.5 inline-flex items-center rounded-full border px-2 py-0.5 align-baseline text-[0.75em] font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1",
        active
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100",
      )}
    >
      {label}
    </button>
  )
}
