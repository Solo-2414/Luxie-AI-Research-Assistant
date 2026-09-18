"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { LuxcieResearchResponse } from "@/lib/types"
import { streamResearch, ResearchApiError } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { AuthModal } from "@/components/AuthModal"
import { countReferences, formatAuthors } from "@/lib/citations"
import { ResearchHeader, type ResearchFilters } from "@/components/research-header"
import { ReviewPane } from "@/components/review-pane"
import { SourcesPane } from "@/components/sources-pane"
import { ExportFooter } from "@/components/export-footer"
import { SkeletonLoader } from "@/components/SkeletonLoader"
import { Pagination } from "@/components/Pagination"

const EMPTY_RESPONSE: LuxcieResearchResponse = { review: "", papers: [] }
const GUEST_SEARCH_LIMIT = 3
type CitationStyle = "APA" | "MLA" | "Chicago"
type ActiveTab = "review" | "sources"

function formatCitation(paper: LuxcieResearchResponse["papers"][number], style: CitationStyle): string {
  const authors = formatAuthors(paper.authors)
  const year = paper.year ?? "n.d."
  const url = paper.url ? ` ${paper.url}` : ""
  if (style === "MLA" || style === "Chicago") return `${authors}. "${paper.title}." ${year}.${url}`
  return `${authors} (${year}). ${paper.title}.${url}`
}

function buildExportText(data: LuxcieResearchResponse, style?: CitationStyle): string {
  const sources = data.papers.map((paper, index) => style
    ? `${index + 1}. ${formatCitation(paper, style)}`
    : `### [${index + 1}] ${paper.title}\n\n- Authors: ${paper.authors.join(", ") || "Unknown author"}\n- Year: ${paper.year ?? "Unknown"}\n- URL: ${paper.url ?? "Not available"}\n\n${paper.summary}`
  ).join("\n\n")
  return style ? `# ${style} citations\n\n${sources}` : `# Literature Review\n\n${data.review}\n\n## Sources\n\n${sources}`
}

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand("copy")
  textarea.remove()
  if (!copied) throw new Error("Clipboard access is unavailable")
}

export default function ResearchPage() {
  const currentYear = new Date().getFullYear()
  const [data, setData] = useState<LuxcieResearchResponse>(EMPTY_RESPONSE)
  const [reviewText, setReviewText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>("review")
  const [sortRecent, setSortRecent] = useState(false)
  const [startYear, setStartYear] = useState<number | null>(currentYear - 5)
  const [exportStatus, setExportStatus] = useState<string | null>(null)
  const [guestSearches, setGuestSearches] = useState(0)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMessage, setAuthModalMessage] = useState<string | undefined>()
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [lastSearch, setLastSearch] = useState<{ query: string; filters: ResearchFilters } | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const raw = localStorage.getItem("luxcie_guest_searches")
    try {
      const saved = raw ? JSON.parse(raw) as { date?: string; count?: number } : null
      const count = saved?.date === today && typeof saved.count === "number" ? saved.count : 0
      setGuestSearches(Math.min(Math.max(count, 0), GUEST_SEARCH_LIMIT))
      localStorage.setItem("luxcie_guest_searches", JSON.stringify({ date: today, count }))
    } catch {
      setGuestSearches(0)
      localStorage.setItem("luxcie_guest_searches", JSON.stringify({ date: today, count: 0 }))
    }
  }, [])

  const openAuthModal = useCallback((message?: string) => {
    setAuthModalMessage(message)
    setAuthModalOpen(true)
  }, [])

  const referenceCounts = useMemo(() => countReferences(data.review, data.papers), [data.review, data.papers])

  const handleCitation = useCallback((id: string) => {
    setActiveId(id)
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches) {
      setActiveTab("sources")
    }
  }, [])

  const handleResearch = useCallback(async (query: string, filters: ResearchFilters, requestedPage = 1) => {
    setLoading(true)
    const trimmed = query.trim()
    if (!trimmed) {
      setLoading(false)
      return
    }
    if (!user && !authLoading && guestSearches >= GUEST_SEARCH_LIMIT) {
      setLoading(false)
      openAuthModal("You've reached today's guest limit! Sign up for free to keep researching.")
      return
    }
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setError(null)
    setFallbackMessage(null)
    setActiveId(null)
    setActiveTab("review")
    setReviewText("")
    setData(EMPTY_RESPONSE)
    setPage(requestedPage)
    setLastSearch({ query: trimmed, filters })
    try {
      await streamResearch(
        trimmed,
        filters,
        {
          onPapers: (result) => {
            setLoading(false)
            setData((current) => ({
              ...current,
              papers: result.papers,
              fallbackMessage: result.fallbackMessage,
              isGuest: result.isGuest,
              totalResults: result.totalResults,
              page: result.page,
              limit: result.limit,
              totalPages: result.totalPages,
              sourceBreakdown: result.sourceBreakdown,
            }))
            setPage(result.page ?? requestedPage)
            setTotalPages(result.totalPages ?? 1)
            setFallbackMessage(result.fallbackMessage ?? null)
            if (result.isGuest && requestedPage === 1) {
              const nextCount = Math.min(guestSearches + 1, GUEST_SEARCH_LIMIT)
              const today = new Date().toISOString().slice(0, 10)
              localStorage.setItem("luxcie_guest_searches", JSON.stringify({ date: today, count: nextCount }))
              setGuestSearches(nextCount)
            }
          },
          onText: (text) => {
            setReviewText((currentText) => {
              const nextText = currentText + text
              setData((current) => ({ ...current, review: nextText }))
              return nextText
            })
          },
        },
        controller.signal,
        requestedPage,
      )
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      if (err instanceof ResearchApiError && err.status === 429) {
        openAuthModal("You've reached today's guest limit! Sign up for free to keep researching.")
        return
      }
      setError(err instanceof Error ? err.message : "Research request failed")
    } finally {
      if (abortRef.current === controller) setLoading(false)
    }
  }, [authLoading, guestSearches, openAuthModal, user])

  const handlePageChange = useCallback((nextPage: number) => {
    if (!lastSearch || nextPage < 1 || nextPage > totalPages || nextPage === page) return
    void handleResearch(lastSearch.query, lastSearch.filters, nextPage)
  }, [handleResearch, lastSearch, page, totalPages])

  const handleExport = useCallback(async (format: string) => {
    if (!user) {
      openAuthModal("Sign in or create a free account to export your research.")
      return
    }
    try {
      if (format === "copy") {
        await copyText(buildExportText(data))
        setExportStatus("Review copied")
      } else if (format === "markdown") {
        const url = URL.createObjectURL(new Blob([buildExportText(data)], { type: "text/markdown" }))
        const link = document.createElement("a")
        link.href = url
        link.download = "luxcie-literature-review.md"
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
        setExportStatus("Markdown downloaded")
      } else if (format === "print") {
        window.print()
      } else if (format === "APA" || format === "MLA" || format === "Chicago") {
        await copyText(buildExportText(data, format))
        setExportStatus(`${format} citations copied`)
      }
      window.setTimeout(() => setExportStatus(null), 2400)
    } catch (exportError) {
      setExportStatus(exportError instanceof Error ? exportError.message : "Export failed")
    }
  }, [data, openAuthModal, user])

  return (
    <div className="luxcie-fade-in flex min-h-screen h-dvh flex-col bg-white">
      <ResearchHeader loading={loading} guestSearchesLeft={user ? null : Math.max(GUEST_SEARCH_LIMIT - guestSearches, 0)} sortRecent={sortRecent} onSortRecentChange={setSortRecent} startYear={startYear} onStartYearChange={setStartYear} onResearch={handleResearch} />
      {error ? <div role="alert" className="luxcie-fade-in border-b border-red-100 bg-red-50 px-6 py-2 text-center text-sm text-red-700">{error}</div> : null}
      <nav aria-label="Research result sections" className="sticky top-24 z-20 flex border-b border-gray-200 bg-white/95 p-2 backdrop-blur-md sm:hidden">
        <button type="button" onClick={() => setActiveTab("review")} className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${activeTab === "review" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"}`}>Literature Review</button>
        <button type="button" onClick={() => setActiveTab("sources")} className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${activeTab === "sources" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"}`}>Sources ({data.papers.length})</button>
      </nav>
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-24 md:pb-0 lg:overflow-hidden">
        {loading ? <SkeletonLoader activeTab={activeTab} /> : (
          <>
          <div key={activeTab} className="luxcie-fade-in sm:hidden">
            {activeTab === "review" ? (
              <div className="min-h-0">
                {fallbackMessage ? <div role="status" className="luxcie-pop mx-4 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">{fallbackMessage}</div> : null}
                <ReviewPane review={data.review} papers={data.papers} activeId={activeId} loading={Boolean(lastSearch && !reviewText.trim() && !error)} hasSubmittedQuery={lastSearch !== null} onCite={handleCitation} />
              </div>
            ) : (
              <SourcesPane papers={data.papers} referenceCounts={referenceCounts} activeId={activeId} loading={false} />
            )}
          </div>
          <div className="hidden min-h-0 flex-1 auto-rows-[minmax(28rem,auto)] grid-cols-1 md:grid md:grid-rows-1 md:overflow-hidden md:grid-cols-[1.1fr_0.9fr]">
            <div className="min-h-0 border-gray-200 lg:border-r">
              {fallbackMessage ? <div role="status" className="luxcie-pop mx-8 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">{fallbackMessage}</div> : null}
              <ReviewPane
                review={data.review}
                papers={data.papers}
                activeId={activeId}
                loading={Boolean(lastSearch && !reviewText.trim() && !error)}
                hasSubmittedQuery={lastSearch !== null}
                onCite={handleCitation}
              />
            </div>
            <div className="min-h-0 border-t border-gray-200 lg:border-t-0">
              <SourcesPane papers={data.papers} referenceCounts={referenceCounts} activeId={activeId} loading={false} />
            </div>
          </div>
          </>
        )}
      </main>
      <Pagination page={page} totalPages={totalPages} disabled={loading || !lastSearch} onPageChange={handlePageChange} />
      <ExportFooter paperCount={data.papers.length} status={exportStatus} disabled={loading || data.papers.length === 0} onExport={handleExport} />
      <AuthModal open={authModalOpen} message={authModalMessage} onClose={() => setAuthModalOpen(false)} />
    </div>
  )
}
