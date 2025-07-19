import { nfkc } from "unorm"

export function normalize(text: string) {
  return nfkc(text.trim())
    .replace(/[ \t]+/g, " ") // preserve newlines though!
    .replace(/[""]/g, '"') // Normalize curly quotes to straight quotes
    .replace(/['']/g, "'") // Normalize curly apostrophes to straight apostrophes
    .replace(/[–—]/g, "-")
}

function findUniqueIndex(
  content: string,
  target: string,
  type: "start" | "end",
  startPos = 0,
): number {
  let index = content.indexOf(target, startPos)

  if (index === -1) {
    // Cheaper models have typos but usually not in the first 5 words
    // Use the first 5 words as a fallback for matching
    const fallbackWords =
      type === "start"
        ? target.split(" ").slice(0, 5).join(" ")
        : target.split(" ").slice(-5).join(" ")

    index = content.indexOf(fallbackWords, startPos)
    if (index === -1) {
      throw new Error(
        `${type} sentences not found: "${target}" in "${content.slice(0, 1000)}..."`,
      )
    }

    const secondOccurrence = content.indexOf(fallbackWords, index + 1)
    if (secondOccurrence !== -1) {
      throw new Error(
        `${type} sentences not found: "${target}" (ambiguous 5-word match)`,
      )
    }
  }

  return index
}

export function extractSegment(
  content: string,
  startSentences: string,
  endSentences: string,
): string {
  const normalizedContent = normalize(content)
  const normalizedStart = normalize(startSentences)
  const normalizedEnd = normalize(endSentences)

  const startIndex = findUniqueIndex(
    normalizedContent,
    normalizedStart,
    "start",
    0,
  )
  const endIndex = findUniqueIndex(
    normalizedContent,
    normalizedEnd,
    "end",
    startIndex,
  )

  const adjustedEndIndex =
    normalizedContent.indexOf(normalizedEnd, startIndex) === -1
      ? endIndex + normalizedEnd.split(" ").slice(-5).join(" ").length
      : endIndex + normalizedEnd.length

  return normalizedContent.slice(startIndex, adjustedEndIndex)
}
