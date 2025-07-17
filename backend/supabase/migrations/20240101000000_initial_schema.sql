-- Create books table
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    filename TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chapters table
CREATE TABLE chapters (
    id VARCHAR(12) PRIMARY KEY,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    chapter_index INTEGER NOT NULL,
    title TEXT NOT NULL,
    raw_content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create key_points table
CREATE TABLE key_points (
    id VARCHAR(12) PRIMARY KEY,
    chapter_id VARCHAR(12) NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    point_text TEXT NOT NULL,
    section_object JSONB NOT NULL, -- { page_number: number, content: string }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create key_details table
CREATE TABLE key_details (
    id VARCHAR(12) PRIMARY KEY,
    key_point_id VARCHAR(12) NOT NULL REFERENCES key_points(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_chapters_book_id ON chapters(book_id);
CREATE INDEX idx_chapters_book_id_index ON chapters(book_id, chapter_index);
CREATE INDEX idx_key_points_chapter_id ON key_points(chapter_id);
CREATE INDEX idx_key_points_chapter_order ON key_points(chapter_id, order_index);
CREATE INDEX idx_key_details_key_point_id ON key_details(key_point_id);
CREATE INDEX idx_key_details_point_order ON key_details(key_point_id, order_index);