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
export interface BookOutline {
  id: string
  title: string
  author: string
  chapters: OutlineChapter[]
}

export interface OutlineChapter {
  id: string
  title: string
  position: number
  rawContent: string
  bookId: string
  keyPoints: OutlineKeyPoint[]
}

export interface OutlineKeyPoint {
  id: string
  position: number
  pointText: string
  sectionText: string
  chapterId: string
  keyDetails: OutlineDetail[]
}

export interface OutlineDetail {
  id: string
  position: number
  content: string
  keyPointId: string
}

export interface ApiError {
  error: string
}
