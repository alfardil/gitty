"""
Module for retrieving semantically similar text chunks from a PostgreSQL database using pgvector.

This script defines a function that:
- Embeds a given query using OpenAI's embedding model.
- Performs a similarity search against pre-embedded chunks stored in the `repo_chunks` table.
- Returns the top-k most relevant chunks based on cosine distance (via `<->` operator).

Intended for use in RAG pipelines where relevant context is retrieved from a vector database.
"""

import openai
from app.db.db import get_pool


async def similar_chunks(query: str, repo_hash: str, k: int = 5):
    """
    Retrieves the top-k most semantically similar chunks from the `repo_chunks` table.

    Uses OpenAI's embedding API to convert the query into a vector, then performs a similarity
    search using pgvector's `<->` operator (approximate cosine distance) against stored embeddings.
    Results are filtered to only include chunks from the specified repository.

    Args:
        query (str): The user query or prompt for which similar chunks are retrieved.
        repo_hash (str): The repository hash to filter results to (prevents cross-project contamination).
        k (int, optional): The number of top results to return. Defaults to 5.

    Returns:
        List[Record]: A list of rows, each containing `source`, `chunk`, and `distance` fields.
    """
    embed_model = "text-embedding-3-small"

    client = openai.AsyncOpenAI()
    q_emb = (
        (
            await client.embeddings.create(
                model=embed_model,
                input=[query],
                encoding_format="float",
            )
        )
        .data[0]
        .embedding
    )

    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT source,
                   chunk,
                   embedding <-> $1 AS distance
            FROM repo_chunks
            WHERE repo_hash = $3
            ORDER BY embedding <-> $1
            LIMIT $2;
            """,
            q_emb,
            k,
            repo_hash,
        )
    return rows
