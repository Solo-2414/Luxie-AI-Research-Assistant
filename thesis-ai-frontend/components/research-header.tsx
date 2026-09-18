"use client"

import { type FormEvent, useState } from "react"
import { TransitionLink } from "@/components/TransitionLink"
import { Loader2, Search, SlidersHorizontal, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ResearchHeaderProps {
  loading: boolean
  guestSearchesLeft: number | null
  sortRecent: boolean
  onSortRecentChange: (sortRecent: boolean) => void
  startYear: number | null
  onStartYearChange: (startYear: number | null) => void
  onResearch: (query: string, filters: ResearchFilters) => void
}

export interface ResearchFilters {
  limit: number
  startYear: number | null
  endYear: null
  sortRecent: boolean
}

export function ResearchHeader({ loading, guestSearchesLeft, sortRecent, onSortRecentChange, startYear, onStartYearChange, onResearch }: ResearchHeaderProps) {
  const [query, setQuery] = useState("")
  const [limit, setLimit] = useState("8")
  const [filtersOpen, setFiltersOpen] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onResearch(query, {
      limit: Number(limit),
      startYear,
      endYear: null,
      sortRecent,
    })
  }

  return (
    <header className="luxcie-fade-in sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 px-3 py-3 sm:flex-row sm:justify-center sm:items-start sm:gap-4 sm:px-6 lg:px-8">
        <TransitionLink href="/landing" aria-label="Go to Luxcie AI home" className="group flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:mt-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900">
            <Sparkles className="h-4 w-4 text-white" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-gray-900 transition-colors group-hover:text-indigo-600">Luxcie AI</span>
        </TransitionLink>

        <form onSubmit={handleSubmit} className="relative flex w-full min-w-0 max-w-3xl flex-1 flex-col">
          <div className="flex w-full items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-4 pr-1 shadow-sm transition-shadow focus-within:border-gray-300 focus-within:shadow-md">
            <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
            <label htmlFor="research-query" className="sr-only">Research query</label>
            <input id="research-query" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Research microplastics in marine ecosystems…" className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400" />
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Research filters" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)}>
              <SlidersHorizontal className="h-4 w-4 text-gray-400" aria-hidden="true" />
            </Button>
            <Button type="submit" disabled={loading || !query.trim()} className="min-h-9 shrink-0 gap-1.5 rounded-full bg-gray-900 px-3 text-white hover:bg-gray-800 sm:px-3.5">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /><span className="hidden sm:inline">Researching</span></> : <><Search className="h-4 w-4 sm:hidden" aria-hidden="true" /><span className="hidden sm:inline">Research</span></>}
            </Button>
          </div>
          {guestSearchesLeft !== null ? (
            <div aria-live="polite" className="mt-1.5 flex items-center justify-center gap-2 text-[0.7rem] text-gray-400 sm:justify-start sm:pl-4">
              <span className={`h-1.5 w-1.5 rounded-full ${guestSearchesLeft === 0 ? "bg-rose-400" : "bg-emerald-400"}`} aria-hidden="true" />
              <span>Free searches</span>
              <span className="font-semibold text-gray-600">{guestSearchesLeft} of 3 left</span>
            </div>
          ) : null}
          {filtersOpen ? (
            <div className="luxcie-pop absolute right-0 top-11 z-40 flex max-h-[calc(100dvh-6rem)] max-w-[calc(100vw-1.5rem)] flex-col items-stretch gap-2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-500 shadow-lg sm:right-1 sm:flex-row sm:flex-wrap sm:items-center">
              <label className="flex items-center gap-1.5">Limit <select value={limit} onChange={(e) => setLimit(e.target.value)} className="rounded-md border border-gray-200 bg-white px-1.5 py-1 text-xs text-gray-700"><option value="4">4</option><option value="8">8</option><option value="12">12</option><option value="20">20</option></select></label>
              <span className="hidden h-5 w-px bg-gray-200 sm:block" aria-hidden="true" />
              <span className="text-gray-400">Sort order</span>
              <select value={sortRecent ? "recent" : "relevant"} onChange={(e) => onSortRecentChange(e.target.value === "recent")} className="rounded-md border border-gray-200 bg-white px-1.5 py-1 text-xs text-gray-700"><option value="relevant">Relevance Score</option><option value="recent">Publication Date (Newest First)</option></select>
              <span className="hidden h-5 w-px bg-gray-200 sm:block" aria-hidden="true" />
              <span className="text-gray-400">Presets</span>
              <button type="button" onClick={() => onStartYearChange(new Date().getFullYear() - 5)} className={`rounded-md border px-2 py-1 text-xs ${startYear === new Date().getFullYear() - 5 ? "border-blue-300 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}>🎓 Thesis Standard (Last 5 Yrs)</button>
              <button type="button" onClick={() => onStartYearChange(new Date().getFullYear() - 3)} className={`rounded-md border px-2 py-1 text-xs ${startYear === new Date().getFullYear() - 3 ? "border-blue-300 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}>⚡ Cutting-Edge (Last 3 Yrs)</button>
              <button type="button" onClick={() => onStartYearChange(null)} className={`rounded-md border px-2 py-1 text-xs ${startYear === null ? "border-blue-300 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}>🌐 All Time</button>
            </div>
          ) : null}
        </form>
      </div>
    </header>
  )
}
