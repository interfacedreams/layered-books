import { Hono } from "hono"
import EPub from "epub"
import { writeFile, unlink } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as cheerio from "cheerio"

const app = new Hono()

app.post("/", async (c) => {
  try {
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
    const tempFilePath = join(tmpdir(), `upload_${Date.now()}.epub`)

    try {
      await writeFile(tempFilePath, buffer)
      const epub = new EPub(tempFilePath)

      await new Promise<void>((resolve, reject) => {
        epub.on("end", resolve)
        epub.on("error", reject)
        epub.parse()
      })

      const author = epub.metadata.creator
      const title = epub.metadata.title
      const chapterTitles = epub.flow.map((chapter) => chapter.title)

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

      return c.json({
        message: "EPUB file uploaded and parsed successfully",
        filename: fileEntry.name,
        size: fileEntry.size,
        type: fileEntry.type,
        author,
        title,
        chapterTitles,
        chapterContents,
      })
    } catch (parseError) {
      console.error("EPUB parsing error:", parseError)
      return c.json({ error: "Failed to parse EPUB file" }, 400)
    } finally {
      await unlink(tempFilePath).catch(console.error)
    }
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: `Upload failed: ${error.message}` }, 500)
    }
    return c.json({ error: `Upload failed: ${error}` }, 500)
  }
})

export default app
