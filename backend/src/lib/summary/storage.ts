import { eq } from "drizzle-orm"
import { db } from "../db"
import { summariesTable, type Summary } from "../db/schema"
import { generateId } from "../utils"

export async function saveSummary(
  bookId: string,
  l0Summary: string,
  l1Summary: string,
  l2Summary: string,
): Promise<string> {
  const summaryId = generateId()
  
  const summary: Summary = {
    id: summaryId,
    bookId,
    l0Summary,
    l1Summary,
    l2Summary,
  }

  await db.insert(summariesTable).values(summary)
  
  return summaryId
}

export async function getSummary(bookId: string): Promise<Summary | null> {
  const result = await db
    .select()
    .from(summariesTable)
    .where(eq(summariesTable.bookId, bookId))
    .limit(1)

  return result[0] || null
}