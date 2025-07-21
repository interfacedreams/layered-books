import * as cheerio from "cheerio"
import EPub from "epub"
import type { Chunk } from "../db/schema"
import type { BookStructure } from "../types"

export async function extractRawContentFromEpub(
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
  const chapterContents = await Promise.all(
    epub.flow.map(
      (chapter) =>
        new Promise<string>((resolve, reject) => {
          epub.getChapter(chapter.id, (error, text) => {
            if (error) reject(error)
            else {
              const $ = cheerio.load(text)
              const cleanText = $.text()
              resolve(cleanText)
            }
          })
        }),
    ),
  )

  // Create chunks based on paragraph breaks
  const chunks: Chunk[] = []
  let chunkIndex = 1

  for (const chapterContent of chapterContents) {
    if (!chapterContent.trim()) continue

    // Split chapter into paragraphs
    const paragraphs = chapterContent.split(/\n\s*\n/)

    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim()
      if (trimmedParagraph) {
        chunks.push({
          index: chunkIndex,
          content: trimmedParagraph,
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
