import type { Book, Chapter, KeyDetail, KeyPoint } from "./db/schema"
import type { SemanticSection } from "./outline"

// Source extraction type
export interface BookStructure {
  author: string
  title: string
  chapterTitles: string[]
  chapterContents: string[]
}

// Generation-specific types
export interface ChapterOutline {
  chapterTitle: string
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
