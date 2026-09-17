"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import type { LuxieResearchResponse } from "@/lib/types"
import { fetchResearch } from "@/lib/api"
import { countReferences, formatAuthors } from "@/lib/citations"
import { ResearchHeader, type ResearchFilters } from "@/components/research-header"
import { ReviewPane } from "@/components/review-pane"
import { SourcesPane } from "@/components/sources-pane"
import { ExportFooter } from "@/components/export-footer"

const EMPTY_RESPONSE: LuxieResearchResponse = { review: "", papers: [] }

type CitationStyle = "APA" | "MLA" | "Chicago"

function formatCitation(
  paper: LuxieResearchResponse["papers"][number],
  style: CitationStyle,
): string {
  const authors = formatAuthors(paper.authors)
  const year = paper.year ?? "n.d."
  const url = paper.url ? ` ${paper.url}` : ""

  if (style === "MLA") return `${authors}. "${paper.title}." ${year}.${url}`
  if (style === "Chicago") return `${authors}. "${paper.title}." ${year}.${url}`
  return `${authors} (${year}). ${paper.title}.${url}`
}

function buildExportText(
  data: LuxieResearchResponse,
  style?: CitationStyle,
): string {
  const sources = data.papers
    .map((paper, index) => {
      if (style) return `${index + 1}. ${formatCitation(paper, style)}`
      return `### [${index + 1}] ${paper.title}\n\n- Authors: ${paper.authors.join(", ") || "Unknown author"}\n- Year: ${paper.year ?? "Unknown"}\n- URL: ${paper.url ?? "Not available"}\n\n${paper.summary}`
    })
    .join("\n\n")

  return style
    ? `# ${style} citations\n\n${sources}`
    : `# Literature Review\n\n${data.review}\n\n## Sources\n\n${sources}`
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

export default function Page() {
  const currentYear = new Date().getFullYear()
  const [data, setData] = useState<LuxieResearchResponse>(EMPTY_RESPONSE)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [sortRecent, setSortRecent] = useState(false)
  const [startYear, setStartYear] = useState<number | null>(currentYear - 5)
  const [exportStatus, setExportStatus] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const referenceCounts = useMemo(
    () => countReferences(data.review, data.papers),
    [data.review, data.papers],
  )

  const handleResearch = useCallback(async (query: string, filters: ResearchFilters) => {
    const trimmed = query.trim()
    if (!trimmed) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)
    setFallbackMessage(null)
    setActiveId(null)

    try {
      const result = await fetchResearch(trimmed, filters, controller.signal)
      setData(result)
      setFallbackMessage(result.fallbackMessage ?? null)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setError(err instanceof Error ? err.message : "Research request failed")
    } finally {
      if (abortRef.current === controller) setLoading(false)
    }
  }, [])

  const handleCite = useCallback((id: string) => setActiveId(id), [])

  const handleExport = useCallback(async (format: string) => {
    try {
      if (format === "copy") {
        await copyText(buildExportText(data))
        setExportStatus("Review copied")
      } else if (format === "markdown") {
        const url = URL.createObjectURL(new Blob([buildExportText(data)], { type: "text/markdown" }))
        const link = document.createElement("a")
        link.href = url
        link.download = "luxie-literature-review.md"
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
  }, [data])

  return (
    <div className="flex h-screen flex-col bg-white">
      <ResearchHeader
        loading={loading}
        sortRecent={sortRecent}
        onSortRecentChange={setSortRecent}
        startYear={startYear}
        onStartYearChange={setStartYear}
        onResearch={handleResearch}
      />
      {error ? (
        <div role="alert" className="border-b border-red-100 bg-red-50 px-6 py-2 text-center text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="min-h-0 border-gray-200 lg:border-r">
          {fallbackMessage ? (
            <div role="status" className="mx-8 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
              {fallbackMessage}
            </div>
          ) : null}
          <ReviewPane review={data.review} papers={data.papers} activeId={activeId} loading={loading} onCite={handleCite} />
        </div>
        <div className="min-h-0 border-t border-gray-200 lg:border-t-0">
          <SourcesPane
            papers={data.papers}
            referenceCounts={referenceCounts}
            activeId={activeId}
            loading={loading}
            currentYear={currentYear}
          />
        </div>
      </main>

      <ExportFooter paperCount={data.papers.length} status={exportStatus} disabled={loading || data.papers.length === 0} onExport={handleExport} />
    </div>
  )
}
