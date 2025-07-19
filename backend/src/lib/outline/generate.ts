import { google } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"
import type { SemanticSection } from "../types"
import { generateId } from "../utils"

const semanticSectionSchema = z.object({
  startSentences: z
    .string()
    .describe(
      "VERBATIM copy of first 1-3 sentences of text for the semantic section that you choose - CHARACTER-FOR-CHARACTER identical including ALL punctuation, spaces, tabs, quotes",
    ),
  endSentences: z
    .string()
    .describe(
      "VERBATIM copy of last 1-3 sentences of text for the semantic section that you choose - CHARACTER-FOR-CHARACTER identical including ALL punctuation, spaces, tabs, quotes",
    ),
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
    console.log(
      `🤖 LLM START [${requestId}]: Generating outline for "${chapterTitle}"`,
    )
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      temperature: 0.3,
      prompt: `Generate a one sentence description of what this chapter covers and break it into 3-7 semantic sections with complete coverage and no gaps, flowing one after the other.

To distinguish each semantic section, extract 1-3 sentences from the start and 1-3 sentences from the end of that semantic section.
Use 1 sentence if its likely to be unique and 2-3 sentences if not.
Be sure to output the sentences EXACTLY as they appear and in the sequential order they appear.

${getStyleGuidelines("chapter descriptions and section descriptions")}

Chapter: ${chapterTitle}

Content: ${chapterContent}`,
      schema: chapterOutlineSchema,
    })

    console.log(
      `✅ LLM END [${requestId}]: Completed outline for "${chapterTitle}"`,
    )
    return object
  } catch (error) {
    console.error(
      `❌ LLM ERROR [${requestId}]: Failed to generate outline for "${chapterTitle}":`,
      error,
    )
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
    console.log(
      `🤖 LLM START [${requestId}]: Summarizing section from "${chapterTitle}"`,
    )
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

    console.log(
      `✅ LLM END [${requestId}]: Completed section summary from "${chapterTitle}"`,
    )
    return object.bulletPoints
  } catch (error) {
    console.error(
      `❌ LLM ERROR [${requestId}]: Failed to generate summaries for section from "${chapterTitle}":`,
      error,
    )
    return []
  }
}

function getStyleGuidelines(contentType: string): string {
  return `Style guidelines for ${contentType}:
- Use the author's voice and vocabulary from the text
- Be direct and concise 
- Do not start with 'This chapter', 'This section', or 'The author'
- Write complete sentences`
}
