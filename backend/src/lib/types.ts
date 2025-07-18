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
  chapterIndex: number
  title: string
  rawContent: string
}

export interface KeyPointData {
  orderIndex: number
  pointText: string
  sectionObject: {
    title?: string
    startSentences: string
    endSentences: string
  }
}

export interface KeyDetailData {
  orderIndex: number
  content: string
}

// Generation-specific types
export interface BookStructure {
  author: string
  title: string
  chapterTitles: string[]
  chapterContents: string[]
}

export interface SemanticSection {
  title: string
  description: string
  startSentences: string
  endSentences: string
}

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
  orderIndex: number
}

export interface OutlineSection {
  id: string
  title: string
  description: string
  startSentences: string
  endSentences: string
  orderIndex: number
  details: OutlineDetail[]
}

export interface OutlineChapter {
  id: string
  title: string
  chapterIndex: number
  sections: OutlineSection[]
}

export interface BookOutline {
  id: string
  title: string
  author: string
  filename: string
  chapters: OutlineChapter[]
}
