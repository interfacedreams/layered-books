import { count, eq } from "drizzle-orm"
import { db } from "../db"
import { booksTable } from "../db/schema"

export const fetchUserBooks = async (sessionId: string) => {
  return await db
    .select({
      id: booksTable.id,
      title: booksTable.title,
      author: booksTable.author,
    })
    .from(booksTable)
    .where(eq(booksTable.sessionId, sessionId))
    .orderBy(booksTable.createdAt)
}

export const countUserBooks = async (sessionId: string) => {
  const result = await db
    .select({ count: count() })
    .from(booksTable)
    .where(eq(booksTable.sessionId, sessionId))

  return result[0]?.count ?? 0
}
