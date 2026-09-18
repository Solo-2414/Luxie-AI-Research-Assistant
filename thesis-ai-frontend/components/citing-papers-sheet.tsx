"use client"

import { useEffect, useRef, useState } from "react"
import { ExternalLink, FileSearch, LoaderCircle, X } from "lucide-react"
import { fetchCitingPapers } from "@/lib/api"
import type { PaperSource } from "@/lib/types"
import { formatAuthors } from "@/lib/citations"

interface CitingPapersSheetProps {
  paper: PaperSource | null
  open: boolean
  onClose: () => void
}

export function CitingPapersSheet({ paper, open, onClose }: CitingPapersSheetProps) {
  const [papers, setPapers] = useState<PaperSource[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [closing, setClosing] = useState(false)
  const [entered, setEntered] = useState(false)
  const closeTimer = useRef<number | null>(null)
  const enterFrame = useRef<number | null>(null)

  useEffect(() => {
    if (open) {
      setClosing(false)
      setEntered(false)
      enterFrame.current = window.requestAnimationFrame(() => {
        enterFrame.current = window.requestAnimationFrame(() => setEntered(true))
      })
    }
    return () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
      if (enterFrame.current !== null) window.cancelAnimationFrame(enterFrame.current)
    }
  }, [open])

  function handleClose() {
    if (closing) return
    setClosing(true)
    closeTimer.current = window.setTimeout(onClose, 220)
  }

  useEffect(() => {
    if (!open || !paper?.paperId) return
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    if (!paper.source || !["OpenAlex", "Semantic Scholar"].includes(paper.source)) {
      setPapers([])
      setError(null)
      setLoading(false)
      return () => controller.abort()
    }
    fetchCitingPapers(paper.paperId, paper.source, controller.signal)
      .then(setPapers)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Unable to load citing papers")
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [open, paper])

  if (!open || !paper) return null

  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm transition-opacity duration-200 sm:items-center sm:p-4 ${entered && !closing ? "opacity-100" : "opacity-0"}`} role="dialog" aria-modal="true" aria-labelledby="citing-papers-title" onClick={handleClose}>
      <div className={`flex w-full max-h-[85vh] h-auto flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl transition-[opacity,transform] duration-300 ease-out max-sm:fixed max-sm:bottom-0 max-sm:inset-x-0 sm:static sm:max-h-[80vh] sm:max-w-xl sm:rounded-2xl ${entered && !closing ? "max-sm:translate-y-0 opacity-100 sm:scale-100" : "max-sm:translate-y-full opacity-0 sm:scale-95"}`} onClick={(event) => event.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto my-2.5 sm:hidden" aria-hidden="true" />
        <div className="sticky top-0 z-50 flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white p-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Citation explorer</p>
            <h2 id="citing-papers-title" className="mt-2 text-lg font-semibold text-slate-900">Papers Citing This Research</h2>
            <p className="mt-1 truncate text-sm text-slate-500">{paper.title}</p>
          </div>
          <button type="button" onClick={handleClose} aria-label="Close citing papers" disabled={closing} className="rounded-full p-2 text-slate-400 transition hover:bg-gray-100 hover:text-slate-700 disabled:opacity-50">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50/50 p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading citing papers...</div>
          ) : error ? (
            <p className="py-10 text-center text-sm text-slate-500">{error}</p>
          ) : !paper.paperId || !paper.source ? (
            <p className="py-10 text-center text-sm text-slate-500">No citations found.</p>
          ) : papers.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center"><FileSearch className="h-8 w-8 text-slate-300" aria-hidden="true" /><p className="mt-3 text-sm font-medium text-slate-800">No citing papers found</p><p className="mt-1 text-xs text-slate-500">The provider did not return citing works for this paper.</p></div>
          ) : (
            <div className="space-y-3">
              {papers.map((citingPaper) => (
                <article key={`${citingPaper.paperId ?? citingPaper.title}-${citingPaper.year ?? ""}`} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><h3 className="break-words text-sm font-semibold leading-snug text-slate-900">{citingPaper.title}</h3><p className="mt-1 text-xs text-slate-500">{formatAuthors(citingPaper.authors)}{citingPaper.year ? ` · ${citingPaper.year}` : ""}{citingPaper.venue ? ` · ${citingPaper.venue}` : ""}</p></div>
                    {citingPaper.url ? <a href={citingPaper.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${citingPaper.title}`} className="shrink-0 rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"><ExternalLink className="h-4 w-4" aria-hidden="true" /></a> : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
