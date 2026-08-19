import { type DbConnection, db } from "../db"
import {
  type Book,
  booksTable,
  type Chapter,
  chaptersTable,
  type KeyDetail,
  type KeyPoint,
  keyDetailsTable,
  keyPointsTable,
} from "../db/schema"

export async function saveBook(
  book: Book,
  tx: DbConnection = db,
): Promise<string> {
  const result = await tx
    .insert(booksTable)
    .values(book)
    .returning({ id: booksTable.id })
  return result[0]!.id
}

export async function saveChapters(
  chapters: Chapter[],
  tx: DbConnection = db,
): Promise<string[]> {
  if (chapters.length === 0) {
    return []
  }

  const result = await tx
    .insert(chaptersTable)
    .values(chapters)
    .returning({ id: chaptersTable.id })
  return result.map((row) => row.id)
}

export async function saveKeyPoints(
  keyPoints: KeyPoint[],
  tx: DbConnection = db,
): Promise<string[]> {
  if (keyPoints.length === 0) {
    return []
  }

  const result = await tx
    .insert(keyPointsTable)
    .values(keyPoints)
    .returning({ id: keyPointsTable.id })
  return result.map((row) => row.id)
}

export async function saveKeyDetails(
  keyDetails: KeyDetail[],
  tx: DbConnection = db,
): Promise<void> {
  if (keyDetails.length === 0) {
    return
  }

  await tx.insert(keyDetailsTable).values(keyDetails)
}

export async function saveOutlineEntities(
  book: Book,
  chapters: Chapter[],
  keyPoints: KeyPoint[],
  keyDetails: KeyDetail[],
): Promise<string> {
  return await db.transaction(async (tx) => {
    console.log("🤖 [START] Save outline entities")
    const bookId = await saveBook(book, tx)

    await saveChapters(chapters, tx)
    await saveKeyPoints(keyPoints, tx)
    await saveKeyDetails(keyDetails, tx)

    console.log("✅ [END] Save outline entities")
    return bookId
  })
}
