"""
Module for embedding GitHub repository contents into a Postgres database using pgvector.

Intended for use in a RAG pipeline with semantic search over GitHub repository content.
Dependencies:
- OpenAI (async API client)
- LangChain text splitter
- PostgreSQL (with pgvector and pgcrypto)
"""

import hashlib
import json
from typing import List, Dict

import openai
from langchain.text_splitter import RecursiveCharacterTextSplitter
from app.db.db import get_pool

EMBED_MODEL = "text-embedding-3-small"
EMBED_DIM = 1536


def repo_hash(files: List[Dict]) -> str:
    """
    Computes a stable MD5 hash representing the entire repository's content.

    The hash is based on the sorted JSON serialization of file paths and their contents.
    This ensures that the same set of files will always produce the same hash, enabling
    efficient idempotency checks for embeddings.

    Args:
        files (List[Dict]): A list of file dictionaries, each with 'path' and 'content' keys.

    Returns:
        str: An MD5 hash string representing the repository.
    """
    return hashlib.md5(
        json.dumps(
            [{"path": f["path"], "content": f["content"]} for f in files],
            sort_keys=True,
        ).encode()
    ).hexdigest()


async def embed_repo_pgvector(file_contents: List[Dict]):
    """
    Embeds the content of a repository and stores it in a pgvector-enabled Postgres table.

    If the repository hash already exists in the database, the function returns early,
    skipping redundant computation. Otherwise, it splits the files into chunks,
    embeds them using OpenAI's embedding API, and bulk-inserts the results into Postgres.

    Args:
        file_contents (List[Dict]): A list of files with 'path' and 'content' fields.

    Returns:
        str: A message summarizing the result of the embedding operation.
    """
    pool = await get_pool()

    # ========== 1. Idempotency check ==========
    r_hash = repo_hash(file_contents)
    async with pool.acquire() as conn:
        exists = await conn.fetchval(
            "SELECT 1 FROM repo_chunks WHERE repo_hash=$1 LIMIT 1", r_hash
        )
    if exists:
        return f"Using cached pgvector embeddings for {len(file_contents)} files."

    # ========== 2. Split & embed ==========
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    docs, sources = [], []
    for f in file_contents:
        chunks = splitter.create_documents(
            [f["content"]], metadatas=[{"source": f["path"]}]
        )
        docs.extend(chunks)
        sources.extend([d.metadata["source"] for d in chunks])

    # Batch embed with the async OpenAI client
    client = openai.AsyncOpenAI()  # picks up OPENAI_API_KEY from env

    # Process in batches to avoid token limits (max 300k tokens per request)
    batch_size = 100  # Conservative batch size
    all_vectors = []

    for i in range(0, len(docs), batch_size):
        batch_docs = docs[i : i + batch_size]
        batch_texts = [d.page_content for d in batch_docs]

        resp = await client.embeddings.create(
            model=EMBED_MODEL,
            input=batch_texts,
        )
        batch_vectors = [record.embedding for record in resp.data]
        all_vectors.extend(batch_vectors)

    vectors = all_vectors

    # ========== 3. Bulk-insert ==========
    rows = [
        (r_hash, src, doc.page_content, vec)
        for src, doc, vec in zip(sources, docs, vectors)
    ]
    async with pool.acquire() as conn:
        await conn.executemany(
            """
            INSERT INTO repo_chunks (repo_hash, source, chunk, embedding)
            VALUES ($1, $2, $3, $4)
            """,
            rows,
        )

    return f"Embedded {len(rows)} chunks from {len(file_contents)} files into Postgres."
