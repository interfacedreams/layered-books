import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core"

export const books = pgTable("books", {
  id: varchar("id", { length: 12 }).primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  filename: text("filename").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
})

export const chapters = pgTable(
  "chapters",
  {
    id: varchar("id", { length: 12 }).primaryKey(),
    bookId: varchar("bookId", { length: 12 })
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    title: text("title").notNull(),
    rawContent: text("rawContent").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    bookIdIdx: index("idx_chapters_book_id").on(table.bookId),
    bookIdIndexIdx: index("idx_chapters_book_id_index").on(
      table.bookId,
      table.position,
    ),
  }),
)

export const keyPoints = pgTable(
  "key_points",
  {
    id: varchar("id", { length: 12 }).primaryKey(),
    chapterId: varchar("chapterId", { length: 12 })
      .notNull()
      .references(() => chapters.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    pointText: text("pointText").notNull(),
    sectionText: text("sectionText").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    chapterIdIdx: index("idx_key_points_chapter_id").on(table.chapterId),
    chapterOrderIdx: index("idx_key_points_chapter_order").on(
      table.chapterId,
      table.position,
    ),
  }),
)

export const keyDetails = pgTable(
  "key_details",
  {
    id: varchar("id", { length: 12 }).primaryKey(),
    keyPointId: varchar("keyPointId", { length: 12 })
      .notNull()
      .references(() => keyPoints.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    keyPointIdIdx: index("idx_key_details_key_point_id").on(table.keyPointId),
    pointOrderIdx: index("idx_key_details_point_order").on(
      table.keyPointId,
      table.position,
    ),
  }),
)
