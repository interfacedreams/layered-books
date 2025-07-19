import type {
  BookOutline,
  OutlineChapter,
  OutlineDetail,
  OutlineKeyPoint,
} from "../types/api"

export function findPathToItem(outline: BookOutline, targetId: string): string[] {
  for (const chapter of outline.chapters) {
    if (chapter.id === targetId) {
      return [chapter.id]
    }
    
    if (chapter.keyPoints) {
      for (const keyPoint of chapter.keyPoints) {
        if (keyPoint.id === targetId) {
          return [chapter.id, keyPoint.id]
        }
        
        if (keyPoint.keyDetails) {
          for (const detail of keyPoint.keyDetails) {
            if (detail.id === targetId) {
              return [chapter.id, keyPoint.id, detail.id]
            }
          }
        }
      }
    }
  }
  return []
}

export function transformOutlineToItems(outline: BookOutline) {
  return outline.chapters.map((chapter: OutlineChapter) => ({
    id: chapter.id,
    content: chapter.title,
    depth: 0,
    children:
      chapter.keyPoints?.map((keyPoint: OutlineKeyPoint) => ({
        id: keyPoint.id,
        content: keyPoint.pointText,
        depth: 1,
        children:
          keyPoint.keyDetails?.map((detail: OutlineDetail) => ({
            id: detail.id,
            content: detail.content,
            depth: 2,
          })) ?? [],
      })) ?? [],
  }))
}