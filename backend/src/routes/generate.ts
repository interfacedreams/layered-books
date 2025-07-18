import { unlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Hono } from "hono"
import {
  generateBookOutline,
  getOutline,
  saveOutlineEntities,
} from "../lib/outline"
import { extractBookFromEpub } from "../lib/sources"
import type { BookStructure, OutlineEntities } from "../lib/types"

const app = new Hono()

app.post("/generate", async (c) => {
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

    // Extract book structure from EPUB
    let bookStructure: BookStructure
    try {
      bookStructure = await extractBookFromEpub(tempFilePath)
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

    // Generate outline from book structure
    let outlineResult: OutlineEntities
    try {
      outlineResult = await generateBookOutline(bookStructure, fileEntry.name)
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

    // Save outline to database
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

    // Fetch complete outline
    const completeOutline = await getOutline(bookId)

    return c.json({
      author: bookStructure.author,
      title: bookStructure.title,
      outline: completeOutline,
    })
  } finally {
    await unlink(tempFilePath).catch(console.error)
  }
})

export default app
