import { db } from "../db"
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

export async function saveBook(book: BookData): Promise<string> {
  const bookWithId = {
    id: generateId(),
    ...book,
  }

  const result = await db
    .insert(books)
    .values(bookWithId)
    .returning({ id: books.id })
  return result[0]!.id
}

export async function saveChapters(
  chaptersData: ChapterData[],
  bookId: string,
): Promise<string[]> {
  const chaptersToInsert = chaptersData.map((chapter) => ({
    id: generateId(),
    position: chapter.position,
    title: chapter.title,
    rawContent: chapter.rawContent,
    bookId: bookId,
  }))

  const result = await db
    .insert(chapters)
    .values(chaptersToInsert)
    .returning({ id: chapters.id })
  return result.map((row) => row.id)
}

export async function saveKeyPoints(
  keyPointsData: KeyPointData[],
  chapterId: string,
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

  const result = await db
    .insert(keyPoints)
    .values(keyPointsToInsert)
    .returning({ id: keyPoints.id })
  return result.map((row) => row.id)
}

export async function saveKeyDetails(
  keyDetailsData: KeyDetailData[],
  keyPointId: string,
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

  await db.insert(keyDetails).values(keyDetailsToInsert)
}

export async function saveOutlineEntities(
  book: BookData,
  chapters: ChapterData[],
  keyPoints: KeyPointData[][],
  keyDetails: KeyDetailData[][][],
): Promise<string> {
  const bookId = await saveBook(book)

  const chapterIds = await saveChapters(chapters, bookId)
  for (let index = 0; index < chapters.length; index++) {
    const chapterId = chapterIds[index] as string

    const chapterKeyPoints = keyPoints[index] ?? []
    const chapterKeyDetails = keyDetails[index] ?? []

    const keyPointIds = await saveKeyPoints(chapterKeyPoints, chapterId)

    for (let pointIndex = 0; pointIndex < keyPointIds.length; pointIndex++) {
      const keyPointId = keyPointIds[pointIndex] as string

      const pointKeyDetails = chapterKeyDetails[pointIndex] ?? []

      if (pointKeyDetails.length > 0) {
        await saveKeyDetails(pointKeyDetails, keyPointId)
      }
    }
  }

  return bookId
}
