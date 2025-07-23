import * as cheerio from "cheerio"
import EPub from "epub"
import type { Chunk } from "../db/schema"
import type { BookStructure } from "../types"

export async function extractRawTextFromEpub(
  tempFilePath: string,
): Promise<BookStructure> {
  const epub = new EPub(tempFilePath)

  await new Promise<void>((resolve, reject) => {
    epub.on("end", resolve)
    epub.on("error", reject)
    epub.parse()
  })

  const author = epub.metadata.creator ?? "Unknown Author"
  const title = epub.metadata.title ?? "Untitled Book"

  // These are not necessarily the true chapters. Epub files can be flawed.
  // We use an LLM for chapter extraction later.
  const chapterTexts = await Promise.all(
    epub.flow.map(
      (chapter) =>
        new Promise<string>((resolve, reject) => {
          epub.getChapter(chapter.id, (error, text) => {
            if (error) reject(error)
            else {
              const $ = cheerio.load(text)
              const paragraphs: string[] = []

              $("p, div:not(:has(p)), h1, h2, h3, h4, h5, h6").each(
                (_, element) => {
                  const paragraphText = $(element).text().trim()
                  if (paragraphText) {
                    const normalizedText = paragraphText
                      .replace(/\s+/g, " ")
                      .replace(/\n+/g, " ")
                      .replace(/\[pg \d+\]/g, "") // replace epub specific page numbers
                      .trim()
                    if (normalizedText.length > 10) {
                      paragraphs.push(normalizedText)
                    }
                  }
                },
              )

              resolve(paragraphs.join("\n\n"))
            }
          })
        }),
    ),
  )

  // Create chunks based on paragraph breaks
  const chunks: Chunk[] = []
  let chunkIndex = 1

  for (const chapterText of chapterTexts) {
    if (!chapterText.trim()) continue

    // Split chapter into paragraphs
    const paragraphs = chapterText.split(/\n\s*\n/)

    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim()
      if (trimmedParagraph) {
        chunks.push({
          index: chunkIndex,
          text: trimmedParagraph,
        })
        chunkIndex++
      }
    }
  }

  return {
    chunks,
    title,
    author,
  }
}
