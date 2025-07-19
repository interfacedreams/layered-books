import type { BookOutline, PartialBookOutline } from "../types"

export function filterOutlineByDepth(outline: BookOutline, depth: 0 | 1 | 2): PartialBookOutline {
  const chapters = outline.chapters.map(chapter => {
    const { keyPoints, ...chapterBase } = chapter

    if (depth >= 1) {
      return {
        ...chapterBase,
        keyPoints: keyPoints.map(keyPoint => {
          const { keyDetails, ...keyPointBase } = keyPoint

          if (depth >= 2) {
            return { ...keyPointBase, keyDetails }
          }
          return keyPointBase
        })
      }
    }
    
    return chapterBase
  })

  return {
    ...outline,
    chapters,
  }
}