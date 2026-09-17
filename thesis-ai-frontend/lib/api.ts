import type { LuxcieResearchResponse, PaperSource } from "./types"

const RESEARCH_URL = "http://127.0.0.1:8000/api/research"

export class ResearchApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ResearchApiError"
    this.status = status
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

interface ResearchStreamEvent {
  type?: "papers" | "text" | "done" | "error"
  papers?: BackendPaper[]
  fallback_message?: string | null
  is_guest?: boolean
  text?: string
  message?: string
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

export function mapResearchResponse(payload: BackendResearchResponse): LuxcieResearchResponse {
  return {
    review: payload.review ?? "",
    papers: (payload.papers ?? []).map(mapPaper),
    fallbackMessage: payload.fallback_message ?? null,
    isGuest: payload.is_guest ?? false,
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
  token?: string | null,
): Promise<LuxcieResearchResponse> {
  let response: Response
  try {
    response = await fetch(RESEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
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
    throw new ResearchApiError("Unable to reach the research API. Is the backend running?", 0)
  }

  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ResearchApiError(errorMessageFromBody(body, response.status), response.status)
  }

  return mapResearchResponse((body ?? {}) as BackendResearchResponse)
}

export async function streamResearch(
  query: string,
  filters: { limit: number; startYear: number | null; endYear: number | null; sortRecent: boolean },
  callbacks: {
    onPapers: (response: LuxcieResearchResponse) => void
    onText: (text: string) => void
  },
  signal?: AbortSignal,
  token?: string | null,
): Promise<void> {
  let response: Response
  try {
    response = await fetch(RESEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
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
    throw new ResearchApiError("Unable to reach the research API. Is the backend running?", 0)
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null)
    throw new ResearchApiError(errorMessageFromBody(body, response.status), response.status)
  }
  if (!response.body) throw new ResearchApiError("Research stream is unavailable", 0)

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  const handleEvent = (rawEvent: string) => {
    const dataLine = rawEvent.split("\n").find((line) => line.startsWith("data: "))
    if (!dataLine) return
    const event = JSON.parse(dataLine.slice(6)) as ResearchStreamEvent
    if (event.type === "papers") {
      callbacks.onPapers(mapResearchResponse(event))
    } else if (event.type === "text" && event.text) {
      callbacks.onText(event.text)
    } else if (event.type === "error") {
      throw new ResearchApiError(event.message ?? "Research generation failed", 502)
    }
  }

  while (true) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done })
    const events = buffer.split("\n\n")
    buffer = events.pop() ?? ""
    for (const event of events) handleEvent(event)
    if (done) break
  }
  if (buffer.trim()) handleEvent(buffer)
}
