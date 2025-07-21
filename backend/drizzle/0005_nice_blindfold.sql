ALTER TABLE "books" ADD COLUMN "chunks" json NOT NULL;--> statement-breakpoint
ALTER TABLE "key_points" ADD COLUMN "contentStartChunk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "key_points" ADD COLUMN "contentEndChunk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "key_points" DROP COLUMN "sectionText";