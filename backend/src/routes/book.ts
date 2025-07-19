import { Hono } from "hono"
import { unlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  generateBookStructure,
  getOutline,
  orchestrateBookOutline,
  saveOutlineEntities,
} from "../lib/outline"
import { extractRawContentFromEpub } from "../lib/sources"
import { generateBookSummaries, getSummary, saveSummary } from "../lib/summary"
import type { OutlineEntities } from "../lib/types"

const app = new Hono()

app.post("/summarize", async (c) => {
  const formData = await c.req.formData()
  const fileEntry = formData.get("file")

  if (!fileEntry || !(fileEntry instanceof File)) {
    return c.json({ error: "No file uploaded" }, 400)
  }

  const isEpubExtension = fileEntry.name.toLowerCase().endsWith(".epub")
  const isEpubMimeType = fileEntry.type === "application/epub+zip"

  if (!isEpubExtension && !isEpubMimeType) {
    return c.json(
      {
        error: "Only EPUB files are supported",
        received: {
          filename: fileEntry.name,
          type: fileEntry.type,
        },
      },
      400,
    )
  }

  const arrayBuffer = await fileEntry.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const maxSizeBytes = 30 * 1024 * 1024 // 30MB
  if (buffer.length > maxSizeBytes) {
    return c.json(
      {
        error: "File too large",
        maxSize: "30MB",
        receivedSize: `${(buffer.length / 1024 / 1024).toFixed(2)}MB`,
      },
      413,
    )
  }

  const tempFilePath = join(tmpdir(), `upload_${Date.now()}.epub`)

  try {
    await writeFile(tempFilePath, buffer)

    let chapters: { title: string; content: string }[]
    let bookTitle: string
    let bookAuthor: string
    try {
      const rawBook = await extractRawContentFromEpub(tempFilePath)
      bookTitle = rawBook.title
      bookAuthor = rawBook.author
      chapters = await generateBookStructure(rawBook.content)
    } catch (extractError) {
      console.error("EPUB extraction failed:", extractError)
      return c.json(
        {
          error: "Failed to parse EPUB file",
          details:
            "The uploaded file may be corrupted or not a valid EPUB format",
        },
        400,
      )
    }

    let outlineResult: OutlineEntities
    try {
      outlineResult = await orchestrateBookOutline(
        chapters,
        bookTitle,
        bookAuthor,
        fileEntry.name,
      )
    } catch (generateError) {
      console.error("Outline generation failed:", generateError)
      return c.json(
        {
          error: "Failed to generate outline",
          details: "Could not process the book content to create an outline",
        },
        500,
      )
    }

    let bookId: string
    try {
      bookId = await saveOutlineEntities(
        outlineResult.book,
        outlineResult.chapters,
        outlineResult.keyPoints,
        outlineResult.keyDetails,
      )
    } catch (saveError) {
      console.error("Database save failed:", saveError)
      return c.json(
        {
          error: "Failed to save outline",
          details: "Could not save the generated outline to the database",
        },
        500,
      )
    }

    const completeOutline = await getOutline(bookId)
    if (!completeOutline) {
      return c.json({ error: "Failed to retrieve saved outline" }, 500)
    }

    let summaries: { l0Summary: string; l1Summary: string; l2Summary: string }
    try {
      summaries = await generateBookSummaries(completeOutline)
    } catch (summaryError) {
      console.error("Summary generation failed:", summaryError)
      return c.json(
        {
          error: "Failed to generate summaries",
          details: "Could not generate book summaries",
        },
        500,
      )
    }

    try {
      await saveSummary(
        bookId,
        summaries.l0Summary,
        summaries.l1Summary,
        summaries.l2Summary,
      )
    } catch (saveSummaryError) {
      console.error("Summary save failed:", saveSummaryError)
      return c.json(
        {
          error: "Failed to save summaries",
          details: "Could not save the generated summaries to the database",
        },
        500,
      )
    }

    return c.json({
      id: bookId,
      title: bookTitle,
      author: bookAuthor,
      outline: completeOutline,
      summaries,
    })
  } finally {
    await unlink(tempFilePath).catch(console.error)
  }
})

app.get("/:bookId", async (c) => {
  try {
    const bookId = c.req.param("bookId")

    if (!bookId) {
      return c.json({ error: "Book ID is required" }, 400)
    }

    const [outline, summary] = await Promise.all([
      getOutline(bookId),
      getSummary(bookId),
    ])

    if (!outline) {
      return c.json({ error: "Book not found" }, 404)
    }

    if (!summary) {
      return c.json({ error: "Summary not found for this book" }, 404)
    }

    return c.json({
      id: outline.id,
      title: outline.title,
      author: outline.author,
      outline,
      summaries: {
        l0Summary: summary.l0Summary,
        l1Summary: summary.l1Summary,
        l2Summary: summary.l2Summary,
      },
    })
  } catch (error) {
    console.error("Error fetching book:", error)
    if (error instanceof Error) {
      return c.json({ error: `Failed to fetch book: ${error.message}` }, 500)
    }
    return c.json({ error: "Failed to fetch book" }, 500)
  }
})

export default app
