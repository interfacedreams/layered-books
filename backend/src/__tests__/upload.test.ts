import { expect, test } from "bun:test"
import { Hono } from "hono"
import { readFileSync } from "node:fs"
import outline from "../routes/dev/outline"

const app = new Hono()
app.route("/dev/outline", outline)

test("should reject PNG file upload", async () => {
  const pngFile = new File(["fake png data"], "test.png", {
    type: "image/png",
  })

  const formData = new FormData()
  formData.append("file", pngFile)

  const response = await app.request("/dev/outline/generate", {
    method: "POST",
    body: formData,
  })

  expect(response.status).toBe(400)
})

test("should accept EPUB file upload", async () => {
  const epubBuffer = readFileSync("src/__tests__/test-book.epub")
  const epubFile = new File([epubBuffer], "test.epub", {
    type: "application/epub+zip",
  })

  const formData = new FormData()
  formData.append("file", epubFile)

  const response = await app.request("/dev/outline/generate", {
    method: "POST",
    body: formData,
  })

  expect(response.status).toBe(200)

  const result = (await response.json()) as any
  expect(result.author).toBe("Test Author")
  expect(result.title).toBe("Test Book")
  expect(result.outline).toBeDefined()
  expect(result.outline.chapters).toBeDefined()
  expect(result.outline.chapters.length).toBe(2)
  expect(result.outline.chapters[0].title).toBe("Chapter 1: Introduction")
  expect(result.outline.chapters[1].title).toBe("Chapter 2: Conclusion")
})
