"use client"

import { type FormEvent, useEffect, useState } from "react"
import { Clock3, Loader2, Search, SlidersHorizontal, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteSearchHistory, fetchSearchHistory, type SearchHistoryItem } from "@/lib/api"

const SAMPLE_QUERIES = [
  "Research microplastics in marine ecosystems",
  "Climate anxiety among university students",
  "Effects of sleep deprivation on memory",
  "Digital literacy in developing countries",
  "AI ethics in higher education",
  "Urban heat islands and public health",
]

interface SearchInputProps {
  loading: boolean
  filtersOpen: boolean
  onToggleFilters: () => void
  onSearch: (query: string) => void
}

function relativeTimestamp(timestamp: string): string {
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(timestamp)
  const parsedTimestamp = hasTimezone ? timestamp : `${timestamp}Z`
  const elapsed = Math.max(0, Date.now() - new Date(parsedTimestamp).getTime())
  const minutes = Math.floor(elapsed / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  if (hours < 48) return "Yesterday"
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(parsedTimestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function SearchInput({ loading, filtersOpen, onToggleFilters, onSearch }: SearchInputProps) {
  const [query, setQuery] = useState("")
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState("")
  const [placeholderPhase, setPlaceholderPhase] = useState<"typing" | "holding" | "deleting" | "idle">("idle")
  const [focused, setFocused] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    if (focused || query) {
      setAnimatedPlaceholder("")
      setPlaceholderPhase("idle")
      return
    }
    let cancelled = false
    let timer: number | undefined
    const target = SAMPLE_QUERIES[placeholderIndex]
    let position = 0

    setAnimatedPlaceholder("")
    setPlaceholderPhase("typing")

    const typeIn = () => {
      if (cancelled) return
      position += 1
      setAnimatedPlaceholder(target.slice(0, position))
      if (position < target.length) {
        timer = window.setTimeout(typeIn, 38)
      } else {
        setPlaceholderPhase("holding")
        timer = window.setTimeout(deleteOut, 3500)
      }
    }

    const deleteOut = () => {
      if (cancelled) return
      position -= 1
      setPlaceholderPhase("deleting")
      setAnimatedPlaceholder(target.slice(0, position))
      if (position > 0) {
        timer = window.setTimeout(deleteOut, 24)
      } else {
        setPlaceholderIndex((current) => (current + 1) % SAMPLE_QUERIES.length)
      }
    }

    timer = window.setTimeout(typeIn, 38)
    return () => {
      cancelled = true
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [focused, placeholderIndex, query])

  async function loadHistory() {
    setHistoryOpen(true)
    const controller = new AbortController()
    setHistoryLoading(true)
    try {
      setHistory((await fetchSearchHistory(controller.signal)).slice(0, 5))
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (query.trim()) {
      setHistoryOpen(false)
      onSearch(query.trim())
    }
  }

  function selectHistoryItem(item: SearchHistoryItem) {
    setQuery(item.query)
    setHistoryOpen(false)
    onSearch(item.query)
  }

  async function removeHistoryItem(event: React.MouseEvent<HTMLButtonElement>, id: number) {
    event.stopPropagation()
    try {
      await deleteSearchHistory(id)
      setHistory((items) => items.filter((item) => item.id !== id))
    } catch {
      // Keep the item visible when the server cannot delete it.
    }
  }

  return (
    <div className="relative flex w-full min-w-0 max-w-3xl flex-1">
      <form onSubmit={handleSubmit} autoComplete="off" className="flex w-full items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-4 pr-1 shadow-sm transition-shadow focus-within:border-gray-300 focus-within:shadow-md">
        <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
        <label htmlFor="research-query" className="sr-only">Research query</label>
        <div className="relative min-w-0 flex-1">
          {!focused && !query ? <span className={`pointer-events-none absolute inset-y-0 left-0 flex items-center truncate text-sm text-gray-400 transition-opacity duration-300 ${placeholderPhase === "deleting" ? "opacity-60" : "opacity-100"}`} aria-hidden="true"><span className="truncate">{animatedPlaceholder}</span><span className={`ml-0.5 h-4 w-px bg-gray-400 ${placeholderPhase === "holding" ? "animate-pulse" : "opacity-70"}`} /></span> : null}
          <input id="research-query" name="research-query" autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => { setFocused(true); void loadHistory() }} onBlur={() => { setFocused(false); window.setTimeout(() => setHistoryOpen(false), 150) }} placeholder="" className="relative w-full min-w-0 bg-transparent text-sm text-gray-900 outline-none" />
        </div>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Research filters" aria-expanded={filtersOpen} onClick={onToggleFilters}>
          <SlidersHorizontal className="h-4 w-4 text-gray-400" aria-hidden="true" />
        </Button>
        <Button type="submit" disabled={loading || !query.trim()} className="min-h-9 shrink-0 gap-1.5 rounded-full bg-gray-900 px-3 text-white hover:bg-gray-800 sm:px-3.5">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /><span className="hidden sm:inline">Researching</span></> : <><Search className="h-4 w-4 sm:hidden" aria-hidden="true" /><span className="hidden sm:inline">Research</span></>}
        </Button>
      </form>

      {historyOpen ? <div className="luxcie-pop absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-gray-200 bg-white p-2 shadow-xl" onMouseDown={(event) => event.preventDefault()}>
        <div className="flex items-center justify-between px-2 py-1.5"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-gray-400">Recent searches</p>{history.length > 0 ? <span className="text-[0.68rem] text-gray-400">{history.length} saved</span> : null}</div>
        {historyLoading ? <div className="flex items-center gap-2 px-2 py-4 text-xs text-gray-500"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Loading history...</div> : history.length > 0 ? history.map((item) => <div key={item.id} className="group flex items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-gray-50"><button type="button" onClick={() => selectHistoryItem(item)} className="min-w-0 flex-1 text-left"><span className="block truncate text-sm text-gray-700">{item.query}</span><span className="mt-0.5 flex items-center gap-1 text-[0.68rem] text-gray-400"><Clock3 className="h-3 w-3" aria-hidden="true" />{relativeTimestamp(item.timestamp)}</span></button><button type="button" onClick={(event) => void removeHistoryItem(event, item.id)} aria-label={`Remove ${item.query} from search history`} className="rounded-md p-1.5 text-gray-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 focus:opacity-100"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></button></div>) : <p className="px-2 py-4 text-xs text-gray-400">No recent searches yet.</p>}
      </div> : null}
    </div>
  )
}
