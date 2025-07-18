import type {
  BookData,
  ChapterData,
  KeyPointData,
  KeyDetailData,
} from "../types"
import { supabase } from "../supabase"

function generateId(): string {
  // Generate a consistent 12-character alphanumeric string
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
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

  const { data, error } = await supabase
    .from("books")
    .insert(bookWithId)
    .select("id")
    .single()

  if (error) throw error
  return data.id
}

export async function saveChapters(
  chapters: ChapterData[],
  bookId: string,
): Promise<string[]> {
  const chaptersToInsert = chapters.map((chapter) => ({
    id: generateId(),
    chapter_index: chapter.chapterIndex,
    title: chapter.title,
    raw_content: chapter.rawContent,
    book_id: bookId,
  }))

  const { data, error } = await supabase
    .from("chapters")
    .insert(chaptersToInsert)
    .select("id")

  if (error) throw error
  return data.map((row) => row.id)
}

export async function saveKeyPoints(
  keyPoints: KeyPointData[],
  chapterId: string,
): Promise<string[]> {
  const keyPointsToInsert = keyPoints.map((keyPoint) => ({
    id: generateId(),
    order_index: keyPoint.orderIndex,
    point_text: keyPoint.pointText,
    section_object: keyPoint.sectionObject,
    chapter_id: chapterId,
  }))

  const { data, error } = await supabase
    .from("key_points")
    .insert(keyPointsToInsert)
    .select("id")

  if (error) throw error
  return data.map((row) => row.id)
}

export async function saveKeyDetails(
  keyDetails: KeyDetailData[],
  keyPointId: string,
): Promise<void> {
  const keyDetailsToInsert = keyDetails.map((keyDetail) => ({
    id: generateId(),
    order_index: keyDetail.orderIndex,
    content: keyDetail.content,
    key_point_id: keyPointId,
  }))

  const { error } = await supabase
    .from("key_details")
    .insert(keyDetailsToInsert)

  if (error) throw error
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
