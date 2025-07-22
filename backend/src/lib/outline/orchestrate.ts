import type { Book, Chapter, Chunk, KeyDetail, KeyPoint } from "../db/schema"
import { extractSegmentByChunks } from "../sources"
import type {
  ChapterOutline,
  ChapterWithChunks,
  OutlineEntities,
} from "../types"
import { generateId } from "../utils"
import { generateChapterOutline, generateSectionDetails } from "./generate"
import { generateChapters } from "./parseChapters"

export async function orchestrateChapters(
  bookText: string,
): Promise<ChapterWithChunks[]> {
  const parsedChapters = await generateChapters(bookText)

  const chapters = parsedChapters.map((chapter) => {
    try {
      const segment = extractSegmentByChunks(
        bookText,
        chapter.startChunk,
        chapter.endChunk,
      )
      return {
        title: chapter.chapterTitle,
        text: segment,
        startChunk: chapter.startChunk,
        endChunk: chapter.endChunk,
      }
    } catch (error) {
      return {
        title: chapter.chapterTitle,
        text: "",
        startChunk: chapter.startChunk,
        endChunk: chapter.endChunk,
      }
    }
  })

  return chapters
}

async function orchestrateChapterOutline(
  chapter: ChapterWithChunks,
): Promise<ChapterOutline> {
  const { description, sections } = await generateChapterOutline(
    chapter.text,
    chapter.title,
  )

  const sectionDetails = await Promise.all(
    sections.map(async (section) => {
      try {
        const sectionText = extractSegmentByChunks(
          chapter.text,
          section.startChunk,
          section.endChunk,
        )
        return await generateSectionDetails(
          sectionText,
          chapter.title,
          section.description,
          section.startChunk,
          section.endChunk,
        )
      } catch (error) {
        return []
      }
    }),
  )

  return {
    ...chapter,
    description,
    sections,
    sectionDetails,
  }
}

export async function orchestrateBookOutline(
  chapters: ChapterWithChunks[],
  bookTitle: string,
  bookAuthor: string,
  filename: string,
  sessionId: string,
  chunks: Chunk[],
): Promise<OutlineEntities> {
  const bookId = generateId()
  console.log(`🤖 Generate book outline for "${bookTitle}"`)

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
      const outline = await orchestrateChapterOutline(chapter)

      const chapterId = generateId()
      chapterEntities.push({
        id: chapterId,
        position: chapterIndex,
        title: chapter.title,
        description: outline.description,
        textStartChunk: chapter.startChunk,
        textEndChunk: chapter.endChunk,
        bookId,
      })

      const chapterKeyPoints: KeyPoint[] = outline.sections.map(
        (section, index) => ({
          id: generateId(),
          position: index,
          text: section.description,
          textStartChunk: section.startChunk,
          textEndChunk: section.endChunk,
          chapterId,
        }),
      )

      outline.sectionDetails.forEach((details, keyPointIndex) => {
        const keyPointId = chapterKeyPoints[keyPointIndex]!.id

        details.forEach((detail, detailIndex) => {
          allKeyDetails.push({
            id: generateId(),
            position: detailIndex,
            text: detail.text,
            textStartChunk: detail.startChunk,
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
