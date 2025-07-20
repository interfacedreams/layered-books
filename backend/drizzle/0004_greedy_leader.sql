ALTER TABLE "books" ADD COLUMN "sessionId" text;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "alwaysVisible" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "books" SET "sessionId" = 'legacy-book' WHERE "sessionId" IS NULL;--> statement-breakpoint
ALTER TABLE "books" ALTER COLUMN "sessionId" SET NOT NULL;