import { unlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { eq } from "drizzle-orm"
import { Hono } from "hono"
import { db } from "../lib/db"
import { booksTable } from "../lib/db/schema"
import {
  getOutline,
  orchestrateBookOutline,
  saveOutlineEntities,
} from "../lib/outline"
import { orchestrateChapters } from "../lib/outline/orchestrate"
import { extractRawTextFromEpub } from "../lib/sources"
import type {
  BookStructure,
  ChapterWithChunks,
  OutlineEntities,
} from "../lib/types"

const app = new Hono()

app.post("/summarize", async (c) => {
  const formData = await c.req.formData()
  const fileEntry = formData.get("file")
  const sessionId = formData.get("sessionId")

  if (!fileEntry || !(fileEntry instanceof File)) {
    return c.json({ error: "No file uploaded" }, 400)
  }

  if (!sessionId || typeof sessionId !== "string") {
    return c.json({ error: "Session ID is required" }, 400)
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

    let chapters: ChapterWithChunks[]
    let rawBook: BookStructure
    try {
      rawBook = await extractRawTextFromEpub(tempFilePath)

      const textWithMarkers = rawBook.chunks
        .map((chunk) => `{{ CHUNK ${chunk.index} }}\n${chunk.text}`)
        .join("\n\n")

      chapters = await orchestrateChapters(textWithMarkers)
    } catch (extractError) {
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
        rawBook.title,
        rawBook.author,
        fileEntry.name,
        sessionId,
        rawBook.chunks,
      )
    } catch (generateError) {
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
      return c.json(
        {
          error: `Failed to save outline: ${saveError}`,
          details: `Could not save the generated outline to the database: ${saveError}`,
        },
        500,
      )
    }

    const completeOutline = await getOutline(bookId)
    if (!completeOutline) {
      return c.json({ error: "Failed to retrieve saved outline" }, 500)
    }

    return c.json({
      id: bookId,
      title: rawBook.title,
      author: rawBook.author,
      outline: completeOutline,
    })
  } finally {
    await unlink(tempFilePath).catch(() => {})
  }
})

app.get("/all", async (c) => {
  try {
    const sessionId = c.req.header("x-session-id") // an id that is unique to the user's browser

    if (sessionId === undefined || typeof sessionId !== "string") {
      return c.json({ error: "Session ID is required" }, 400)
    }

    const books = await db
      .select({
        id: booksTable.id,
        title: booksTable.title,
        author: booksTable.author,
      })
      .from(booksTable)
      .where(eq(booksTable.sessionId, sessionId))
      .orderBy(booksTable.createdAt)

    return c.json(books)
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: `Failed to fetch books: ${error.message}` }, 500)
    }
    return c.json({ error: "Failed to fetch books" }, 500)
  }
})

app.get("/:bookId", async (c) => {
  try {
    const bookId = c.req.param("bookId")
    const sessionId = c.req.header("x-session-id")

    if (!bookId) {
      return c.json({ error: "Book ID is required" }, 400)
    }

    const outline = await getOutline(bookId)

    if (!outline) {
      return c.json({ error: "Book not found" }, 404)
    }

    if (!outline.alwaysVisible && outline.sessionId !== sessionId) {
      return c.json({ error: "Access denied" }, 403)
    }

    return c.json({
      id: outline.id,
      title: outline.title,
      author: outline.author,
      outline,
    })
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: `Failed to fetch book: ${error.message}` }, 500)
    }
    return c.json({ error: "Failed to fetch book" }, 500)
  }
})

export default app
