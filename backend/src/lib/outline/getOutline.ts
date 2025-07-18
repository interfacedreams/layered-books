import { eq } from "drizzle-orm"
import { db } from "../db"
import { books, chapters, keyDetails, keyPoints } from "../db/schema"
import type {
  BookOutline,
  OutlineChapter,
  OutlineDetail,
  OutlineSection,
} from "../types"

export async function getOutline(bookId: string): Promise<BookOutline | null> {
  const book = await db
    .select()
    .from(books)
    .where(eq(books.id, bookId))
    .limit(1)
  if (book.length === 0) return null

  const chaptersData = await db
    .select()
    .from(chapters)
    .where(eq(chapters.bookId, bookId))
    .orderBy(chapters.position)

  const outlineChapters: OutlineChapter[] = await Promise.all(
    chaptersData.map(async (chapter) => {
      const keyPointsData = await db
        .select()
        .from(keyPoints)
        .where(eq(keyPoints.chapterId, chapter.id))
        .orderBy(keyPoints.position)

      const sections: OutlineSection[] = await Promise.all(
        keyPointsData.map(async (keyPoint) => {
          const keyDetailsData = await db
            .select()
            .from(keyDetails)
            .where(eq(keyDetails.keyPointId, keyPoint.id))
            .orderBy(keyDetails.position)

          const details: OutlineDetail[] = keyDetailsData.map((detail) => ({
            id: detail.id,
            content: detail.content,
            position: detail.position,
          }))

          return {
            id: keyPoint.id,
            pointText: keyPoint.pointText,
            sectionText: keyPoint.sectionText,
            position: keyPoint.position,
            details,
          }
        }),
      )

      return {
        id: chapter.id,
        title: chapter.title,
        position: chapter.position,
        sections,
      }
    }),
  )

  const bookData = book[0]
  if (!bookData) return null

  return {
    id: bookData.id,
    title: bookData.title,
    author: bookData.author,
    filename: bookData.filename,
    chapters: outlineChapters,
  }
}
