import type { InferInsertModel } from "drizzle-orm"
import {
  boolean,
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core"

export interface Chunk {
  index: number
  text: string
}

export const booksTable = pgTable("books", {
  id: varchar("id", { length: 12 }).primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  filename: text("filename").notNull(),
  sessionId: text("sessionId").notNull(),
  // used for books with no copyright protections
  alwaysVisible: boolean("alwaysVisible").notNull().default(false),
  chunks: json("chunks").$type<Chunk[]>().notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
})

export const chaptersTable = pgTable(
  "chapters",
  {
    id: varchar("id", { length: 12 }).primaryKey(),
    bookId: varchar("bookId", { length: 12 })
      .notNull()
      .references(() => booksTable.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    textStartChunk: integer("textStartChunk").notNull(),
    textEndChunk: integer("textEndChunk").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_chapters_book_id").on(table.bookId),
    index("idx_chapters_book_id_index").on(table.bookId, table.position),
  ],
)

export const keyPointsTable = pgTable(
  "key_points",
  {
    id: varchar("id", { length: 12 }).primaryKey(),
    chapterId: varchar("chapterId", { length: 12 })
      .notNull()
      .references(() => chaptersTable.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    text: text("text").notNull(),
    textStartChunk: integer("textStartChunk").notNull(),
    textEndChunk: integer("textEndChunk").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_key_points_chapter_id").on(table.chapterId),
    index("idx_key_points_chapter_order").on(table.chapterId, table.position),
  ],
)

export const keyDetailsTable = pgTable(
  "key_details",
  {
    id: varchar("id", { length: 12 }).primaryKey(),
    keyPointId: varchar("keyPointId", { length: 12 })
      .notNull()
      .references(() => keyPointsTable.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    text: text("text").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_key_details_key_point_id").on(table.keyPointId),
    index("idx_key_details_point_order").on(table.keyPointId, table.position),
  ],
)

// Has all fields including the id and makes createdAt optional
export type Book = InferInsertModel<typeof booksTable>
export type Chapter = InferInsertModel<typeof chaptersTable>
export type KeyPoint = InferInsertModel<typeof keyPointsTable>
export type KeyDetail = InferInsertModel<typeof keyDetailsTable>
