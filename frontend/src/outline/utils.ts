import type {
  BookOutline,
  OutlineChapter,
  OutlineDetail,
  OutlineKeyPoint,
} from "../types"

export interface OutlineNode {
  id: string
  content: string
  description?: string
  depth: number
  children?: OutlineNode[]
}

// A visible row in the outline, paired with the id of the node that contains it
export interface FlatOutlineNode {
  item: OutlineNode
  parentId: string | null
}

export function findPathToItem(
  outline: BookOutline,
  targetId: string,
): string[] {
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

// Given a chunk index (a reading position in the full text), find the id of the
// outline item that covers it at the current abstraction level
// (0 = chapter, 1 = key point, 2 = key detail). Picks the last item whose
// textStartChunk is at or before the chunk, so positions between items still
// resolve to the most recently started item.
export function findItemIdByChunk(
  outline: BookOutline,
  chunkIndex: number,
  abstractionLevel: number,
): string | null {
  let matchedChapter: OutlineChapter | undefined
  for (const chapter of outline.chapters) {
    if (chunkIndex >= chapter.textStartChunk) {
      matchedChapter = chapter
    } else {
      break
    }
  }
  matchedChapter = matchedChapter ?? outline.chapters[0]
  if (!matchedChapter) return null
  if (abstractionLevel <= 0) return matchedChapter.id

  let matchedKeyPoint: OutlineKeyPoint | undefined
  for (const keyPoint of matchedChapter.keyPoints ?? []) {
    if (chunkIndex >= keyPoint.textStartChunk) {
      matchedKeyPoint = keyPoint
    } else {
      break
    }
  }
  if (!matchedKeyPoint) return matchedChapter.id
  if (abstractionLevel === 1) return matchedKeyPoint.id

  let matchedDetail: OutlineDetail | undefined
  for (const detail of matchedKeyPoint.keyDetails ?? []) {
    if (chunkIndex >= detail.textStartChunk) {
      matchedDetail = detail
    } else {
      break
    }
  }
  return matchedDetail ? matchedDetail.id : matchedKeyPoint.id
}

export function transformOutlineToItems(outline: BookOutline): OutlineNode[] {
  return outline.chapters.map((chapter: OutlineChapter) => ({
    id: chapter.id,
    content: chapter.title,
    description: chapter.description,
    depth: 0,
    children:
      chapter.keyPoints?.map((keyPoint: OutlineKeyPoint) => ({
        id: keyPoint.id,
        content: keyPoint.text,
        depth: 1,
        children:
          keyPoint.keyDetails?.map((detail: OutlineDetail) => ({
            id: detail.id,
            content: detail.text,
            depth: 2,
          })) ?? [],
      })) ?? [],
  }))
}

// Which nodes start out expanded: everything above the current abstraction
// level, plus the ancestors of a deep-linked item so it is reachable on load.
export function getInitialExpandedIds(
  nodes: OutlineNode[],
  maxDepthExclusive: number,
  expansionPath: string[],
): Set<string> {
  const expanded = new Set<string>()
  const walk = (list: OutlineNode[]) => {
    for (const node of list) {
      if (node.depth < maxDepthExclusive || expansionPath.includes(node.id)) {
        expanded.add(node.id)
      }
      if (node.children) walk(node.children)
    }
  }
  walk(nodes)
  return expanded
}

// The outline as it is actually rendered, top to bottom. Arrow-key navigation
// walks this list, so collapsed subtrees are skipped for free.
export function flattenVisibleItems(
  nodes: OutlineNode[],
  expandedIds: Set<string>,
): FlatOutlineNode[] {
  const flat: FlatOutlineNode[] = []
  const walk = (list: OutlineNode[], parentId: string | null) => {
    for (const node of list) {
      flat.push({ item: node, parentId })
      if (expandedIds.has(node.id) && node.children?.length) {
        walk(node.children, node.id)
      }
    }
  }
  walk(nodes, null)
  return flat
}
