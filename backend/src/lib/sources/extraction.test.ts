import { expect, test } from "bun:test"
import { join } from "node:path"
import { extractRawTextFromEpub } from "./epub"

const DEBUG = true

const bookName = "book.epub"
const ASSETS_DIR = join(process.cwd(), "tests/assets")
const epubPath = join(ASSETS_DIR, bookName)

test("EPUB extraction - basic functionality", async () => {
  const result = await extractRawTextFromEpub(epubPath)

  if (DEBUG) {
    console.log(
      `First 100 chunks: ${result.chunks
        .slice(0, 100)
        .map((chunk) => `{{ CHUNK ${chunk.index} }}\n${chunk.text}`)
        .join("\n")}`,
    )
  }
  expect(result.title).toBeDefined()
  expect(result.author).toBeDefined()
  expect(result.chunks).toBeDefined()
  expect(result.chunks.length).toBeGreaterThan(0)

  result.chunks.forEach((chunk, i) => {
    expect(chunk.index).toBe(i + 1)
    expect(chunk.text).toBeTruthy()
    expect(typeof chunk.text).toBe("string")
  })
})

test("EPUB extraction - chunk markers work correctly", async () => {
  const result = await extractRawTextFromEpub(epubPath)

  const contentWithChunkMarkers = result.chunks
    .map((chunk) => `{{ CHUNK ${chunk.index} }}\n${chunk.text}`)
    .join("\n\n")

  const markerRegex = /\{\{ CHUNK (\d+) \}\}/g
  const markers = [...contentWithChunkMarkers.matchAll(markerRegex)]

  expect(markers.length).toBe(result.chunks.length)

  markers.forEach((match, i) => {
    const chunkNumberStr = match[1]
    if (chunkNumberStr) {
      const chunkNumber = Number.parseInt(chunkNumberStr)
      expect(chunkNumber).toBe(i + 1)
    }
  })
})
