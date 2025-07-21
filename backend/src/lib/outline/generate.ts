import { google } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"
import type { SemanticSection } from "../types"
import { generateId } from "../utils"

const semanticSectionSchema = z.object({
  startChunk: z
    .number()
    .describe("The chunk number where this semantic section starts"),
  endChunk: z
    .number()
    .describe("The chunk number where this semantic section ends"),
  description: z
    .string()
    .describe("One sentence description of what this section covers."),
})

const chapterOutlineSchema = z.object({
  description: z
    .string()
    .describe("One sentence description of what this chapter covers."),
  sections: z.array(semanticSectionSchema).min(3).max(9),
})

const sectionSummarySchema = z.object({
  bulletPoints: z
    .array(z.string())
    .min(3)
    .max(7)
    .describe("1-2 sentence bullet point summaries of the section"),
})

export async function generateChapterOutline(
  chapterContent: string,
  chapterTitle: string,
): Promise<{ description: string; sections: SemanticSection[] }> {
  // Skip if chapter content is too short (less than 500 characters, ~100 words)
  if (!chapterContent || chapterContent.trim().length < 500) {
    return { description: "", sections: [] }
  }

  const requestId = generateId()
  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      temperature: 0.3,
      prompt: `Generate a one sentence description of what this chapter covers and break it into 3-7 semantic sections with complete coverage and no gaps, flowing one after the other.

The content includes chunk markers in the format {{ CHUNK X }}. Use these chunk numbers to define the start and end chunks for each semantic section.
Each section should span one or more complete chunks (paragraphs).

${getStyleGuidelines("chapter descriptions and section descriptions")}

Chapter: ${chapterTitle}

Content: ${chapterContent}`,
      schema: chapterOutlineSchema,
    })

    return object
  } catch (error) {
    return { description: "", sections: [] }
  }
}

export async function generateSectionSummary(
  sectionContent: string,
  chapterTitle: string,
  sectionDescription: string,
): Promise<string[]> {
  const requestId = generateId()
  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      temperature: 0.3,
      //   model: openai("gpt-4.1-mini"),
      //   model: google("gemini-2.5-pro"),
      prompt: `Given this key point: "${sectionDescription}"

Extract 3-7 supporting details that ENRICH and EXPAND on this key point without repeating it. 
Adjacent key details in this section should also be included.

${getStyleGuidelines("key details")}

Section content: ${sectionContent}`,
      schema: sectionSummarySchema,
    })

    return object.bulletPoints
  } catch (error) {
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
