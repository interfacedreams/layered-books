import { google } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"
import { filterOutlineByDepth } from "../outline"
import type { BookOutline, PartialBookOutline } from "../types"

const summarySchema = z.object({
  content: z
    .string()
    .describe("The summary content with {{id}} citations for leaf nodes"),
})

async function generateSummaryAtLevel(
  outline: PartialBookOutline,
  level: 0 | 1 | 2,
): Promise<string> {
  const targetParagraphs = level === 0 ? 1 : level === 1 ? 3 : 9
  const leafNodeType =
    level === 0 ? "chapters" : level === 1 ? "key points" : "key details"

  try {
    console.log(`🤖 LLM: Generating L${level} summary for "${outline.title}"`)
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      prompt: `Create a ${targetParagraphs}-paragraph summary of this book using the provided outline.

CITATION REQUIREMENTS:
- You MUST cite evidence using {{id}} format where id is the 12-character ID of leaf nodes
- For this abstraction level, the leaf nodes are the ${leafNodeType}
- Only cite leaf nodes (the deepest available level in the outline)
- Most often, cite one piece of evidence. Rarely, you may cite two pieces of evidence.
- When you want to cite two pieces of evidence, use this format: {{id1}} {{id2}}

Book: "${outline.title}" by ${outline.author}

Outline:
${JSON.stringify(outline, null, 2)}`,
      schema: summarySchema,
    })

    return object.content
  } catch (error) {
    console.error(
      `Failed to generate L${level} summary for "${outline.title}":`,
      error,
    )
    throw error
  }
}

export async function generateBookSummaries(fullOutline: BookOutline): Promise<{
  l0Summary: string
  l1Summary: string
  l2Summary: string
}> {
  const l0Outline = filterOutlineByDepth(fullOutline, 0)
  const l1Outline = filterOutlineByDepth(fullOutline, 1)
  const l2Outline = filterOutlineByDepth(fullOutline, 2)

  const [l0Summary, l1Summary, l2Summary] = await Promise.all([
    generateSummaryAtLevel(l0Outline, 0),
    generateSummaryAtLevel(l1Outline, 1),
    generateSummaryAtLevel(l2Outline, 2),
  ])

  return {
    l0Summary,
    l1Summary,
    l2Summary,
  }
}
