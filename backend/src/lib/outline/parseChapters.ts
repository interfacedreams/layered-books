import { google } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"
import { extractSegmentByChunks } from "../sources"

const chapterSchema = z.object({
  chapterTitle: z
    .string()
    .describe(
      "The title of the chapter as it appears in the text, or a descriptive title if none is explicitly given",
    ),
  startChunk: z.number().describe("The chunk number where this chapter starts"),
  endChunk: z.number().describe("The chunk number where this chapter ends"),
})

type ParsedChapter = z.infer<typeof chapterSchema>

export async function generateChapters(
  bookContent: string,
): Promise<ParsedChapter[]> {
  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      prompt: `Identify and extract all chapters from this book with complete coverage and no gaps, flowing one after the other.

The content includes chunk markers in the format {{ CHUNK X }}. Use these chunk numbers to define chapter boundaries.

Guidelines:
- Ignore any prologue, introduction, preface, or foreword sections
- Each chapter should span one or more complete chunks
- Use chunk numbers to define where each chapter starts and ends
- Ensure complete coverage - every chunk should belong to a chapter
- Chapter titles should be descriptive and based on the content if no explicit title is given
- Chapters should flow sequentially with no gaps or overlaps

Full book content: ${bookContent}`,
      schema: z.object({
        chapters: z.array(chapterSchema).min(1).max(300),
      }),
    })

    return object.chapters
  } catch (error) {
    return []
  }
}

export async function generateBookStructure(
  bookContent: string,
): Promise<{ title: string; content: string }[]> {
  const parsedChapters = await generateChapters(bookContent)

  const chapters = parsedChapters.map((chapter) => {
    try {
      const segment = extractSegmentByChunks(
        bookContent,
        chapter.startChunk,
        chapter.endChunk,
      )
      return {
        title: chapter.chapterTitle,
        content: segment,
      }
    } catch (error) {
      return {
        title: chapter.chapterTitle,
        content: "",
      }
    }
  })

  return chapters
}
