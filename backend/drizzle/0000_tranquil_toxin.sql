CREATE TABLE "books" (
	"id" varchar(12) PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"filename" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chapters" (
	"id" varchar(12) PRIMARY KEY NOT NULL,
	"bookId" varchar(12) NOT NULL,
	"chapterIndex" integer NOT NULL,
	"title" text NOT NULL,
	"rawContent" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "key_details" (
	"id" varchar(12) PRIMARY KEY NOT NULL,
	"keyPointId" varchar(12) NOT NULL,
	"orderIndex" integer NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "key_points" (
	"id" varchar(12) PRIMARY KEY NOT NULL,
	"chapterId" varchar(12) NOT NULL,
	"orderIndex" integer NOT NULL,
	"pointText" text NOT NULL,
	"sectionText" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_bookId_books_id_fk" FOREIGN KEY ("bookId") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "key_details" ADD CONSTRAINT "key_details_keyPointId_key_points_id_fk" FOREIGN KEY ("keyPointId") REFERENCES "public"."key_points"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "key_points" ADD CONSTRAINT "key_points_chapterId_chapters_id_fk" FOREIGN KEY ("chapterId") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_chapters_book_id" ON "chapters" USING btree ("bookId");--> statement-breakpoint
CREATE INDEX "idx_chapters_book_id_index" ON "chapters" USING btree ("bookId","chapterIndex");--> statement-breakpoint
CREATE INDEX "idx_key_details_key_point_id" ON "key_details" USING btree ("keyPointId");--> statement-breakpoint
CREATE INDEX "idx_key_details_point_order" ON "key_details" USING btree ("keyPointId","orderIndex");--> statement-breakpoint
CREATE INDEX "idx_key_points_chapter_id" ON "key_points" USING btree ("chapterId");--> statement-breakpoint
CREATE INDEX "idx_key_points_chapter_order" ON "key_points" USING btree ("chapterId","orderIndex");