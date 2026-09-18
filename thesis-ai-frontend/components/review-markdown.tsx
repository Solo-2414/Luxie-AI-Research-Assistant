"use client"

import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import type { PaperSource } from "@/lib/types"
import { findPaperIndexForCitation, paperId } from "@/lib/citations"
import { CitationBadge } from "./citation-badge"

interface ReviewMarkdownProps {
  review: string
  papers: PaperSource[]
  activeId: string | null
  onCite: (id: string) => void
}

function renderText(text: string, keyPrefix: string, papers: PaperSource[], activeId: string | null, onCite: (id: string) => void): ReactNode[] {
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
    return part
  })
}

function renderChildren(children: ReactNode, keyPrefix: string, papers: PaperSource[], activeId: string | null, onCite: (id: string) => void): ReactNode {
  return Children.map(children, (child, index) => {
    if (typeof child === "string") return renderText(child, `${keyPrefix}-${index}`, papers, activeId, onCite)
    if (!isValidElement(child)) return child
    const element = child as ReactElement<{ children?: ReactNode }>
    return cloneElement(element, {
      children: renderChildren(element.props.children, `${keyPrefix}-${index}`, papers, activeId, onCite),
    })
  })
}

function createComponents(papers: PaperSource[], activeId: string | null, onCite: (id: string) => void): Components {
  const children = (content: ReactNode, key: string) => renderChildren(content, key, papers, activeId, onCite)
  return {
    h1: ({ children: content }) => <h1 className="mt-10 mb-3 text-2xl font-semibold tracking-tight text-gray-900 first:mt-0">{children(content, "h1")}</h1>,
    h2: ({ children: content }) => <h2 className="mt-10 mb-3 text-xl font-semibold tracking-tight text-gray-900 first:mt-0">{children(content, "h2")}</h2>,
    h3: ({ children: content }) => <h3 className="mt-8 mb-2 text-lg font-semibold tracking-tight text-gray-900">{children(content, "h3")}</h3>,
    h4: ({ children: content }) => <h4 className="mt-6 mb-2 text-base font-semibold tracking-tight text-gray-900">{children(content, "h4")}</h4>,
    p: ({ children: content }) => <p className="my-4 text-[0.975rem] leading-[1.8] text-gray-700">{children(content, "p")}</p>,
    ul: ({ children: content }) => <ul className="my-5 list-disc space-y-2.5 pl-6 text-gray-700 marker:text-gray-400">{children(content, "ul")}</ul>,
    ol: ({ children: content }) => <ol className="my-5 list-decimal space-y-2.5 pl-6 text-gray-700 marker:font-medium marker:text-gray-400">{children(content, "ol")}</ol>,
    li: ({ children: content }) => <li className="pl-1.5 leading-relaxed">{children(content, "li")}</li>,
    a: ({ children: content, href }) => <a href={href} className="text-blue-700 underline decoration-blue-200 underline-offset-2 hover:decoration-blue-500">{children(content, "a")}</a>,
  }
}

export function ReviewMarkdown({ review, papers, activeId, onCite }: ReviewMarkdownProps) {
  return (
    <div className="[overflow-wrap:anywhere]">
      <ReactMarkdown components={createComponents(papers, activeId, onCite)}>{review}</ReactMarkdown>
    </div>
  )
}
