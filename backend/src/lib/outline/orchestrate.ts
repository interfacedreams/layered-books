import type { Book, Chapter, Chunk, KeyDetail, KeyPoint } from "../db/schema"
import { extractSegmentByChunks } from "../sources"
import type { ChapterOutline, OutlineEntities } from "../types"
import { generateId } from "../utils"
import { generateChapterOutline, generateSectionSummary } from "./generate"

async function orchestrateChapterOutline(
  chapterContent: string,
  chapterTitle: string,
): Promise<ChapterOutline> {
  const { description, sections } = await generateChapterOutline(
    chapterContent,
    chapterTitle,
  )

  const sectionSummaries = await Promise.all(
    sections.map(async (section) => {
      try {
        const sectionContent = extractSegmentByChunks(
          chapterContent,
          section.startChunk,
          section.endChunk,
        )
        return await generateSectionSummary(
          sectionContent,
          chapterTitle,
          section.description,
        )
      } catch (error) {
        return []
      }
    }),
  )

  return {
    chapterTitle,
    description,
    sections,
    sectionSummaries,
  }
}

export async function orchestrateBookOutline(
  chapters: { title: string; content: string }[],
  bookTitle: string,
  bookAuthor: string,
  filename: string,
  sessionId: string,
  chunks: Chunk[],
): Promise<OutlineEntities> {
  const bookId = generateId()

  const book: Book = {
    id: bookId,
    title: bookTitle,
    author: bookAuthor,
    filename,
    sessionId,
    alwaysVisible: process.env.NODE_ENV === "development",
    chunks,
  }

  const chapterEntities: Chapter[] = []

  const allKeyPoints: KeyPoint[] = []
  const allKeyDetails: KeyDetail[] = []

  await Promise.all(
    chapters.map(async (chapter, chapterIndex) => {
      const outline = await orchestrateChapterOutline(
        chapter.content,
        chapter.title,
      )

      const chapterId = generateId()
      chapterEntities.push({
        id: chapterId,
        position: chapterIndex,
        title: chapter.title,
        description: outline.description,
        rawContent: chapter.content,
        bookId,
      })

      const chapterKeyPoints: KeyPoint[] = outline.sections.map(
        (section, index) => {
          let sectionText = ""
          try {
            sectionText = extractSegmentByChunks(
              chapter.content,
              section.startChunk,
              section.endChunk,
            )
          } catch (error) {}

          return {
            id: generateId(),
            position: index,
            pointText: section.description,
            sectionText,
            chapterId,
          }
        },
      )

      outline.sectionSummaries.forEach((summaries, keyPointIndex) => {
        const keyPointId = chapterKeyPoints[keyPointIndex]!.id

        summaries.forEach((content, detailIndex) => {
          allKeyDetails.push({
            id: generateId(),
            position: detailIndex,
            content,
            keyPointId,
          })
        })
      })

      allKeyPoints.push(...chapterKeyPoints)
    }),
  )

  return {
    book,
    chapters: chapterEntities,
    keyPoints: allKeyPoints,
    keyDetails: allKeyDetails,
  }
}
