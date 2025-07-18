import { db, type DbConnection } from "../db"
import { books, chapters, keyDetails, keyPoints } from "../db/schema"
import type {
  BookData,
  ChapterData,
  KeyDetailData,
  KeyPointData,
} from "../types"

function generateId(): string {
  // Generate a random 12-character string
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function saveBook(
  book: BookData,
  tx: DbConnection = db,
): Promise<string> {
  const bookWithId = {
    id: generateId(),
    ...book,
  }

  const result = await tx
    .insert(books)
    .values(bookWithId)
    .returning({ id: books.id })
  return result[0]!.id
}

export async function saveChapters(
  chaptersData: ChapterData[],
  bookId: string,
  tx: DbConnection = db,
): Promise<string[]> {
  const chaptersToInsert = chaptersData.map((chapter) => ({
    id: generateId(),
    position: chapter.position,
    title: chapter.title,
    rawContent: chapter.rawContent,
    bookId: bookId,
  }))

  const result = await tx
    .insert(chapters)
    .values(chaptersToInsert)
    .returning({ id: chapters.id })
  return result.map((row) => row.id)
}

export async function saveKeyPoints(
  keyPointsData: KeyPointData[],
  chapterId: string,
  tx: DbConnection = db,
): Promise<string[]> {
  if (keyPointsData.length === 0) {
    return []
  }

  const keyPointsToInsert = keyPointsData.map((keyPoint) => ({
    id: generateId(),
    position: keyPoint.position,
    pointText: keyPoint.pointText,
    sectionText: keyPoint.sectionText,
    chapterId: chapterId,
  }))

  const result = await tx
    .insert(keyPoints)
    .values(keyPointsToInsert)
    .returning({ id: keyPoints.id })
  return result.map((row) => row.id)
}

export async function saveKeyDetails(
  keyDetailsData: KeyDetailData[],
  keyPointId: string,
  tx: DbConnection = db,
): Promise<void> {
  if (keyDetailsData.length === 0) {
    return
  }

  const keyDetailsToInsert = keyDetailsData.map((keyDetail) => ({
    id: generateId(),
    position: keyDetail.position,
    content: keyDetail.content,
    keyPointId: keyPointId,
  }))

  await tx.insert(keyDetails).values(keyDetailsToInsert)
}

export async function saveOutlineEntities(
  book: BookData,
  chapters: ChapterData[],
  keyPoints: KeyPointData[][],
  keyDetails: KeyDetailData[][][],
): Promise<string> {
  return await db.transaction(async (tx) => {
    const bookId = await saveBook(book, tx)

    const chapterIds = await saveChapters(chapters, bookId, tx)
    for (let index = 0; index < chapters.length; index++) {
      const chapterId = chapterIds[index] as string

      const chapterKeyPoints = keyPoints[index] ?? []
      const chapterKeyDetails = keyDetails[index] ?? []

      const keyPointIds = await saveKeyPoints(chapterKeyPoints, chapterId, tx)

      for (let pointIndex = 0; pointIndex < keyPointIds.length; pointIndex++) {
        const keyPointId = keyPointIds[pointIndex] as string

        const pointKeyDetails = chapterKeyDetails[pointIndex] ?? []

        if (pointKeyDetails.length > 0) {
          await saveKeyDetails(pointKeyDetails, keyPointId, tx)
        }
      }
    }

    return bookId
  })
}
