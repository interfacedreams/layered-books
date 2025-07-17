import { test, expect } from "bun:test"
import { Hono } from "hono"
import upload from "../routes/upload"
import { readFileSync } from "node:fs"

const app = new Hono()
app.route("/upload", upload)

test("should reject PNG file upload", async () => {
  const pngFile = new File(["fake png data"], "test.png", {
    type: "image/png",
  })

  const formData = new FormData()
  formData.append("file", pngFile)

  const response = await app.request("/upload", {
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

  const response = await app.request("/upload", {
    method: "POST",
    body: formData,
  })

  expect(response.status).toBe(200)
  
  const result = await response.json() as any
  expect(result.author).toBe("Test Author")
  expect(result.title).toBe("Test Book")
  expect(result.chapterTitles).toEqual(["Chapter 1: Introduction", "Chapter 2: Conclusion"])
})
