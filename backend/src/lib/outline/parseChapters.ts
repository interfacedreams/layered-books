import { generateObject } from "ai"
import { z } from "zod"
import { getGenerationSettings, getModel, type ModelChoice } from "./models"
import { getKeypointExamples, keyPointStyleGuidelines } from "./style"

const chapterSchema = z.object({
  chapterTitle: z
    .string()
    .describe(
      "The title of the chapter as it appears in the text, or a descriptive title if none is explicitly given",
    ),
  startChunk: z
    .number()
    .describe("The chunk integer where this chapter starts"),
  endChunk: z.number().describe("The chunk integer where this chapter ends"),
  keyPoint: z.string().describe(keyPointStyleGuidelines("chapter")),
})

const chaptersSchema = z.object({
  chapters: z.array(chapterSchema),
})

type AiChapters = z.infer<typeof chaptersSchema>

export async function generateChapters(
  bookText: string,
  apiKey?: string,
  model?: ModelChoice,
): Promise<AiChapters> {
  console.log("🤖 [START] Generate chapters")
  try {
    const { object } = await generateObject({
      model: getModel(apiKey, model),
      ...getGenerationSettings(model),
      prompt: `Identify and extract all chapters from this book with complete coverage and no gaps, flowing one after the other. There should be at least 1 chapter.

The text includes chunk markers in the format {{ CHUNK X }}. Use these chunk numbers to define chapter boundaries.

Guidelines:
- Ignore any prologue, introduction, preface, or foreword sections
- Each chapter should span one or more complete chunks
- Use chunk numbers to define where each chapter starts and ends
- Ensure complete coverage - every chunk should belong to a chapter
- Chapter titles should be descriptive and based on the text if no explicit title is given
- Chapters should flow sequentially with no gaps or overlaps

${getKeypointExamples()}


Full book text: ${bookText}`,
      schema: chaptersSchema,
    })
    console.log("✅ [END] Generate chapters")
    return object
  } catch (error) {
    console.error("❌ [ERROR] Generate chapters", error)
    return { chapters: [] }
  }
}
