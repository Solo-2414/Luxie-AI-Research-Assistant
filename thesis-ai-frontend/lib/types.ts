export interface PaperSource {
  title: string
  authors: string[]
  year: number | null
  field?: string
  summary: string
  url?: string
}

export interface LuxcieResearchResponse {
  review: string
  papers: PaperSource[]
  fallbackMessage?: string | null
  isGuest?: boolean
}
