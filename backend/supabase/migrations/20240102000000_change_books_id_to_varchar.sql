-- Drop foreign key constraint first
ALTER TABLE chapters DROP CONSTRAINT chapters_book_id_fkey;

-- Change books table id from UUID to VARCHAR(12)
ALTER TABLE books ALTER COLUMN id TYPE VARCHAR(12);
ALTER TABLE books ALTER COLUMN id DROP DEFAULT;

-- Change chapters table book_id to VARCHAR(12)
ALTER TABLE chapters ALTER COLUMN book_id TYPE VARCHAR(12);

-- Recreate the foreign key constraint
ALTER TABLE chapters ADD CONSTRAINT chapters_book_id_fkey 
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE;