import { google } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"

const semanticSectionSchema = z.object({
  description: z
    .string()
    .describe("One sentence description of what this section covers."),
  startChunk: z
    .number()
    .describe("The chunk number where this semantic section starts"),
  endChunk: z
    .number()
    .describe("The chunk number where this semantic section ends"),
})

const chapterOutlineSchema = z.object({
  description: z
    .string()
    .describe("One sentence description of what this chapter covers."),
  sections: z.array(semanticSectionSchema).min(3).max(9),
})

type AiChapterOutline = z.infer<typeof chapterOutlineSchema>

const keyDetailSchema = z.object({
  text: z.string().describe("1-2 sentence bullet point summary"),
  startChunk: z
    .number()
    .describe("The chunk number where this key detail starts"),
})

const sectionDetailsSchema = z
  .array(keyDetailSchema)
  .min(3)
  .max(7)
  .describe("1-2 sentence bullet point summaries of the section")

type AiSectionDetails = z.infer<typeof sectionDetailsSchema>

export async function generateChapterOutline(
  chapterText: string,
  chapterTitle: string,
): Promise<AiChapterOutline> {
  // Skip if chapter text is too short (less than 500 characters, ~100 words)
  if (!chapterText || chapterText.trim().length < 500) {
    return { description: "", sections: [] }
  }
  console.log(`🤖 [START] Generate chapter outline for ${chapterTitle}`)

  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      temperature: 0.3,
      prompt: `Generate a one sentence description of what this chapter covers and break it into 3-7 semantic sections with complete coverage and no gaps, flowing one after the other.

The text includes chunk markers in the format {{ CHUNK X }}. Use these chunk numbers to define the start and end chunks for each semantic section.
Each section should span one or more complete chunks (paragraphs).

${getStyleGuidelines("chapter descriptions and section descriptions")}

Chapter: ${chapterTitle}

Text: ${chapterText}`,
      schema: chapterOutlineSchema,
    })

    console.log(`✅ [END] Generate chapter outline for ${chapterTitle}`)
    return object
  } catch (error) {
    console.error(
      `❌ [ERROR] Generate chapter outline for ${chapterTitle}`,
      error,
    )
    return { description: "", sections: [] }
  }
}

export async function generateSectionDetails(
  sectionText: string,
  chapterTitle: string,
  sectionDescription: string,
  startChunk: number,
  endChunk: number,
): Promise<AiSectionDetails> {
  console.log(`🤖 [START] Generate section details for ${sectionDescription}`)
  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      temperature: 0.3,
      //   model: openai("gpt-4.1-mini"),
      //   model: google("gemini-2.5-pro"),
      prompt: `Given this key point: "${sectionDescription}"

Extract 3-7 supporting details that ENRICH and EXPAND on this key point without repeating it. 
Adjacent key details in this section should also be included.

The text includes chunk markers in the format {{ CHUNK X }}. For each key detail, identify the chunk number where that detail appears, and ensure the startChunk is between ${startChunk} and ${endChunk}.

${getStyleGuidelines("key details")}

Chapter title: ${chapterTitle}
Section text: ${sectionText}`,
      schema: sectionDetailsSchema,
    })

    console.log(`✅ [END] Generate section details for ${sectionDescription}`)
    return object
  } catch (error) {
    console.error(
      `❌ [ERROR] Generate section details for ${sectionDescription}`,
      error,
    )
    return []
  }
}

function getStyleGuidelines(contentType: string): string {
  return `Style guidelines for ${contentType}:
- Act as if you are the author taking readable, clear notes on the text.
- Use the text's voice and vocabulary
- Use declarative language
- Be direct and concise and keep it simple
- NEVER use terms like 'this chapter', 'this section', or 'the author'
- Write complete sentences`
}
