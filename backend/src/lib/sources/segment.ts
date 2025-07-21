import { nfkc } from "unorm"

function normalize(text: string) {
  return nfkc(text.trim())
    .replace(/[ \t]+/g, " ") // preserve newlines though!
    .replace(/[""]/g, '"') // Normalize curly quotes to straight quotes
    .replace(/['']/g, "'") // Normalize curly apostrophes to straight apostrophes
    .replace(/[–—]/g, "-")
}

export function extractSegmentByChunks(
  content: string, // Assumes chunks are in sequential order in the content
  startChunk: number,
  endChunk: number,
): string {
  // Step 1: Find all chunk markers and record where their content starts
  const chunkMarkerRegex = /\{\{ CHUNK (\d+) \}\}/g
  const chunks: {
    chunkNumber: number
    contentStartIndex: number
    contentEndIndex: number
  }[] = []

  let match: RegExpExecArray | null = chunkMarkerRegex.exec(content)
  while (match !== null) {
    if (match[1]) {
      const chunkNumber = Number.parseInt(match[1])
      const contentStartIndex = match.index + match[0].length // Right after the marker
      chunks.push({ chunkNumber, contentStartIndex, contentEndIndex: 0 }) // End will be calculated below
    }
    match = chunkMarkerRegex.exec(content)
  }

  // Step 2: Sort chunks by number to ensure proper order
  chunks.sort((a, b) => a.chunkNumber - b.chunkNumber)

  // Step 3: Calculate where each chunk's content ends
  for (let i = 0; i < chunks.length; i++) {
    const currentChunk = chunks[i]
    const nextChunk = chunks[i + 1]

    if (currentChunk) {
      if (nextChunk) {
        // Content ends right before the next chunk marker starts
        // We need to find where the next marker starts, not where its content starts
        const nextMarkerStart =
          nextChunk.contentStartIndex -
          `{{ CHUNK ${nextChunk.chunkNumber} }}`.length
        currentChunk.contentEndIndex = nextMarkerStart
      } else {
        // Last chunk goes to end of content
        currentChunk.contentEndIndex = content.length
      }
    }
  }

  // Step 4: Find the requested start and end chunks
  const startChunkData = chunks.find(
    (chunk) => chunk.chunkNumber === startChunk,
  )
  const endChunkData = chunks.find((chunk) => chunk.chunkNumber === endChunk)

  if (!startChunkData) {
    return ""
  }

  if (!endChunkData) {
    return ""
  }

  if (startChunk > endChunk) {
    return ""
  }

  // Step 5: Extract and normalize
  return normalize(
    content.slice(
      startChunkData.contentStartIndex,
      endChunkData.contentEndIndex,
    ),
  )
}
