import type { PaperSource } from "./types"

export function paperId(index: number): string {
  return `paper-${index}`
}

/** Extract the last name from an author string like "J. Smith" -> "Smith". */
export function lastName(author: string): string {
  const parts = author.trim().split(/\s+/)
  return parts[parts.length - 1] ?? author
}

/** Format the author list: top 3, comma separated, "et al." when longer. */
export function formatAuthors(authors: string[]): string {
  if (authors.length === 0) return "Unknown authors"
  if (authors.length <= 3) return authors.join(", ")
  return `${authors.slice(0, 3).join(", ")}, et al.`
}

/**
 * Match an in-text citation such as "Smith et al., 2023" or "Johnson & Lee, 2024"
 * to a paper by comparing the first author's last name and the publication year.
 * Returns the paper index, or -1 when no confident match is found.
 */
export function findPaperIndexForCitation(citation: string, papers: PaperSource[]): number {
  const numbered = citation.trim().match(/^(\d+)$/)
  if (numbered) {
    const index = Number(numbered[1]) - 1
    return index >= 0 && index < papers.length ? index : -1
  }

  const yearMatch = citation.match(/\b(19|20)\d{2}\b/)
  const year = yearMatch ? Number(yearMatch[0]) : null

  return papers.findIndex((paper) => {
    if (year !== null && paper.year !== year) return false
    const firstAuthorLast = lastName(paper.authors[0] ?? "").toLowerCase()
    if (!firstAuthorLast) return false
    return citation.toLowerCase().includes(firstAuthorLast)
  })
}

/** Count how many times each paper is referenced across the review text. */
export function countReferences(review: string, papers: PaperSource[]): number[] {
  const counts = new Array(papers.length).fill(0)
  const citationRegex = /\[([^\]]+)\]/g
  let match: RegExpExecArray | null
  while ((match = citationRegex.exec(review)) !== null) {
    const index = findPaperIndexForCitation(match[1], papers)
    if (index >= 0) counts[index] += 1
  }
  return counts
}
