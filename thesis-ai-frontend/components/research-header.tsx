"use client"

import { type FormEvent, useState } from "react"
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
      <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-6 py-3">
        <div className="flex shrink-0 items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900">
            <Sparkles className="h-4 w-4 text-white" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-gray-900">Luxcie AI</span>
        </div>

        <form onSubmit={handleSubmit} className="relative flex flex-1 items-center">
          <div className="flex w-full items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-4 pr-1 shadow-sm transition-shadow focus-within:border-gray-300 focus-within:shadow-md">
            <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
            <label htmlFor="research-query" className="sr-only">Research query</label>
            <input id="research-query" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Research microplastics in marine ecosystems…" className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400" />
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Research filters" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)}>
              <SlidersHorizontal className="h-4 w-4 text-gray-400" aria-hidden="true" />
            </Button>
            <Button type="submit" disabled={loading || !query.trim()} className="shrink-0 gap-1.5 rounded-full bg-gray-900 text-white hover:bg-gray-800">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Researching</> : "Research"}
            </Button>
          </div>
          {guestSearchesLeft !== null ? <span className="absolute -bottom-5 left-4 text-[0.7rem] font-medium text-gray-400">Free searches left: {guestSearchesLeft}/3</span> : null}
          {filtersOpen ? (
            <div className="luxcie-pop absolute right-1 top-11 z-40 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-500 shadow-lg">
              <label className="flex items-center gap-1.5">Limit <select value={limit} onChange={(e) => setLimit(e.target.value)} className="rounded-md border border-gray-200 bg-white px-1.5 py-1 text-xs text-gray-700"><option value="4">4</option><option value="8">8</option><option value="12">12</option><option value="20">20</option></select></label>
              <span className="h-5 w-px bg-gray-200" aria-hidden="true" />
              <span className="text-gray-400">Sort order</span>
              <select value={sortRecent ? "recent" : "relevant"} onChange={(e) => onSortRecentChange(e.target.value === "recent")} className="rounded-md border border-gray-200 bg-white px-1.5 py-1 text-xs text-gray-700"><option value="relevant">Most Relevant</option><option value="recent">Most Recent (Newest First)</option></select>
              <span className="h-5 w-px bg-gray-200" aria-hidden="true" />
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
