import { google } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"
import type {
  BookData,
  BookStructure,
  ChapterData,
  ChapterOutline,
  KeyDetailData,
  KeyPointData,
  OutlineEntities,
} from "../types"
import { extractSection } from "./extractSection"

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
      "One sentence summary of the section using vocabulary from the text",
    ),
})

export type SemanticSection = z.infer<typeof semanticSectionSchema>

async function generateSections(
  chapterContent: string,
  chapterTitle: string,
): Promise<SemanticSection[]> {
  // Skip if chapter content is too short (less than 500 characters, ~100 words)
  if (!chapterContent || chapterContent.trim().length < 500) {
    return []
  }

  try {
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
): Promise<string[]> {
  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      // model: openai("gpt-4.1-mini"),
      prompt: `Create 3-7 bullet point summaries for this section from chapter "${chapterTitle}".

Each bullet point should be a complete sentence 

Section content: ${sectionContent}`,
      schema: z.object({
        bulletPoints: z
          .array(z.string())
          .min(3)
          .max(7)
          .describe("Bullet point summaries of the section"),
      }),
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
        const sectionContent = extractSection(
          chapterContent,
          section.startSentences,
          section.endSentences,
        )
        return await summarizeSection(sectionContent, chapterTitle)
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
  bookStructure: BookStructure,
  filename: string,
): Promise<OutlineEntities> {
  const book: BookData = {
    title: bookStructure.title,
    author: bookStructure.author,
    filename,
  }

  const chapters: ChapterData[] = bookStructure.chapterTitles.map(
    (title, index) => ({
      position: index,
      title: title,
      rawContent: bookStructure.chapterContents[index] ?? "",
    }),
  )

  const keyPointsAndDetails = await Promise.all(
    bookStructure.chapterContents.map(async (content, chapterIndex) => {
      const chapterTitle =
        bookStructure.chapterTitles[chapterIndex] ??
        `Chapter ${chapterIndex + 1}`
      const outline = await generateChapterOutline(content, chapterTitle)

      const keyPoints: KeyPointData[] = outline.sections.map(
        (section, index) => {
          // Extract the actual section text using the start and end sentences
          let sectionText = ""
          try {
            sectionText = extractSection(
              content,
              section.startSentences,
              section.endSentences,
            )
          } catch (error) {
            console.error(
              `Failed to extract section text for "${section.description}":`,
              error,
            )
            sectionText = `${section.startSentences} ... ${section.endSentences}`
          }

          return {
            position: index,
            pointText: section.description,
            sectionText,
          }
        },
      )

      const keyDetails: KeyDetailData[][] = outline.sectionSummaries.map(
        (summaries) =>
          summaries.map((content, detailIndex) => ({
            position: detailIndex,
            content,
          })),
      )

      return { keyPoints, keyDetails }
    }),
  )

  const keyPoints = keyPointsAndDetails.map((result) => result.keyPoints)
  const keyDetails = keyPointsAndDetails.map((result) => result.keyDetails)

  return {
    book,
    chapters,
    keyPoints,
    keyDetails,
  }
}
