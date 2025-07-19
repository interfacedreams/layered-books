CREATE TABLE "summaries" (
	"id" varchar(12) PRIMARY KEY NOT NULL,
	"bookId" varchar(12) NOT NULL,
	"l0Summary" text NOT NULL,
	"l1Summary" text NOT NULL,
	"l2Summary" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "chapters" RENAME COLUMN "chapterIndex" TO "position";--> statement-breakpoint
ALTER TABLE "key_details" RENAME COLUMN "orderIndex" TO "position";--> statement-breakpoint
ALTER TABLE "key_points" RENAME COLUMN "orderIndex" TO "position";--> statement-breakpoint
DROP INDEX "idx_chapters_book_id_index";--> statement-breakpoint
DROP INDEX "idx_key_details_point_order";--> statement-breakpoint
DROP INDEX "idx_key_points_chapter_order";--> statement-breakpoint
ALTER TABLE "summaries" ADD CONSTRAINT "summaries_bookId_books_id_fk" FOREIGN KEY ("bookId") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_summaries_book_id" ON "summaries" USING btree ("bookId");--> statement-breakpoint
CREATE INDEX "idx_chapters_book_id_index" ON "chapters" USING btree ("bookId","position");--> statement-breakpoint
CREATE INDEX "idx_key_details_point_order" ON "key_details" USING btree ("keyPointId","position");--> statement-breakpoint
CREATE INDEX "idx_key_points_chapter_order" ON "key_points" USING btree ("chapterId","position");