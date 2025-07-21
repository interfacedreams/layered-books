import { describe, expect, test } from "bun:test"
import { extractSegmentByChunks } from "../sources/segment"

describe("extractSegmentByChunks", () => {
  // Test content with multiple chunks
  const testContent = `{{ CHUNK 1 }}
First paragraph content here.
This is the first chunk.

{{ CHUNK 2 }}
Second paragraph content.
More content in chunk two.

{{ CHUNK 3 }}
Third paragraph here.
Final content in chunk three.

{{ CHUNK 4 }}
Fourth and final paragraph.
End of content.`

  test("should extract chunks in the middle of content", () => {
    // Extract chunks 2-3 (both in middle)
    const result = extractSegmentByChunks(testContent, 2, 3)

    expect(result).toContain("Second paragraph content.")
    expect(result).toContain("Third paragraph here.")
    expect(result).not.toContain("First paragraph content")
    expect(result).not.toContain("Fourth and final")
  })

  test("should extract from start chunk at beginning to middle chunk", () => {
    // Extract chunks 1-2 (start at beginning, end in middle)
    const result = extractSegmentByChunks(testContent, 1, 2)

    expect(result).toContain("First paragraph content here.")
    expect(result).toContain("Second paragraph content.")
    expect(result).not.toContain("Third paragraph here.")
    expect(result).not.toContain("Fourth and final")
  })

  test("should extract from middle chunk to end chunk", () => {
    // Extract chunks 3-4 (start in middle, end at end)
    const result = extractSegmentByChunks(testContent, 3, 4)

    expect(result).toContain("Third paragraph here.")
    expect(result).toContain("Fourth and final paragraph.")
    expect(result).not.toContain("First paragraph content")
    expect(result).not.toContain("Second paragraph content")
  })

  test("should extract single chunk", () => {
    // Extract just chunk 2
    const result = extractSegmentByChunks(testContent, 2, 2)

    expect(result).toContain("Second paragraph content.")
    expect(result).not.toContain("First paragraph content")
    expect(result).not.toContain("Third paragraph here.")
  })

  test("should extract all chunks", () => {
    // Extract all chunks 1-4
    const result = extractSegmentByChunks(testContent, 1, 4)

    expect(result).toContain("First paragraph content here.")
    expect(result).toContain("Second paragraph content.")
    expect(result).toContain("Third paragraph here.")
    expect(result).toContain("Fourth and final paragraph.")
  })

  test("should return empty string when startChunk > endChunk", () => {
    // Try to extract chunks 3-1 (backwards)
    const result = extractSegmentByChunks(testContent, 3, 1)

    expect(result).toBe("")
  })

  test("should return empty string when start chunk not found", () => {
    // Try to extract chunks 99-100 (don't exist)
    const result = extractSegmentByChunks(testContent, 99, 100)

    expect(result).toBe("")

    console.log("Start chunk not found (99-100):", result)
  })

  test("should return empty string when end chunk not found", () => {
    // Try to extract chunks 1-99 (end doesn't exist)
    const result = extractSegmentByChunks(testContent, 1, 99)

    expect(result).toBe("")
  })

  test("should return empty string when both chunks not found", () => {
    // Try to extract chunks 88-99 (neither exist)
    const result = extractSegmentByChunks(testContent, 88, 99)

    expect(result).toBe("")
  })

  test("should handle chunks with different number lengths", () => {
    const contentWithLargeNumbers = `{{ CHUNK 1 }}
First chunk.

{{ CHUNK 10 }}
Tenth chunk content here.

{{ CHUNK 100 }}
Hundredth chunk content.`

    const result = extractSegmentByChunks(contentWithLargeNumbers, 1, 10)

    expect(result).toContain("First chunk.")
    expect(result).toContain("Tenth chunk content here.")
    expect(result).not.toContain("Hundredth chunk content.")
  })

  test("should handle content with no chunks", () => {
    const contentWithoutChunks =
      "Just some regular content with no chunk markers."

    const result = extractSegmentByChunks(contentWithoutChunks, 1, 2)

    expect(result).toBe("")
  })

  test("should handle chunks with extra whitespace", () => {
    const contentWithWhitespace = `{{ CHUNK 1 }}


First paragraph with lots of whitespace.


{{ CHUNK 2 }}


Second paragraph here.


`

    const result = extractSegmentByChunks(contentWithWhitespace, 1, 2)

    expect(result).toContain("First paragraph with lots of whitespace.")
    expect(result).toContain("Second paragraph here.")
  })

  test("should handle chunks with gaps in numbering", () => {
    // Test chunks that are sequential in content but have gaps in numbering (e.g., 1, 3, 7)
    const gappedContent = `{{ CHUNK 1 }}
First chunk content.

{{ CHUNK 3 }}
Third chunk content.

{{ CHUNK 7 }}
Seventh chunk content.`

    const result = extractSegmentByChunks(gappedContent, 1, 3)

    // Should extract from chunk 1 to chunk 3
    expect(result).toContain("First chunk content.")
    expect(result).toContain("Third chunk content.")
    expect(result).not.toContain("Seventh chunk content.")
  })
})
