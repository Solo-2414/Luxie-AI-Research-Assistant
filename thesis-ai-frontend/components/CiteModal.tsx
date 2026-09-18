"use client"

import { useState } from "react"
import { Check, Copy, Quote, X } from "lucide-react"
import type { PaperSource } from "@/lib/types"
import { formatAuthors, lastName } from "@/lib/citations"

interface CiteModalProps {
  paper: PaperSource
  open: boolean
  onClose: () => void
}

type CitationFormat = "APA" | "MLA" | "BibTeX"

function formatCitation(paper: PaperSource, format: CitationFormat): string {
  const authors = paper.authors.length > 0 ? paper.authors : ["Unknown Author"]
  const year = paper.year ?? "n.d."
  const venue = paper.venue ?? paper.source ?? ""
  const title = paper.title.trim()

  if (format === "MLA") {
    const authorText = authors.length > 1 ? `${authors[0]}, et al.` : authors[0]
    return `${authorText}. "${title}." ${venue ? `${venue}, ` : ""}${year}.`
  }

  if (format === "BibTeX") {
    const key = `${lastName(authors[0])}${paper.year ?? "nd"}${title.split(/\s+/)[0] ?? "paper"}`
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase()
    return `@article{${key},\n  title = {${title}},\n  author = {${authors.join(" and ")}},\n  year = {${paper.year ?? ""}},${venue ? `\n  journal = {${venue}},` : ""}${paper.url ? `\n  url = {${paper.url}},` : ""}\n}`
  }

  const apaAuthors = authors.length > 3 ? `${formatAuthors(authors)}` : authors.join(", ")
  return `${apaAuthors} (${year}). ${title}.${venue ? ` ${venue}.` : ""}${paper.url ? ` ${paper.url}` : ""}`
}

export function CiteModal({ paper, open, onClose }: CiteModalProps) {
  const [copied, setCopied] = useState<CitationFormat | null>(null)

  if (!open) return null

  async function copyCitation(format: CitationFormat) {
    await navigator.clipboard.writeText(formatCitation(paper, format))
    setCopied(format)
    window.setTimeout(() => setCopied(null), 1600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="cite-modal-title">
      <div className="fixed bottom-0 inset-x-0 max-h-[90dvh] overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:static sm:w-full sm:max-w-2xl sm:rounded-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600">
              <Quote className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-[0.14em]">Citation exporter</span>
            </div>
            <h2 id="cite-modal-title" className="mt-2 text-lg font-semibold text-slate-900">Cite this paper</h2>
            <p className="mt-1 text-sm text-slate-500">{paper.title}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close citation dialog" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {(["APA", "MLA", "BibTeX"] as CitationFormat[]).map((format) => (
            <section key={format} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-800">{format}</h3>
                <button type="button" onClick={() => copyCitation(format)} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                  {copied === format ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                  {copied === format ? "Copied!" : "Copy to Clipboard"}
                </button>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs leading-5 text-slate-600">{formatCitation(paper, format)}</pre>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
