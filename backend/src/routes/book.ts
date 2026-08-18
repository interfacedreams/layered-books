import { unlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Hono } from "hono"
import { countAllBooks, countUserBooks, fetchUserBooks } from "../lib/book"
import {
  DEFAULT_MODEL,
  type ModelChoice,
  modelProvider,
} from "../lib/outline/models"

const MAX_BOOK_CHARS = 1_300_000 // ~800 pages worth
const FREE_BOOK_LIMIT = 100
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

const VALID_MODELS: ModelChoice[] = [
  "sonnet-5",
  "gpt-5.6-sol",
  "haiku-4-5",
  "sonnet-4-5",
  "opus-4-5",
]

app.post("/summarize", async (c) => {
  const sessionId = c.req.header("x-session-id") // an id that is unique to the user's browser
  const anthropicApiKey = c.req.header("x-anthropic-api-key")
  const openaiApiKey = c.req.header("x-openai-api-key")
  const modelHeader = c.req.header("x-model") as ModelChoice | undefined

  // Users can only pick a model they hold the matching provider key for;
  // otherwise fall back to the default model on the server's key (free tier)
  const requestedModel: ModelChoice =
    modelHeader && VALID_MODELS.includes(modelHeader)
      ? modelHeader
      : DEFAULT_MODEL
  const keyFor = (m: ModelChoice) =>
    modelProvider(m) === "openai" ? openaiApiKey : anthropicApiKey
  // No key for the requested model: fall back to a model the user does hold a
  // key for, else the free-tier default on the server's key
  const fallbackModel: ModelChoice = anthropicApiKey
    ? DEFAULT_MODEL
    : openaiApiKey
      ? "gpt-5.6-sol"
      : DEFAULT_MODEL
  const model: ModelChoice = keyFor(requestedModel)
    ? requestedModel
    : fallbackModel
  const userApiKey = keyFor(model)
  const isFreeTier = !userApiKey

  if (model !== requestedModel) {
    console.log(`⚠️ No API key for ${requestedModel}, forcing ${DEFAULT_MODEL}`)
  }
  console.log(`🤖 Using model: ${model} (free tier: ${isFreeTier})`)

  if (!sessionId || typeof sessionId !== "string") {
    console.log("❌ Missing session ID")
    return c.json({ error: "Session ID is required" }, 400)
  }
  console.log(`📚 Upload request from session: ${sessionId}`)

  // Check if free tier is exhausted and user needs their own API key
  const totalBooks = await countAllBooks()
  console.log(`📊 Total books in system: ${totalBooks}`)
  if (totalBooks >= FREE_BOOK_LIMIT && !userApiKey) {
    console.log("❌ Free tier exhausted, user API key required")
    return c.json(
      {
        error: "API key required",
        code: "API_KEY_REQUIRED",
        details:
          "Free tier limit reached. Please provide your own OpenAI or Claude API key to continue.",
      },
      402,
    )
  }

  const formData = await c.req.formData()
  const fileEntry = formData.get("file")

  if (!fileEntry || !(fileEntry instanceof File)) {
    console.log("❌ No file in form data")
    return c.json({ error: "No file uploaded" }, 400)
  }
  console.log(`📄 File received: ${fileEntry.name} (${fileEntry.type})`)

  const isEpubExtension = fileEntry.name.toLowerCase().endsWith(".epub")
  const isEpubMimeType = fileEntry.type === "application/epub+zip"

  if (!isEpubExtension && !isEpubMimeType) {
    console.log(`❌ Not an EPUB: ${fileEntry.name} (${fileEntry.type})`)
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

  const count = await countUserBooks(sessionId)
  console.log(`📊 User has ${count} books`)
  if (count >= 10) {
    console.log("❌ User at max books (10)")
    return c.json(
      { error: "You have reached the maximum number of books" },
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

      // Check book size
      const totalChars = rawBook.chunks.reduce(
        (sum, chunk) => sum + chunk.text.length,
        0,
      )
      console.log(`📏 Book size: ${totalChars.toLocaleString()} characters`)
      if (totalChars > MAX_BOOK_CHARS) {
        console.log("❌ Book too large")
        return c.json(
          {
            error: "Book too large",
            code: "BOOK_TOO_LARGE",
            details: `This book exceeds the maximum size of ~800 pages. Your book has approximately ${Math.round(totalChars / 1625)} pages.`,
          },
          400,
        )
      }

      const textWithMarkers = rawBook.chunks
        .map((chunk) => `{{ CHUNK ${chunk.index} }}\n${chunk.text}`)
        .join("\n\n")

      chapters = await orchestrateChapters(textWithMarkers, userApiKey, model)

      if (chapters.length === 0) {
        console.log("❌ No chapters generated - AI call may have failed")
        return c.json(
          {
            error: "Failed to extract chapters",
            details: "Could not identify chapters in the book",
          },
          500,
        )
      }
      console.log(`✅ Extracted ${chapters.length} chapters`)
    } catch (extractError) {
      console.log("❌ Failed to parse EPUB:", extractError)
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
        userApiKey,
        model,
      )
    } catch (generateError) {
      console.log("❌ Failed to generate outline:", generateError)
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

app.get("/status", async (c) => {
  const anthropicApiKey = c.req.header("x-anthropic-api-key")
  const openaiApiKey = c.req.header("x-openai-api-key")
  const totalBooks = await countAllBooks()
  const freeBooksRemaining = Math.max(0, FREE_BOOK_LIMIT - totalBooks)
  const isFreeTierAvailable = freeBooksRemaining > 0
  const hasApiKey = !!(anthropicApiKey || openaiApiKey)

  return c.json({
    isFreeTierAvailable,
    freeBooksRemaining,
    hasApiKey,
    availableModels: [
      "sonnet-5",
      ...(anthropicApiKey ? ["haiku-4-5", "sonnet-4-5", "opus-4-5"] : []),
      ...(openaiApiKey ? ["gpt-5.6-sol"] : []),
    ],
  })
})

app.get("/all", async (c) => {
  try {
    const sessionId = c.req.header("x-session-id") // an id that is unique to the user's browser

    if (!sessionId || typeof sessionId !== "string") {
      return c.json({ error: "Session ID is required" }, 400)
    }

    const books = await fetchUserBooks(sessionId)
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

    // Sharing is disabled for now: books are only accessible by their creator,
    // regardless of the stored visibility setting.
    if (outline.sessionId !== sessionId) {
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
