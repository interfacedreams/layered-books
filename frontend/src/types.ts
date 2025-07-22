// API Response Types for Frontend
export interface BookSummaries {
  l0Summary: string
  l1Summary: string
  l2Summary: string
}

export interface BookSummarizeResponse {
  id: string
  title: string
  author: string
  outline: BookOutline
  summaries: BookSummaries
}

export interface BookGetResponse {
  id: string
  title: string
  author: string
  outline: BookOutline
  summaries: BookSummaries
}

// Outline Structure Types
export interface BookChunk {
  index: number
  text: string
}

export interface BookOutline {
  id: string
  title: string
  author: string
  filename: string
  sessionId: string
  alwaysVisible: boolean
  chunks: BookChunk[]
  chapters: OutlineChapter[]
}

export interface OutlineChapter {
  id: string
  title: string
  description: string
  position: number
  textStartChunk: number
  textEndChunk: number
  keyPoints?: OutlineKeyPoint[]
}

export interface OutlineKeyPoint {
  id: string
  text: string
  position: number
  textStartChunk: number
  textEndChunk: number
  keyDetails?: OutlineDetail[]
}

export interface OutlineDetail {
  id: string
  text: string
  position: number
  textStartChunk: number
}

export interface ApiError {
  error: string
}
