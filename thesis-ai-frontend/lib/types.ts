export interface PaperSource {
  paperId?: string
  title: string
  authors: string[]
  year: number | null
  citationCount?: number | null
  venue?: string
  field?: string
  summary: string
  url?: string
  source?: string
}

export interface LuxcieResearchResponse {
  review: string
  papers: PaperSource[]
  fallbackMessage?: string | null
  isGuest?: boolean
  totalResults?: number
  page?: number
  limit?: number
  totalPages?: number
  sourceBreakdown?: Record<string, number>
}
