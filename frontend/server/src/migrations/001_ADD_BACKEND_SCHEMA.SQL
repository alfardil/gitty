-- these migrations do not work with drizzle, so we need to run them manually

CREATE TABLE IF NOT EXISTS repo_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_hash TEXT,
    source TEXT,
    chunk TEXT,
    embedding vector(1536)
);

-- do this after the first migration
CREATE INDEX IF NOT EXISTS repo_chunks_cos_idx
ON repo_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

ANALYZE repo_chunks;