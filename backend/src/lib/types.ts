import type { Book, Chapter, Chunk, KeyDetail, KeyPoint } from "./db/schema"

// Source extraction type
export interface BookStructure {
  author: string
  title: string
  chunks: Chunk[]
}

// Generation-specific types

export interface SemanticSection {
  startChunk: number
  endChunk: number
  description: string
}

export interface ChapterOutline {
  // TODO: rename this to title
  chapterTitle: string
  description: string
  sections: SemanticSection[]
  sectionSummaries: string[][]
}

export interface OutlineEntities {
  book: Book
  chapters: Chapter[]
  keyPoints: KeyPoint[]
  keyDetails: KeyDetail[]
}

// API response types for structured outline
export interface OutlineDetail extends KeyDetail {
  content: string
}

export interface OutlineKeyPoint extends KeyPoint {
  keyDetails: OutlineDetail[]
}

export interface OutlineChapter extends Chapter {
  keyPoints: OutlineKeyPoint[]
}

export interface BookOutline extends Book {
  chapters: OutlineChapter[]
}

// Partial outline types for different abstraction levels
export interface PartialOutlineDetail extends KeyDetail {
  content: string
}

export interface PartialOutlineKeyPoint extends KeyPoint {
  keyDetails?: PartialOutlineDetail[]
}

export interface PartialOutlineChapter extends Chapter {
  keyPoints?: PartialOutlineKeyPoint[]
}

export interface PartialBookOutline extends Book {
  chapters: PartialOutlineChapter[]
}
