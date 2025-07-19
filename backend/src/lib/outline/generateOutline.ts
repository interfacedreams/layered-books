import { google } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"
import type { Book, Chapter, KeyDetail, KeyPoint } from "../db/schema"
import type { ChapterOutline, OutlineEntities } from "../types"
import { generateId } from "../utils"
import { extractSegment } from "./segment"

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
    .describe(
      "Direct statement about what this section covers. Do not start with 'This section' or 'The author'. Use author's voice.",
    ),
})

export type SemanticSection = z.infer<typeof semanticSectionSchema>

const sectionSummarySchema = z.object({
  bulletPoints: z
    .array(z.string())
    .min(3)
    .max(7)
    .describe("1-2 sentence bullet point summaries of the section"),
})

async function generateSections(
  chapterContent: string,
  chapterTitle: string,
): Promise<SemanticSection[]> {
  // Skip if chapter content is too short (less than 500 characters, ~100 words)
  if (!chapterContent || chapterContent.trim().length < 500) {
    return []
  }

  try {
    console.log(`🤖 LLM: Generating sections for "${chapterTitle}"`)
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      prompt: `Break this chapter into 3-7 semantic sections with complete coverage and no gaps, flowing one after the other.

To distinguish each semantic section, extract 1-3 sentences from the start and 1-3 sentences from the end of that semantic section.
Use 1 sentence if its likely to be unique and 2-3 sentences if not.
Be sure to output the sentences EXACTLY as they appear and in the sequential order they appear.

Chapter: ${chapterTitle}

Content: ${chapterContent}`,
      schema: z.object({
        sections: z.array(semanticSectionSchema).min(3).max(9),
      }),
    })

    return object.sections
  } catch (error) {
    console.error(`Failed to generate sections for "${chapterTitle}":`, error)
    return []
  }
}

async function summarizeSection(
  sectionContent: string,
  chapterTitle: string,
  sectionDescription: string,
): Promise<string[]> {
  try {
    console.log(`🤖 LLM: Summarizing section from "${chapterTitle}"`)
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      //   model: openai("gpt-4.1-mini"),
      //   model: google("gemini-2.5-pro"),
      prompt: `Given this key point: "${sectionDescription}"

Extract 3-7 supporting details that ENRICH and EXPAND on this key point without repeating it. 
Adjacent key details in this section should also be included.


Write direct statements in the author's voice. Do not start with "This section" or "The author".

Section content: ${sectionContent}`,
      schema: sectionSummarySchema,
    })

    return object.bulletPoints
  } catch (error) {
    console.error(
      `Failed to generate summaries for section from "${chapterTitle}":`,
      error,
    )
    return []
  }
}

async function generateChapterOutline(
  chapterContent: string,
  chapterTitle: string,
): Promise<ChapterOutline> {
  const sections = await generateSections(chapterContent, chapterTitle)

  const sectionSummaries = await Promise.all(
    sections.map(async (section) => {
      try {
        const sectionContent = extractSegment(
          chapterContent,
          section.startSentences,
          section.endSentences,
        )
        return await summarizeSection(
          sectionContent,
          chapterTitle,
          section.description,
        )
      } catch (error) {
        console.error(
          `Failed to extract/summarize section "${section.description}" from "${chapterTitle}":`,
          error,
        )
        return []
      }
    }),
  )

  return {
    chapterTitle,
    sections,
    sectionSummaries,
  }
}

export async function generateBookOutline(
  chapters: { title: string; content: string }[],
  bookTitle: string,
  bookAuthor: string,
  filename: string,
): Promise<OutlineEntities> {
  const bookId = generateId()

  const book: Book = {
    id: bookId,
    title: bookTitle,
    author: bookAuthor,
    filename,
  }

  const chapterEntities: Chapter[] = chapters.map((chapter, index) => ({
    id: generateId(),
    position: index,
    title: chapter.title,
    rawContent: chapter.content,
    bookId,
  }))

  const allKeyPoints: KeyPoint[] = []
  const allKeyDetails: KeyDetail[] = []

  await Promise.all(
    chapters.map(async (chapter, chapterIndex) => {
      const chapterId = chapterEntities[chapterIndex]!.id
      const outline = await generateChapterOutline(
        chapter.content,
        chapter.title,
      )

      const chapterKeyPoints: KeyPoint[] = outline.sections.map(
        (section, index) => {
          let sectionText = ""
          try {
            sectionText = extractSegment(
              chapter.content,
              section.startSentences,
              section.endSentences,
            )
          } catch (error) {
            console.error(
              `Failed to extract section text for "${section.description}":`,
              error,
            )
          }

          return {
            id: generateId(),
            position: index,
            pointText: section.description,
            sectionText,
            chapterId,
          }
        },
      )

      outline.sectionSummaries.forEach((summaries, keyPointIndex) => {
        const keyPointId = chapterKeyPoints[keyPointIndex]!.id

        summaries.forEach((content, detailIndex) => {
          allKeyDetails.push({
            id: generateId(),
            position: detailIndex,
            content,
            keyPointId,
          })
        })
      })

      allKeyPoints.push(...chapterKeyPoints)
    }),
  )

  return {
    book,
    chapters: chapterEntities,
    keyPoints: allKeyPoints,
    keyDetails: allKeyDetails,
  }
}
