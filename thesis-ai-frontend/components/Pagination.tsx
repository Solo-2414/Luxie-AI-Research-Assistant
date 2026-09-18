"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  page: number
  totalPages: number
  disabled?: boolean
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, disabled = false, onPageChange }: PaginationProps) {
  const safeTotalPages = Math.max(totalPages, 1)

  return (
    <nav aria-label="Search results pagination" className="flex items-center justify-center gap-3 border-t border-gray-200 bg-white/90 px-4 py-2.5 backdrop-blur-md">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={disabled || page <= 1}
        className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Previous
      </button>
      <span className="min-w-24 text-center text-xs font-medium text-gray-500" aria-live="polite">
        Page {page} of {safeTotalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={disabled || page >= safeTotalPages}
        className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
      >
        Next
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </nav>
  )
}