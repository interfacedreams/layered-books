import { google } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"

const chapterSchema = z.object({
  chapterTitle: z
    .string()
    .describe(
      "The title of the chapter as it appears in the text, or a descriptive title if none is explicitly given",
    ),
  startChunk: z.number().describe("The chunk number where this chapter starts"),
  endChunk: z.number().describe("The chunk number where this chapter ends"),
})

const chaptersSchema = z.array(chapterSchema).min(1).max(300)

type AiChapters = z.infer<typeof chaptersSchema>

export async function generateChapters(bookText: string): Promise<AiChapters> {
  console.log("🤖 [START] Generate chapters")
  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      prompt: `Identify and extract all chapters from this book with complete coverage and no gaps, flowing one after the other.

The text includes chunk markers in the format {{ CHUNK X }}. Use these chunk numbers to define chapter boundaries.

Guidelines:
- Ignore any prologue, introduction, preface, or foreword sections
- Each chapter should span one or more complete chunks
- Use chunk numbers to define where each chapter starts and ends
- Ensure complete coverage - every chunk should belong to a chapter
- Chapter titles should be descriptive and based on the text if no explicit title is given
- Chapters should flow sequentially with no gaps or overlaps

Full book text: ${bookText}`,
      schema: chaptersSchema,
    })
    console.log("✅ [END] Generate chapters")
    return object
  } catch (error) {
    console.error("❌ [ERROR] Generate chapters", error)
    return []
  }
}
