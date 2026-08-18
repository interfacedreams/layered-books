import type { Book, Chapter, Chunk, KeyDetail, KeyPoint } from "../db/schema"
import { extractSegmentByChunks } from "../sources"
import type {
  ChapterOutline,
  ChapterWithChunks,
  OutlineEntities,
} from "../types"
import { generateId } from "../utils"
import { generateChapterOutline, generateSectionDetails } from "./generate"
import type { ModelChoice } from "./models"
import { generateChapters } from "./parseChapters"

export async function orchestrateChapters(
  bookText: string,
  apiKey?: string,
  model?: ModelChoice,
): Promise<ChapterWithChunks[]> {
  const parsedChapters = await generateChapters(bookText, apiKey, model)

  const chapters = parsedChapters.chapters.map((chapter) => {
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
        keyPoint: chapter.keyPoint,
      }
    } catch (error) {
      return {
        title: chapter.chapterTitle,
        text: "",
        startChunk: chapter.startChunk,
        endChunk: chapter.endChunk,
        keyPoint: chapter.keyPoint,
      }
    }
  })

  return chapters
}

async function orchestrateChapterOutline(
  chapter: ChapterWithChunks,
  apiKey?: string,
  model?: ModelChoice,
): Promise<ChapterOutline> {
  const { sections } = await generateChapterOutline(
    chapter.text,
    chapter.title,
    chapter.keyPoint,
    apiKey,
    model,
  )

  const sectionsWithDetails = await Promise.all(
    sections.map(async (section) => {
      const sectionText = extractSegmentByChunks(
        chapter.text,
        section.startChunk,
        section.endChunk,
      )
      const sectionDetails = await generateSectionDetails(
        sectionText,
        chapter.title,
        section.keyPoint,
        section.startChunk,
        section.endChunk,
        apiKey,
        model,
      )
      return {
        ...section,
        details: sectionDetails.details,
      }
    }),
  )

  return {
    ...chapter,
    keyPoint: chapter.keyPoint,
    sections: sectionsWithDetails,
  }
}

export async function orchestrateBookOutline(
  chapters: ChapterWithChunks[],
  bookTitle: string,
  bookAuthor: string,
  filename: string,
  sessionId: string,
  chunks: Chunk[],
  apiKey?: string,
  model?: ModelChoice,
): Promise<OutlineEntities> {
  const bookId = generateId()
  console.log(`🤖 Generate book outline for "${bookTitle}"`)

  const book: Book = {
    id: bookId,
    title: bookTitle,
    author: bookAuthor,
    filename,
    sessionId,
    visibility:
      process.env.NODE_ENV === "development"
        ? "fully_public"
        : "summary_public",
    chunks,
  }

  const chapterEntities: Chapter[] = []

  const allKeyPoints: KeyPoint[] = []
  const allKeyDetails: KeyDetail[] = []

  await Promise.all(
    chapters.map(async (chapter, chapterIndex) => {
      const outline = await orchestrateChapterOutline(chapter, apiKey, model)

      const chapterId = generateId()
      chapterEntities.push({
        id: chapterId,
        position: chapterIndex,
        title: chapter.title,
        description: outline.keyPoint,
        textStartChunk: chapter.startChunk,
        textEndChunk: chapter.endChunk,
        bookId,
      })

      const chapterKeyPoints: KeyPoint[] = outline.sections.map(
        (section, index) => ({
          id: generateId(),
          position: index,
          text: section.keyPoint,
          textStartChunk: section.startChunk,
          textEndChunk: section.endChunk,
          chapterId,
        }),
      )
      allKeyPoints.push(...chapterKeyPoints)

      const keyDetails = outline.sections.flatMap((section, sectionIndex) => {
        const keyPointId = chapterKeyPoints[sectionIndex]!.id
        return section.details.map((detail, detailIndex) => {
          return {
            id: generateId(),
            position: detailIndex,
            text: detail.text,
            textStartChunk: detail.startChunk,
            keyPointId,
          }
        })
      })
      allKeyDetails.push(...keyDetails)
    }),
  )

  return {
    book,
    chapters: chapterEntities,
    keyPoints: allKeyPoints,
    keyDetails: allKeyDetails,
  }
}
