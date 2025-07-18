import type { SemanticSection } from "./outline/generateOutline"

// Source extraction type
export interface BookStructure {
  author: string
  title: string
  chapterTitles: string[]
  chapterContents: string[]
}

// Data types (without IDs)
export interface BookData {
  title: string
  author: string
  filename: string
}

export interface ChapterData {
  position: number
  title: string
  rawContent: string
}

export interface KeyPointData {
  position: number
  pointText: string
  sectionText: string
}

export interface KeyDetailData {
  position: number
  content: string
}

// Generation-specific types
export interface ChapterOutline {
  chapterTitle: string
  sections: SemanticSection[]
  sectionSummaries: string[][]
}

export interface OutlineEntities {
  book: BookData
  chapters: ChapterData[]
  keyPoints: KeyPointData[][]
  keyDetails: KeyDetailData[][][]
}

// API response types for structured outline
export interface OutlineDetail {
  id: string
  content: string
  position: number
}

export interface OutlineSection {
  id: string
  pointText: string
  sectionText: string
  position: number
  details: OutlineDetail[]
}

export interface OutlineChapter {
  id: string
  title: string
  position: number
  sections: OutlineSection[]
}

export interface BookOutline {
  id: string
  title: string
  author: string
  filename: string
  chapters: OutlineChapter[]
}
