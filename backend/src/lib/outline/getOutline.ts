import type {
  BookOutline,
  OutlineChapter,
  OutlineSection,
  OutlineDetail,
} from "../types"
import { supabase } from "../supabase"

export async function getOutline(bookId: string): Promise<BookOutline | null> {
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .single()

  if (bookError || !book) return null

  const { data: chapters, error: chaptersError } = await supabase
    .from("chapters")
    .select("*")
    .eq("book_id", bookId)
    .order("chapter_index")

  if (chaptersError) return null

  const outlineChapters: OutlineChapter[] = await Promise.all(
    chapters.map(async (chapter) => {
      const { data: keyPoints, error: keyPointsError } = await supabase
        .from("key_points")
        .select("*")
        .eq("chapter_id", chapter.id)
        .order("order_index")

      if (keyPointsError) throw keyPointsError

      const sections: OutlineSection[] = await Promise.all(
        keyPoints.map(async (keyPoint) => {
          const { data: keyDetails, error: keyDetailsError } = await supabase
            .from("key_details")
            .select("*")
            .eq("key_point_id", keyPoint.id)
            .order("order_index")

          if (keyDetailsError) throw keyDetailsError

          const details: OutlineDetail[] = keyDetails.map((detail) => ({
            id: detail.id,
            content: detail.content,
            orderIndex: detail.order_index,
          }))

          return {
            id: keyPoint.id,
            title: keyPoint.section_object.title,
            description: keyPoint.point_text,
            startSentences: keyPoint.section_object.startSentences,
            endSentences: keyPoint.section_object.endSentences,
            orderIndex: keyPoint.order_index,
            details,
          }
        }),
      )

      return {
        id: chapter.id,
        title: chapter.title,
        chapterIndex: chapter.chapter_index,
        sections,
      }
    }),
  )

  return {
    id: book.id,
    title: book.title,
    author: book.author,
    filename: book.filename,
    chapters: outlineChapters,
  }
}
