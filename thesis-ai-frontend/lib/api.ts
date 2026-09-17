import type { LuxieResearchResponse, PaperSource } from "./types"

const RESEARCH_URL = "http://127.0.0.1:8000/api/research"

export class ResearchApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ResearchApiError"
  }
}

interface BackendPaper {
  paper_id?: string | null
  title?: string
  authors?: string[]
  summary?: string
  year?: number | null
  url?: string | null
  citation_count?: number | null
}

interface BackendResearchResponse {
  review?: string
  papers?: BackendPaper[]
  fallback_message?: string | null
}

function errorMessageFromBody(body: unknown, status: number): string {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail
    if (typeof detail === "string" && detail.trim()) return detail
    if (Array.isArray(detail)) {
      const first = detail[0]
      if (first && typeof first === "object" && "msg" in first) {
        return String((first as { msg: unknown }).msg)
      }
    }
  }
  return `Research request failed (${status})`
}

export function mapPaper(paper: BackendPaper): PaperSource {
  return {
    title: paper.title?.trim() || "Untitled paper",
    authors: Array.isArray(paper.authors) ? paper.authors.filter(Boolean) : [],
    year: paper.year ?? null,
    summary: paper.summary?.trim() || "No abstract available.",
    url: paper.url ?? undefined,
  }
}

export function mapResearchResponse(payload: BackendResearchResponse): LuxieResearchResponse {
  return {
    review: payload.review ?? "",
    papers: (payload.papers ?? []).map(mapPaper),
    fallbackMessage: payload.fallback_message ?? null,
  }
}

export async function fetchResearch(
  query: string,
  filters: { limit: number; startYear: number | null; endYear: number | null; sortRecent: boolean } = {
    limit: 8,
    startYear: null,
    endYear: null,
    sortRecent: false,
  },
  signal?: AbortSignal,
): Promise<LuxieResearchResponse> {
  let response: Response
  try {
    response = await fetch(RESEARCH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        limit: filters.limit,
        start_year: filters.startYear,
        end_year: filters.endYear,
        sort_by_recent: filters.sortRecent,
      }),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error
    throw new ResearchApiError("Unable to reach the research API. Is the backend running?")
  }

  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ResearchApiError(errorMessageFromBody(body, response.status))
  }

  return mapResearchResponse((body ?? {}) as BackendResearchResponse)
}
