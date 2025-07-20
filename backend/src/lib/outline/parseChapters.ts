import { google } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"
import { extractSegment } from "./segment"

const chapterSchema = z.object({
  chapterTitle: z
    .string()
    .describe(
      "The title of the chapter as it appears in the text, or a descriptive title if none is explicitly given",
    ),
  startSentences: z
    .string()
    .describe(
      "VERBATIM copy of first 1-3 sentences of the chapter - CHARACTER-FOR-CHARACTER identical including ALL punctuation, spaces, tabs, quotes",
    ),
  endSentences: z
    .string()
    .describe(
      "VERBATIM copy of last 1-3 sentences of the chapter - CHARACTER-FOR-CHARACTER identical including ALL punctuation, spaces, tabs, quotes",
    ),
})

type ParsedChapter = z.infer<typeof chapterSchema>

export async function generateChapters(
  bookContent: string,
): Promise<ParsedChapter[]> {
  try {
    console.log("🤖 LLM: Generating chapters from book content")
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      prompt: `Identify and extract all chapters from this book with complete coverage and no gaps, flowing one after the other.

Guidelines:
- Ignore any prologue, introduction, preface, or foreword sections
- Extract 1-3 sentences from the start and 1-3 sentences from the end of each chapter
- Use 1 sentence if it's likely to be unique and 2-3 sentences if not
- These sentences might be messy and contain superfluous words due to imperfect source text
- Be sure to output the sentence(s) EXACTLY as they appear and in sequential order
- Ensure complete coverage - every part of the main content should belong to a chapter
- Chapter titles should be descriptive and based on the content if no explicit title is given

Full book content: ${bookContent}`,
      schema: z.object({
        chapters: z.array(chapterSchema).min(1).max(300),
      }),
    })

    return object.chapters
  } catch (error) {
    console.error(
      `Failed to parse chapters for "${bookContent.slice(0, 1000)}...":`,
      error,
    )
    return []
  }
}

export async function generateBookStructure(
  bookContent: string,
): Promise<{ title: string; content: string }[]> {
  const parsedChapters = await generateChapters(bookContent)

  const chapters = parsedChapters.map((chapter) => {
    try {
      const segment = extractSegment(
        bookContent,
        chapter.startSentences,
        chapter.endSentences,
      )
      return {
        title: chapter.chapterTitle,
        content: segment,
      }
    } catch (error) {
      console.error(
        `Failed to extract content for chapter "${chapter.chapterTitle}":`,
        error,
      )
      return {
        title: chapter.chapterTitle,
        content: "",
      }
    }
  })

  return chapters
}
