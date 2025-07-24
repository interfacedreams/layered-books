import type { Book, Chapter, Chunk, KeyDetail, KeyPoint } from "./db/schema"

// Source extraction type
export interface BookStructure {
  author: string
  title: string
  chunks: Chunk[]
}

export interface ChapterWithChunks {
  title: string
  text: string
  startChunk: number
  endChunk: number
  keyPoint: string
}

export interface OutlineEntities {
  book: Book
  chapters: Chapter[]
  keyPoints: KeyPoint[]
  keyDetails: KeyDetail[]
}
// Intermediate types (between generation and API response)
export interface SemanticSection {
  startChunk: number
  endChunk: number
  keyPoint: string
  details: { text: string; startChunk: number }[]
}
export interface ChapterOutline extends ChapterWithChunks {
  keyPoint: string
  sections: SemanticSection[]
}

// API response types for structured outline
export interface OutlineDetail extends KeyDetail {
  text: string
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
  text: string
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
