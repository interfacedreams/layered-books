import type { Book, Chapter, KeyDetail, KeyPoint } from "../db/schema"
import type { ChapterOutline, OutlineEntities } from "../types"
import { generateId } from "../utils"
import { generateChapterOutline, generateSectionSummary } from "./generate"
import { extractSegment } from "./segment"

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
        const sectionContent = extractSegment(
          chapterContent,
          section.startSentences,
          section.endSentences,
        )
        return await generateSectionSummary(
          sectionContent,
          chapterTitle,
          section.description,
        )
      } catch (error) {
        console.error(
          `Failed to extract/summarize section "${section.description}" from "${chapterTitle}":`,
          error,
        )
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
): Promise<OutlineEntities> {
  const bookId = generateId()

  const book: Book = {
    id: bookId,
    title: bookTitle,
    author: bookAuthor,
    filename,
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
            sectionText = extractSegment(
              chapter.content,
              section.startSentences,
              section.endSentences,
            )
          } catch (error) {
            console.error(
              `Failed to extract section text for "${section.description}":`,
              error,
            )
          }

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
