import { eq } from "drizzle-orm"
import { db } from "../db"
import {
  booksTable,
  chaptersTable,
  keyDetailsTable,
  keyPointsTable,
} from "../db/schema"
import type { BookOutline, OutlineChapter, OutlineKeyPoint } from "../types"

export async function getOutline(bookId: string): Promise<BookOutline | null> {
  const book = await db
    .select()
    .from(booksTable)
    .where(eq(booksTable.id, bookId))
    .limit(1)
  if (book.length === 0) return null

  const chapters = await db
    .select()
    .from(chaptersTable)
    .where(eq(chaptersTable.bookId, bookId))
    .orderBy(chaptersTable.position)

  const chaptersWithSections: OutlineChapter[] = await Promise.all(
    chapters.map(async (chapter) => {
      const keyPoints = await db
        .select()
        .from(keyPointsTable)
        .where(eq(keyPointsTable.chapterId, chapter.id))
        .orderBy(keyPointsTable.position)

      const keyPointsWithDetails: OutlineKeyPoint[] = await Promise.all(
        keyPoints.map(async (keyPoint) => {
          const keyDetails = await db
            .select()
            .from(keyDetailsTable)
            .where(eq(keyDetailsTable.keyPointId, keyPoint.id))
            .orderBy(keyDetailsTable.position)

          return {
            ...keyPoint,
            keyDetails,
          }
        }),
      )

      return {
        ...chapter,
        keyPoints: keyPointsWithDetails,
      }
    }),
  )

  const bookData = book[0]
  if (!bookData) return null

  return {
    ...bookData,
    chapters: chaptersWithSections,
  }
}
