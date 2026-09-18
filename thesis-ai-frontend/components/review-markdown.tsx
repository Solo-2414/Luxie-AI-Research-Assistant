"use client"

import { Fragment, type ReactNode } from "react"
import type { PaperSource } from "@/lib/types"
import { findPaperIndexForCitation, paperId } from "@/lib/citations"
import { CitationBadge } from "./citation-badge"

interface ReviewMarkdownProps {
  review: string
  papers: PaperSource[]
  activeId: string | null
  onCite: (id: string) => void
}

/** Render inline text, converting [Author, Year] tokens into citation badges. */
function renderInline(
  text: string,
  keyPrefix: string,
  papers: PaperSource[],
  activeId: string | null,
  onCite: (id: string) => void,
): ReactNode[] {
  const parts = text.split(/(\[[^\]]+\])/g)
  return parts.map((part, i) => {
    const citationMatch = part.match(/^\[([^\]]+)\]$/)
    if (citationMatch) {
      const label = citationMatch[1]
      const index = findPaperIndexForCitation(label, papers)
      const id = index >= 0 ? paperId(index) : null
      return (
        <CitationBadge
          key={`${keyPrefix}-c${i}`}
          label={label}
          matched={id !== null}
          active={id !== null && id === activeId}
          onActivate={() => id && onCite(id)}
        />
      )
    }
    return <Fragment key={`${keyPrefix}-t${i}`}>{part}</Fragment>
  })
}

export function ReviewMarkdown({ review, papers, activeId, onCite }: ReviewMarkdownProps) {
  const lines = review.split("\n")
  const blocks: ReactNode[] = []
  let listBuffer: { ordered: boolean; items: string[] } | null = null
  let key = 0

  const flushList = () => {
    if (!listBuffer) return
    const { ordered, items } = listBuffer
    const ListTag = ordered ? "ol" : "ul"
    blocks.push(
      <ListTag
        key={`list-${key++}`}
        className={
          ordered
            ? "my-5 list-decimal space-y-2.5 pl-6 text-gray-700 marker:font-medium marker:text-gray-400"
            : "my-5 list-disc space-y-2.5 pl-6 text-gray-700 marker:text-gray-400"
        }
      >
        {items.map((item, i) => (
          <li key={i} className="pl-1.5 leading-relaxed">
            {renderInline(item, `li-${key}-${i}`, papers, activeId, onCite)}
          </li>
        ))}
      </ListTag>,
    )
    listBuffer = null
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (line.trim() === "") {
      flushList()
      continue
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/)
    if (heading) {
      flushList()
      const text = heading[2]
      blocks.push(
        <h2
          key={`h-${key++}`}
          className="mt-10 mb-3 text-lg font-semibold tracking-tight text-gray-900 first:mt-0"
        >
          {renderInline(text, `h-${key}`, papers, activeId, onCite)}
        </h2>,
      )
      continue
    }

    const bullet = line.match(/^[-*]\s+(.*)$/)
    if (bullet) {
      if (!listBuffer || listBuffer.ordered) {
        flushList()
        listBuffer = { ordered: false, items: [] }
      }
      listBuffer.items.push(bullet[1])
      continue
    }

    const ordered = line.match(/^\d+\.\s+(.*)$/)
    if (ordered) {
      if (!listBuffer || !listBuffer.ordered) {
        flushList()
        listBuffer = { ordered: true, items: [] }
      }
      listBuffer.items.push(ordered[1])
      continue
    }

    flushList()
    blocks.push(
      <p key={`p-${key++}`} className="my-4 text-[0.975rem] leading-[1.8] text-gray-700">
        {renderInline(line, `p-${key}`, papers, activeId, onCite)}
      </p>,
    )
  }
  flushList()

  return <div className="[overflow-wrap:anywhere]">{blocks}</div>
}
